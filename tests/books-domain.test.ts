import { describe, expect, it } from 'vitest';

import {
	cleanWikiLink,
	isSingleNoteBook,
	naturalSortPaths,
	parseChapterReferences,
} from '../src/books/domain';

describe('book domain', () => {
	it('sorts fallback chapter paths with numeric awareness', () => {
		expect(
			naturalSortPaths(['Novel/10 Epilogue.md', 'Novel/2 Middle.md', 'Novel/1 Start.md']),
		).toEqual(['Novel/1 Start.md', 'Novel/2 Middle.md', 'Novel/10 Epilogue.md']);
	});

	it('normalizes wikilink chapter declarations without aliases or headings', () => {
		expect(
			parseChapterReferences(['[[01 Start|Opening]]', '[[02 Middle#Scene]]', '03 End']),
		).toEqual(['01 Start', '02 Middle', '03 End']);
		expect(cleanWikiLink('![[Cover.png|Cover]]')).toBe('Cover.png');
	});

	it('accepts comma and newline chapter declarations', () => {
		expect(parseChapterReferences('One, Two\nThree')).toEqual(['One', 'Two', 'Three']);
	});

	it('requires an explicit single-note book marker', () => {
		expect(isSingleNoteBook({ book: true })).toBe(true);
		expect(isSingleNoteBook({ type: 'Book' })).toBe(true);
		expect(isSingleNoteBook({ 'obsidian-books': true })).toBe(true);
		expect(isSingleNoteBook({ type: 'note' })).toBe(false);
	});
});
