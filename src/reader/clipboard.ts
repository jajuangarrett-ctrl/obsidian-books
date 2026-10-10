/** Copy from a user gesture, retaining native selection for older mobile WebViews. */
export async function copySelectedText(document: Document, text: string): Promise<boolean> {
	if (!text.trim()) return false;
	try {
		const clipboard = document.defaultView?.navigator.clipboard;
		if (clipboard?.writeText) {
			await clipboard.writeText(text);
			return true;
		}
	} catch {
		// Some mobile WebViews expose Clipboard but reject writes.
	}
	const selection = document.getSelection();
	const ranges = selection
		? Array.from({ length: selection.rangeCount }, (_, index) =>
				selection.getRangeAt(index).cloneRange(),
			)
		: [];
	const focused = document.activeElement;
	const input = document.createElement('textarea');
	input.value = text;
	input.readOnly = true;
	input.setAttribute('aria-label', 'Selected text to copy');
	input.className = 'books-clipboard-input';
	document.body.appendChild(input);
	try {
		input.focus({ preventScroll: true });
		input.select();
		input.setSelectionRange(0, text.length);
		return document.execCommand('copy');
	} catch {
		return false;
	} finally {
		input.remove();
		if (focused && 'focus' in focused) {
			(focused as HTMLElement).focus({ preventScroll: true });
		}
		selection?.removeAllRanges();
		for (const range of ranges) selection?.addRange(range);
	}
}
