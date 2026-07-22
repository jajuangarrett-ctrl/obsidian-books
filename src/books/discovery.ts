import { App, normalizePath, TFile } from 'obsidian';

import {
	basenameWithoutExtension,
	cleanWikiLink,
	folderName,
	isSingleNoteBook,
	naturalSortPaths,
	parseChapterReferences,
	type BookChapter,
	type BookRecord,
} from './domain';

const BOOK_MANIFEST = 'Book.md';

function stringProperty(frontmatter: Record<string, unknown>, key: string): string | undefined {
	const value = frontmatter[key];
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parentPath(path: string): string {
	const slash = path.lastIndexOf('/');
	return slash < 0 ? '' : path.slice(0, slash);
}

function pathInside(path: string, folder: string): boolean {
	return folder ? path.startsWith(`${folder}/`) : !path.includes('/');
}

export class BookLibrary {
	public constructor(private readonly app: App) {}

	public discover(recentPaths: readonly string[] = []): BookRecord[] {
		const markdownFiles = this.app.vault.getMarkdownFiles();
		const byPath = new Map(markdownFiles.map((file) => [file.path, file]));
		const manifests = markdownFiles.filter((file) => file.name === BOOK_MANIFEST);
		const roots = manifests.map((file) => parentPath(file.path));
		const folderBooks = manifests.map((manifest) =>
			this.folderBook(manifest, markdownFiles, roots),
		);

		const claimedPaths = new Set(
			folderBooks.flatMap((book) => [
				book.manifestPath ?? '',
				...book.chapters.map((c) => c.path),
			]),
		);
		const recent = new Set(recentPaths);
		const singleBooks = markdownFiles
			.filter((file) => {
				if (claimedPaths.has(file.path) || file.name === BOOK_MANIFEST) return false;
				const frontmatter = this.frontmatter(file);
				return recent.has(file.path) || isSingleNoteBook(frontmatter);
			})
			.map((file) => this.singleNoteBook(file));

		return [...folderBooks, ...singleBooks].sort((left, right) =>
			left.title.localeCompare(right.title, undefined, {
				numeric: true,
				sensitivity: 'base',
			}),
		);
	}

	public findForFile(
		file: TFile,
		recentPaths: readonly string[] = [],
		hintedId?: string,
	): BookRecord {
		const books = this.discover(recentPaths);
		const hinted = hintedId ? books.find((book) => book.id === hintedId) : undefined;
		if (hinted?.chapters.some((chapter) => chapter.path === file.path)) return hinted;

		const folderBook = books.find(
			(book) =>
				book.kind === 'folder' &&
				(book.manifestPath === file.path ||
					book.chapters.some((chapter) => chapter.path === file.path)),
		);
		return folderBook ?? this.singleNoteBook(file);
	}

	public resolveCoverUrl(book: BookRecord): string | undefined {
		if (!book.coverPath) return undefined;
		const file = this.app.vault.getAbstractFileByPath(book.coverPath);
		return file instanceof TFile ? this.app.vault.getResourcePath(file) : undefined;
	}

	private folderBook(
		manifest: TFile,
		markdownFiles: readonly TFile[],
		bookRoots: readonly string[],
	): BookRecord {
		const rootPath = parentPath(manifest.path);
		const frontmatter = this.frontmatter(manifest);
		const candidates = markdownFiles.filter((file) => {
			if (file.path === manifest.path || !pathInside(file.path, rootPath)) return false;
			return !bookRoots.some(
				(otherRoot) =>
					otherRoot !== rootPath &&
					pathInside(otherRoot, rootPath) &&
					pathInside(file.path, otherRoot),
			);
		});
		const candidatePaths = new Set(candidates.map((file) => file.path));
		const declared = parseChapterReferences(frontmatter.chapters);
		const declaredPaths = declared
			.map((reference) => this.resolveMarkdownReference(reference, manifest.path))
			.filter((path): path is string => path !== undefined && candidatePaths.has(path));
		const orderedPaths = declaredPaths.length
			? [...new Set(declaredPaths)]
			: naturalSortPaths(candidates.map((file) => file.path));
		const chapters = orderedPaths.map((path) => this.chapterForPath(path));
		if (!chapters.length) chapters.push(this.chapterForPath(manifest.path));

		return {
			id: `folder:${manifest.path}`,
			kind: 'folder',
			rootPath,
			manifestPath: manifest.path,
			title:
				stringProperty(frontmatter, 'title') ?? (folderName(rootPath) || 'Untitled book'),
			author: stringProperty(frontmatter, 'author'),
			coverPath: this.resolveAssetReference(
				stringProperty(frontmatter, 'cover'),
				manifest.path,
			),
			chapters,
		};
	}

	private singleNoteBook(file: TFile): BookRecord {
		const frontmatter = this.frontmatter(file);
		return {
			id: `note:${file.path}`,
			kind: 'note',
			rootPath: parentPath(file.path),
			title: stringProperty(frontmatter, 'title') ?? file.basename,
			author: stringProperty(frontmatter, 'author'),
			coverPath: this.resolveAssetReference(stringProperty(frontmatter, 'cover'), file.path),
			chapters: [this.chapterForFile(file)],
		};
	}

	private chapterForPath(path: string): BookChapter {
		const file = this.app.vault.getAbstractFileByPath(path);
		return file instanceof TFile
			? this.chapterForFile(file)
			: { path, title: basenameWithoutExtension(path) };
	}

	private chapterForFile(file: TFile): BookChapter {
		return {
			path: file.path,
			title: stringProperty(this.frontmatter(file), 'title') ?? file.basename,
		};
	}

	private frontmatter(file: TFile): Record<string, unknown> {
		return (this.app.metadataCache.getFileCache(file)?.frontmatter ?? {}) as Record<
			string,
			unknown
		>;
	}

	private resolveMarkdownReference(reference: string, sourcePath: string): string | undefined {
		const cleaned = cleanWikiLink(reference);
		if (!cleaned) return undefined;
		const destination = this.app.metadataCache.getFirstLinkpathDest(cleaned, sourcePath);
		if (destination?.extension === 'md') return destination.path;

		const sourceFolder = parentPath(sourcePath);
		const relativePath = normalizePath(`${sourceFolder}/${cleaned}`);
		const possibilities = relativePath.endsWith('.md')
			? [relativePath]
			: [`${relativePath}.md`, relativePath];
		return possibilities.find(
			(path) => this.app.vault.getAbstractFileByPath(path) instanceof TFile,
		);
	}

	private resolveAssetReference(
		reference: string | undefined,
		sourcePath: string,
	): string | undefined {
		if (!reference) return undefined;
		const cleaned = cleanWikiLink(reference);
		const destination = this.app.metadataCache.getFirstLinkpathDest(cleaned, sourcePath);
		if (destination) return destination.path;

		const relativePath = normalizePath(`${parentPath(sourcePath)}/${cleaned}`);
		return this.app.vault.getAbstractFileByPath(relativePath) instanceof TFile
			? relativePath
			: undefined;
	}
}
