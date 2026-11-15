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
await page.waitForTimeout(3300);
check(
	'auto hides after idle',
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
await page.waitForTimeout(3300);
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
await page.waitForTimeout(3300);
check(
	'selection retains visible controls',
	await page.evaluate(() => !reader.viewport.classList.contains('books-hide-ui')),
);
await page.evaluate(() => getSelection().removeAllRanges());
await page.keyboard.press('Tab');
await page.waitForTimeout(3300);
check(
	'keyboard retains controls',
	await page.evaluate(() => !reader.viewport.classList.contains('books-hide-ui')),
);
await page.evaluate(() => {
	plugin.settings.autoHideControls = false;
	reader.applySettings();
});
await page.waitForTimeout(3300);
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
await page.waitForTimeout(3300);
await page.screenshot({ path: dir + '/portrait.png' });
check('no browser exceptions', errors.length === 0);
console.log(JSON.stringify({ results, screenshots: dir }, null, 2));

await browser.close();
