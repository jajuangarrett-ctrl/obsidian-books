import fs from 'node:fs';
import { chromium } from 'playwright-core';
import esbuild from 'esbuild';
import path from 'node:path';
import os from 'node:os';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'books-reader-qa-'));
await esbuild.build({
	entryPoints: ['tests/browser/fixture.ts'],
	bundle: true,
	format: 'esm',
	outfile: path.join(dir, 'bundle.js'),
	alias: { obsidian: path.resolve('tests/browser/obsidian-stub.js') },
});
fs.copyFileSync('styles.css', path.join(dir, 'styles.css'));
fs.copyFileSync('tests/browser/index.html', path.join(dir, 'index.html'));
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.setContent(
	fs.readFileSync(dir + '/index.html', 'utf8').replace(/<script[^>]*><\/script>/, ''),
);
await page.addStyleTag({ content: fs.readFileSync(dir + '/styles.css', 'utf8') });
await page.addScriptTag({ type: 'module', content: fs.readFileSync(dir + '/bundle.js', 'utf8') });
await page.waitForTimeout(1000);
console.log(
	await page.evaluate(() => ({ ready: window.ready, columns: window.reader?.visibleColumns })),
);
const results = [];
const check = (label, ok) => {
	if (!ok) throw new Error(label);
	results.push(label);
};
await page.waitForTimeout(1500);
check(
	'auto hides within 1.5 seconds',
	await page.evaluate(() => reader.viewport.classList.contains('books-hide-ui')),
);
check(
	'host chrome auto hides',
	await page.evaluate(() => document.body.classList.contains('books-chrome-hidden')),
);
const before = await page.evaluate(() => ({
	page: reader.page,
	height: reader.stage.clientHeight,
}));
await page.mouse.click(195, 400);
check(
	'center restores controls without turn',
	await page.evaluate(
		(b) =>
			!reader.viewport.classList.contains('books-hide-ui') &&
			reader.page === b.page &&
			reader.stage.clientHeight === b.height,
		before,
	),
);
check(
	'host navigation restored by center',
	await page.evaluate(() => !document.body.classList.contains('books-chrome-hidden')),
);
// Regression: actual visible glyphs must not be occluded by either toolbar.
await page.evaluate(() => {
	reader.showControls();
	reader.page = 0;
	reader.applyTransform();
	reader.updateStatus();
});
await page.waitForTimeout(100);
const topGeometry = await page.evaluate(() => {
	const node = reader.content.querySelector('p').firstChild;
	const first = document.createRange();
	first.setStart(node, 0);
	first.setEnd(node, 1);
	const end = document.createRange();
	end.setStart(node, 25);
	end.setEnd(node, 26);
	const a = first.getBoundingClientRect(),
		b = end.getBoundingClientRect();
	const hit = document.elementFromPoint(a.left + a.width / 2, a.top + a.height / 2);
	const toolbar = reader.chapterBar.getBoundingClientRect();
	return {
		x: a.left + 1,
		y: a.top + a.height / 2,
		end: b.right - 1,
		top: a.top,
		toolbarBottom: toolbar.bottom,
		hit: reader.content.contains(hit),
	};
});
check(
	'top line visible and hit-testable with controls open',
	topGeometry.hit && topGeometry.top >= topGeometry.toolbarBottom,
);
await page.mouse.move(topGeometry.x, topGeometry.y);
await page.mouse.down();
await page.mouse.move(topGeometry.end, topGeometry.y, { steps: 10 });
await page.mouse.up();
check(
	'native top-line drag selection captured',
	await page.evaluate(() => Boolean(reader.captureSelection()?.selectedText)),
);
const selected = await page.evaluate(() => reader.captureSelection().selectedText);
await page.evaluate(() => {
	window.copiedText = null;
	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: {
			writeText: async (text) => {
				window.copiedText = text;
			},
		},
	});
});
await page.locator('.books-copy-button').click();
check(
	'copy toolbar copies selected top-line text',
	await page.evaluate((text) => window.copiedText === text, selected),
);
await page.evaluate(() => {
	reader.file = { path: 'Synthetic.md', basename: 'Synthetic' };
	reader.book = {
		id: 'note:Synthetic.md',
		title: 'Synthetic',
		chapters: [{ path: 'Synthetic.md', title: 'Synthetic' }],
	};
	plugin.addHighlight = (a) => {
		window.savedHighlight = a;
	};
});
await page.locator('.books-highlight-button').click();
check(
	'highlight toolbar persists selected top-line text',
	await page.evaluate(
		(text) =>
			window.savedHighlight?.selectedText === text &&
			reader.content.querySelector('mark')?.textContent === text,
		selected,
	),
);
check(
	'reader toolbar labels excluded from selection',
	await page.evaluate(() => getComputedStyle(reader.chapterBar).userSelect === 'none'),
);
await page.evaluate(() => {
	reader.dismissHighlightActions();
	document.activeElement.blur();
	reader.keyboardControls = false;
	reader.showControls();
});
await page.screenshot({ path: dir + '/controls-visible.png' });
check(
	'bottom text clears footer and remains hit-testable',
	await page.evaluate(() => {
		const bounds = reader.stage.getBoundingClientRect();
		const footer = reader.statusBar.getBoundingClientRect();
		const walker = document.createTreeWalker(reader.content, NodeFilter.SHOW_TEXT);
		let node;
		let last = null;
		while ((node = walker.nextNode())) {
			if (!node.textContent.trim()) continue;
			const r = document.createRange();
			r.selectNodeContents(node);
			const visible = Array.from(r.getClientRects()).filter(
				(x) =>
					x.right > bounds.left &&
					x.left < bounds.right &&
					x.top >= bounds.top &&
					x.bottom <= bounds.bottom,
			);
			for (const rect of visible) if (!last || rect.bottom > last.bottom) last = rect;
		}
		return (
			last &&
			last.bottom < footer.top &&
			reader.content.contains(
				document.elementFromPoint(
					Math.min(bounds.right - 2, Math.max(bounds.left + 2, last.left + 2)),
					last.top + last.height / 2,
				),
			)
		);
	}),
);
check(
	'copy capture excludes toolbar text across native range boundaries',
	await page.evaluate(() => {
		const range = document.createRange();
		range.selectNodeContents(reader.viewport);
		return reader.captureRange(range)?.selectedText === reader.content.textContent.trim();
	}),
);
check(
	'control-only selection is not captured as book text',
	await page.evaluate(() => {
		const range = document.createRange();
		range.selectNodeContents(reader.chapterBar);
		return reader.captureRange(range) === null;
	}),
);
check(
	'repeated temporary controls do not drift the reading position',
	await page.evaluate(() => {
		reader.setControlsVisible(false);
		reader.page = 5;
		reader.applyTransform();
		reader.updateStatus();
		reader.content.classList.add('books-measuring');
		reader.content.getBoundingClientRect();
		const initial = reader.page;
		for (let i = 0; i < 5; i++) {
			reader.setControlsVisible(true);
			reader.setControlsVisible(false);
		}
		reader.content.classList.remove('books-measuring');
		return reader.page === initial;
	}),
);

