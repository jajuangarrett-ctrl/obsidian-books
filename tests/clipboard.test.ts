import { describe, expect, it, vi } from 'vitest';
import { copySelectedText } from '../src/reader/clipboard';

function fixture(writeText?: (text: string) => Promise<void>, copied = true) {
	const range = { cloneRange: () => range };
	const selection = {
		rangeCount: 1,
		getRangeAt: () => range,
		removeAllRanges: vi.fn(),
		addRange: vi.fn(),
	};
	const input = {
		value: '',
		readOnly: false,
		style: { cssText: '' },
		setAttribute: vi.fn(),
		focus: vi.fn(),
		select: vi.fn(),
		setSelectionRange: vi.fn(),
		remove: vi.fn(),
	};
	const document = {
		defaultView: { navigator: { clipboard: writeText ? { writeText } : undefined } },
		getSelection: () => selection,
		activeElement: { focus: vi.fn() },
		createElement: () => input,
		body: { appendChild: vi.fn() },
		execCommand: vi.fn(() => copied),
	};
	return {
		document: document as unknown as Document,
		input,
		selection,
		range,
		execCopy: document.execCommand,
	};
}

describe('selected passage copying', () => {
	it('copies a complete multiline selection through Clipboard', async () => {
		const write = vi.fn().mockResolvedValue(undefined);
		const { document, execCopy } = fixture(write);
		const passage = 'First paragraph.\n\nSecond paragraph — 日本語.';
		expect(await copySelectedText(document, passage)).toBe(true);
		expect(write).toHaveBeenCalledWith(passage);
		expect(execCopy).not.toHaveBeenCalled();
	});
	it.each([undefined, vi.fn().mockRejectedValue(new Error('Denied'))])(
		'falls back when Clipboard is unavailable or rejects, preserving selection',
		async (write) => {
			const { document, input, selection, range, execCopy } = fixture(write);
			expect(await copySelectedText(document, 'A section\nwith two lines')).toBe(true);
			expect(input.value).toBe('A section\nwith two lines');
			expect(execCopy).toHaveBeenCalledWith('copy');
			expect(input.remove).toHaveBeenCalled();
			expect(selection.addRange).toHaveBeenCalledWith(range);
		},
	);
	it('reports failure instead of claiming success and ignores empty selections', async () => {
		const { document, input, execCopy } = fixture(undefined, false);
		expect(await copySelectedText(document, 'selected')).toBe(false);
		expect(input.remove).toHaveBeenCalled();
		execCopy.mockClear();
		expect(await copySelectedText(document, '  ')).toBe(false);
		expect(execCopy).not.toHaveBeenCalled();
	});
});
