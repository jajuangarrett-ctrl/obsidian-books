export type BookKind = 'folder' | 'note';

export interface BookChapter {
	path: string;
	title: string;
}

export interface BookRecord {
	id: string;
	kind: BookKind;
	rootPath: string;
	manifestPath?: string;
	title: string;
	author?: string;
	coverPath?: string;
	chapters: BookChapter[];
}

const NATURAL_COLLATOR = new Intl.Collator(undefined, {
	numeric: true,
	sensitivity: 'base',
});

export function naturalSortPaths(paths: readonly string[]): string[] {
	return [...paths].sort((left, right) => NATURAL_COLLATOR.compare(left, right));
}

export function cleanWikiLink(value: string): string {
	let result = value.trim();
	if (result.startsWith('!')) result = result.slice(1);
	if (result.startsWith('[[') && result.endsWith(']]')) result = result.slice(2, -2);
	const aliasAt = result.indexOf('|');
	if (aliasAt >= 0) result = result.slice(0, aliasAt);
	const headingAt = result.indexOf('#');
	if (headingAt >= 0) result = result.slice(0, headingAt);
	return result.trim();
}

export function parseChapterReferences(value: unknown): string[] {
	const values = Array.isArray(value)
		? value
		: typeof value === 'string'
			? value.split(/\r?\n|,/)
			: [];

	return values
		.map((item) => (typeof item === 'string' ? cleanWikiLink(item) : ''))
		.filter((item, index, items) => Boolean(item) && items.indexOf(item) === index);
}

export function isSingleNoteBook(frontmatter: unknown): boolean {
	if (typeof frontmatter !== 'object' || frontmatter === null) return false;
	const value = frontmatter as Record<string, unknown>;
	return (
		value.book === true ||
		value['obsidian-books'] === true ||
		(typeof value.type === 'string' && value.type.toLowerCase() === 'book')
	);
}

export function basenameWithoutExtension(path: string): string {
	const basename = path.slice(path.lastIndexOf('/') + 1);
	const dot = basename.lastIndexOf('.');
	return dot > 0 ? basename.slice(0, dot) : basename;
}

export function folderName(path: string): string {
	if (!path) return '';
	return path.slice(path.lastIndexOf('/') + 1);
}
