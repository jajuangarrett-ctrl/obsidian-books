import { describe, expect, it } from 'vitest';

import type { BookRecord } from '../src/books/domain';
import { visibleBooks } from '../src/bookshelf/visibility';

function book(id: string): BookRecord {
	return {
		id,
		kind: 'note',
		rootPath: 'Library',
		title: id,
		chapters: [{ path: `${id}.md`, title: id }],
	};
}

describe('bookshelf visibility', () => {
	it('excludes hidden books without modifying the library records', () => {
		const books = [book('note:One.md'), book('note:Two.md')];

		expect(visibleBooks(books, new Set(['note:One.md'])).map((item) => item.id)).toEqual([
			'note:Two.md',
		]);
		expect(books).toHaveLength(2);
	});
});
