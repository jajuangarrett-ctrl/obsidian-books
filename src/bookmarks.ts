import type { ReadingBookmark } from './types';

export const BOOKMARK_MATCH_TOLERANCE = 0.025;

export function findMatchingBookmark(
	bookmarks: readonly ReadingBookmark[],
	sourcePath: string,
	fraction: number,
	tolerance = BOOKMARK_MATCH_TOLERANCE,
): ReadingBookmark | undefined {
	return bookmarks.find(
		(bookmark) =>
			bookmark.sourcePath === sourcePath &&
			Math.abs(bookmark.fraction - fraction) <= tolerance,
	);
}

export function sortBookmarks(bookmarks: readonly ReadingBookmark[]): ReadingBookmark[] {
	return [...bookmarks].sort((left, right) => {
		const pathOrder = left.sourcePath.localeCompare(right.sourcePath, undefined, {
			numeric: true,
			sensitivity: 'base',
		});
		return pathOrder || left.fraction - right.fraction;
	});
}
