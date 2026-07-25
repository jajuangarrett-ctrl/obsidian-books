import type { BookRecord } from '../books/domain';

export function visibleBooks(
	books: readonly BookRecord[],
	hiddenBookIds: ReadonlySet<string>,
): BookRecord[] {
	return books.filter((book) => !hiddenBookIds.has(book.id));
}
