export class Component {}
export class ItemView {
	constructor(leaf) {
		this.app = leaf.app;
		this.leaf = leaf;
		this.contentEl = document.querySelector('#root');
	}
	registerDomEvent(el, type, fn, opts) {
		el.addEventListener(type, fn, opts);
	}
	registerEvent() {}
	addChild() {}
	removeChild() {}
}
export class Modal {}
export class Notice {}
export class TFile {}
export class Scope {
	register() {}
}
export const Platform = { isDesktop: false };
export const MarkdownRenderer = {};
export const getLanguage = () => 'en';
