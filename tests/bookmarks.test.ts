import { describe, expect, it } from 'vitest';

import { findMatchingBookmark, sortBookmarks } from '../src/bookmarks';
import type { ReadingBookmark } from '../src/types';

const bookmarks: ReadingBookmark[] = [
	{
		id: 'later',
		sourcePath: 'Novel/02 Middle.md',
		fraction: 0.8,
		createdAt: '2026-07-22T18:00:00.000Z',
	},
	{
		id: 'start',
		sourcePath: 'Novel/01 Start.md',
		fraction: 0.2,
		createdAt: '2026-07-22T17:00:00.000Z',
	},
];

describe('bookmarks', () => {
	it('matches a nearby bookmark only in the same source', () => {
		expect(findMatchingBookmark(bookmarks, 'Novel/01 Start.md', 0.22)?.id).toBe('start');
		expect(findMatchingBookmark(bookmarks, 'Novel/02 Middle.md', 0.22)).toBeUndefined();
	});

	it('sorts by natural source order and then fraction', () => {
		expect(sortBookmarks(bookmarks).map((bookmark) => bookmark.id)).toEqual([
			'start',
			'later',
		]);
	});
});
