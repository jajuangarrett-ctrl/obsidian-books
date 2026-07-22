import { describe, expect, it } from 'vitest';

import { createTextAnchor, locateTextAnchor } from '../src/annotations/anchors';
import { formatQuoteEntry, safeAnnotationFilename } from '../src/annotations/quote-format';
import type { ReadingAnnotation } from '../src/types';

describe('annotation anchors', () => {
	it('uses surrounding context to recover the correct repeated passage after edits', () => {
		const original = 'First road home. Middle passage. Second road home. Last door.';
		const start = original.lastIndexOf('road home');
		const anchor = createTextAnchor(original, start, start + 'road home'.length);
		const edited = `New preface. ${original}`;

		expect(locateTextAnchor(edited, anchor)?.start).toBe(edited.lastIndexOf('road home'));
	});

	it('returns no location when the exact quote is gone', () => {
		expect(
			locateTextAnchor('A revised paragraph', {
				exact: 'missing text',
				prefix: '',
				suffix: '',
				startOffset: 0,
				endOffset: 12,
			}),
		).toBeUndefined();
	});
});

describe('quote formatting', () => {
	const annotation: ReadingAnnotation = {
		id: 'books-quote-1',
		kind: 'quote',
		sourcePath: 'Novel/01 Start.md',
		bookId: 'folder:Novel/Book.md',
		chapterTitle: 'Start',
		heading: 'The station',
		selectedText: 'A selected sentence.',
		anchor: createTextAnchor('A selected sentence.', 0, 20),
		fraction: 0.4,
		createdAt: '2026-07-22T18:00:00.000Z',
	};

	it('formats a source-backed quote with a reopen URI', () => {
		const entry = formatQuoteEntry(annotation, 'Test Vault');
		expect(entry).toContain('> A selected sentence.');
		expect(entry).toContain('[[Novel/01 Start|Start]]');
		expect(entry).toContain('obsidian://books-open?vault=Test+Vault&id=books-quote-1');
	});

	it('sanitizes destination filenames', () => {
		expect(safeAnnotationFilename('A: Book / Notes?')).toBe('A Book Notes');
	});
});
