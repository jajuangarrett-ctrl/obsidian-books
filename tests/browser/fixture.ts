// @ts-nocheck -- minimal Obsidian host mock for real DOM smoke testing.
import { ReaderView } from '../../src/reader/ReaderView';
import { DEFAULT_SETTINGS } from '../../src/settings-data';
for (const proto of [HTMLElement.prototype]) {
	Object.assign(proto, {
		addClass(...s) {
			this.classList.add(...s);
		},
		removeClass(...s) {
			this.classList.remove(...s);
		},
		toggleClass(s, b) {
			this.classList.toggle(s, b);
		},
		hasClass(s) {
			return this.classList.contains(s);
		},
		empty() {
			this.replaceChildren();
		},
		setText(s) {
			this.textContent = s;
		},
		setCssProps(o) {
			Object.assign(this.style, o);
		},
		createEl(tag, o = {}) {
			const el = document.createElement(tag);
			if (o.cls) el.className = o.cls;
			if (o.text) el.textContent = o.text;
			for (const [k, v] of Object.entries(o.attr || {})) el.setAttribute(k, v);
			this.append(el);
			return el;
		},
		createDiv(o) {
			return this.createEl('div', o);
		},
		createSpan(o) {
			return this.createEl('span', o);
		},
	});
	Object.defineProperty(proto, 'win', {
		get() {
			return window;
		},
	});
}
Node.prototype.instanceOf = function (c) {
	return this instanceof c;
};
const app = { keymap: { pushScope() {}, popScope() {} }, scope: {}, workspace: { on() {} } };
const plugin = {
	settings: { ...DEFAULT_SETTINGS },
	positions: {},
	getAnnotationsForSource: () => [],
	getBookmarkAt: () => null,
	getBookmarksForBook: () => [],
	getBookmarksForSource: () => [],
	showImmersiveChrome() {
		document.body.classList.remove('books-chrome-hidden');
	},
	applyImmersive() {
		document.body.classList.add('books-chrome-hidden');
	},
	releaseImmersive() {},
};
const leaf = { app };
app.workspace.activeLeaf = leaf;
const reader = new ReaderView(leaf, plugin);
window.reader = reader;
window.plugin = plugin;
await reader.onOpen();
reader.content.innerHTML = Array.from(
	{ length: 100 },
	(_, i) =>
		`<p>Section ${i + 1}. The quiet garden holds a different story each morning. Readers follow the path beside the river, watching leaves move in the wind and listening to birds in the trees. A notebook waits on the bench for observations and small discoveries.</p>`,
).join('');
reader.measure();
window.ready = true;