await page.evaluate(() => {
	reader.page = 5;
	reader.applyTransform();
	reader.updateStatus();
});
const fraction = await page.evaluate(() => reader.currentFraction());
await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(500);
check('landscape spread', await page.evaluate(() => reader.visibleColumns === 2));
check(
	'position stable to one spread',
	await page.evaluate(
		(f) => Math.abs(reader.currentFraction() - f) <= 1 / (reader.totalPages - 1),
		fraction,
	),
);
check(
	'stage fits landscape',
	await page.evaluate(
		() =>
			reader.stage.clientWidth <= reader.viewport.clientWidth &&
			reader.stage.clientHeight <= reader.viewport.clientHeight,
	),
);
await page.waitForTimeout(1500);
await page.screenshot({ path: dir + '/landscape.png' });
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
check('portrait returns to one page', await page.evaluate(() => reader.visibleColumns === 1));
await page.evaluate(() => {
	plugin.settings.fontSize = 2;
	reader.applySettings();
});
await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(500);
check('large text safe fallback', await page.evaluate(() => reader.visibleColumns === 1));
await page.evaluate(() => {
	plugin.settings.fontSize = 1;
	reader.applySettings();
});
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
await page.evaluate(() => {
	const range = document.createRange();
	range.selectNodeContents(reader.content.querySelector('p'));
	const sel = getSelection();
	sel.removeAllRanges();
	sel.addRange(range);
});
await page.waitForTimeout(1500);
check(
	'selection retains visible controls',
	await page.evaluate(() => !reader.viewport.classList.contains('books-hide-ui')),
);
await page.evaluate(() => getSelection().removeAllRanges());
await page.keyboard.press('Tab');
await page.waitForTimeout(1500);
check(
	'keyboard retains controls',
	await page.evaluate(() => !reader.viewport.classList.contains('books-hide-ui')),
);
await page.evaluate(() => {
	plugin.settings.autoHideControls = false;
	reader.applySettings();
});
await page.waitForTimeout(1500);
check(
	'auto hide opt out',
	await page.evaluate(() => !reader.viewport.classList.contains('books-hide-ui')),
);
await page.evaluate(() => {
	plugin.settings.autoHideControls = true;
	reader.keyboardControls = false;
	reader.applySettings();
	document.activeElement.blur();
});
await page.waitForTimeout(1500);
await page.screenshot({ path: dir + '/portrait.png' });
await page.evaluate(() => {
	plugin.settings.rememberPosition = false;
	reader.setControlsVisible(false);
	const figure = document.createElement('figure');
	figure.style.height = '740px';
	figure.style.breakInside = 'avoid';
	figure.textContent = 'Synthetic tall illustration';
	reader.content.prepend(figure);
	reader.measure();
	reader.page = 5;
	reader.applyTransform();
	reader.updateStatus();
	window.fallbackStart = reader.currentFraction();
	reader.controlsBoundary = null;
	reader.showControls();
});
await page.waitForTimeout(100);
check(
	'showing controls falls back safely for tall blocks without losing position',
	await page.evaluate(
		() =>
			reader.verticalMode && Math.abs(reader.currentFraction() - window.fallbackStart) < 0.02,
	),
);
await page.evaluate(() => {
	reader.controlsBoundary = null;
	reader.setControlsVisible(false);
});
await page.waitForTimeout(100);
check(
	'return from vertical layout keeps progress without a text anchor',
	await page.evaluate(
		() =>
			!reader.verticalMode &&
			Math.abs(reader.currentFraction() - window.fallbackStart) <=
				1 / (reader.totalPages - 1),
	),
);

check('no browser exceptions', errors.length === 0);
console.log(JSON.stringify({ results, screenshots: dir }, null, 2));

await browser.close();
