import {
	normalizePath,
	Notice,
	Platform,
	Plugin,
	TAbstractFile,
	TFile,
	type WorkspaceLeaf,
} from 'obsidian';

import { formatQuoteEntry, safeAnnotationFilename } from './annotations/quote-format';
import { findMatchingBookmark, sortBookmarks } from './bookmarks';
import { t } from './i18n';
import { BookLibrary } from './books/discovery';
import type { BookRecord } from './books/domain';
import { BookshelfView, VIEW_TYPE_BOOKSHELF } from './bookshelf/BookshelfView';
import { ReaderView, VIEW_TYPE_READER } from './reader/ReaderView';
import { migratePersistedData } from './settings-data';
import { ReaderSettingTab } from './settings-tab';
import type {
	BookProgressMap,
	PersistedData,
	PositionMap,
	ReaderSettings,
	ReadingBookmark,
	ReadingAnnotation,
} from './types';

export default class ObsidianBooksPlugin extends Plugin {
	public settings!: ReaderSettings;
	public positions: PositionMap = {};
	public bookProgress: BookProgressMap = {};
	public bookmarks: ReadingBookmark[] = [];
	public annotations: ReadingAnnotation[] = [];

	private lastSaved = '';
	private immersiveDocument: Document | null = null;
	private library!: BookLibrary;
	private cachedBooks: BookRecord[] | null = null;

	public async onload(): Promise<void> {
		const data = migratePersistedData(await this.loadData());
		this.settings = data.settings;
		this.positions = data.positions;
		this.bookProgress = data.bookProgress;
		this.bookmarks = data.bookmarks;
		this.annotations = data.annotations;
		this.library = new BookLibrary(this.app);
		this.lastSaved = JSON.stringify(this.dataBlob());

		this.registerView(VIEW_TYPE_READER, (leaf) => new ReaderView(leaf, this));
		this.registerView(VIEW_TYPE_BOOKSHELF, (leaf) => new BookshelfView(leaf, this));

		this.addRibbonIcon('library', t('ribbonBookshelf'), () => void this.openBookshelf());

		this.addRibbonIcon('book-open', t('ribbonOpen'), () => {
			const file = this.app.workspace.getActiveFile();
			if (file?.extension === 'md') void this.openReader(file);
			else new Notice(t('needMarkdown'));
		});

		this.addCommand({
			id: 'open-current-in-reader',
			name: t('commandOpen'),
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (file?.extension !== 'md') return false;
				if (!checking) void this.openReader(file);
				return true;
			},
		});

		this.registerObsidianProtocolHandler('books-open', (parameters) => {
			const id = parameters.id;
			if (typeof id === 'string') void this.openAnnotation(id);
		});

		this.addCommand({
			id: 'open-bookshelf',
			name: t('commandBookshelf'),
			callback: () => void this.openBookshelf(),
		});

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (!(file instanceof TFile) || file.extension !== 'md') return;
				menu.addItem((item) =>
					item
						.setTitle(t('menuOpen'))
						.setIcon('book-open')
						.onClick(() => void this.openReader(file)),
				);
			}),
		);

		this.addSettingTab(new ReaderSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				this.applyImmersive(leaf);
				if (leaf?.view instanceof BookshelfView) void leaf.view.refresh();
			}),
		);
		this.registerEvent(
			this.app.vault.on('rename', (file, oldPath) => this.handleRename(file, oldPath)),
		);
		this.registerEvent(this.app.vault.on('delete', (file) => this.handleDelete(file)));
		this.registerEvent(
			this.app.vault.on('create', () => {
				this.invalidateBooks();
			}),
		);
		this.registerEvent(
			this.app.metadataCache.on('changed', () => {
				this.invalidateBooks();
			}),
		);
		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (!(file instanceof TFile)) return;
				for (const view of this.readerViews()) {
					if (view.file?.path === file.path) void view.renderFile();
				}
			}),
		);

		this.registerInterval(
			window.setInterval(() => {
				const serialized = JSON.stringify(this.dataBlob());
				if (serialized === this.lastSaved) return;
				void this.saveData(JSON.parse(serialized)).then(() => {
					this.lastSaved = serialized;
				});
			}, 2000),
		);

		await this.saveAll();
	}

	public onunload(): void {
		void this.saveAll();
		document.body.removeClass('books-immersive', 'books-chrome-hidden');
		if (this.immersiveDocument && this.immersiveDocument !== document) {
			this.immersiveDocument.body?.removeClass('books-immersive', 'books-chrome-hidden');
		}
		this.immersiveDocument = null;
	}

	public async saveAll(): Promise<void> {
		const data = this.dataBlob();
		await this.saveData(data);
		this.lastSaved = JSON.stringify(data);
	}

	public async openReader(file: TFile): Promise<void> {
		const book = this.resolveBookForFile(file);
		const targetPath =
			book.manifestPath === file.path ? this.preferredChapterPath(book) : file.path;
		const target = this.app.vault.getAbstractFileByPath(targetPath);
		if (!(target instanceof TFile)) {
			new Notice(t('notFound'));
			return;
		}
		await this.openReaderTarget(target, book.id);
	}

	public async openBook(book: BookRecord, chapterPath?: string): Promise<void> {
		const targetPath = chapterPath ?? this.preferredChapterPath(book);
		const target = this.app.vault.getAbstractFileByPath(targetPath);
		if (!(target instanceof TFile)) {
			new Notice(t('notFound'));
			return;
		}
		await this.openReaderTarget(target, book.id);
	}

	public async openBookshelf(): Promise<void> {
		let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_BOOKSHELF)[0];
		if (!leaf) {
			leaf = this.app.workspace.getLeaf('tab');
			await leaf.setViewState({ type: VIEW_TYPE_BOOKSHELF, active: true });
		}
		await this.app.workspace.revealLeaf(leaf);
	}

	public getBooks(): BookRecord[] {
		this.cachedBooks ??= this.library.discover(Object.keys(this.positions));
		return this.cachedBooks;
	}

	public resolveBookForFile(file: TFile, hintedId?: string): BookRecord {
		return this.library.findForFile(file, Object.keys(this.positions), hintedId);
	}

	public resolveCoverUrl(book: BookRecord): string | undefined {
		return this.library.resolveCoverUrl(book);
	}

	public getBookFraction(book: BookRecord): number {
		const progress = this.bookProgress[book.id];
		if (!progress || !book.chapters.length) return 0;
		const index = book.chapters.findIndex((chapter) => chapter.path === progress.chapterPath);
		if (index < 0) return 0;
		return (index + progress.fraction) / book.chapters.length;
	}

	public updateBookProgress(book: BookRecord, chapterPath: string, fraction: number): void {
		this.bookProgress[book.id] = { chapterPath, fraction };
	}

	public getBookmarksForBook(book: BookRecord): ReadingBookmark[] {
		const chapterPaths = new Set(book.chapters.map((chapter) => chapter.path));
		return sortBookmarks(
			this.bookmarks.filter(
				(bookmark) => bookmark.bookId === book.id || chapterPaths.has(bookmark.sourcePath),
			),
		);
	}

	public findBookmark(sourcePath: string, fraction: number): ReadingBookmark | undefined {
		return findMatchingBookmark(this.bookmarks, sourcePath, fraction);
	}

	public toggleBookmark(book: BookRecord, sourcePath: string, fraction: number): boolean {
		const existing = this.findBookmark(sourcePath, fraction);
		if (existing) {
			this.removeBookmark(existing.id);
			return false;
		}

		this.bookmarks.push({
			id: `bookmark-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
			bookId: book.id,
			sourcePath,
			fraction,
			createdAt: new Date().toISOString(),
		});
		void this.saveAll();
		return true;
	}

	public removeBookmark(id: string): void {
		this.bookmarks = this.bookmarks.filter((bookmark) => bookmark.id !== id);
		void this.saveAll();
	}

	public getAnnotationsForSource(sourcePath: string): ReadingAnnotation[] {
		return this.annotations.filter((annotation) => annotation.sourcePath === sourcePath);
	}

	public addHighlight(annotation: ReadingAnnotation): void {
		this.annotations.push(annotation);
		void this.saveAll();
	}

	public async addQuote(book: BookRecord, annotation: ReadingAnnotation): Promise<void> {
		const destinationPath = this.quoteDestinationPath(book);
		await this.ensureParentFolder(destinationPath);
		const existing = this.app.vault.getAbstractFileByPath(destinationPath);
		const entry = formatQuoteEntry(annotation, this.app.vault.getName());
		if (existing instanceof TFile) {
			await this.app.vault.append(existing, `\n${entry}`);
		} else {
			await this.app.vault.create(destinationPath, `# Quotes — ${book.title}\n\n${entry}`);
		}
		annotation.destinationPath = destinationPath;
		this.annotations.push(annotation);
		await this.saveAll();
	}

	public removeAnnotation(id: string): void {
		this.annotations = this.annotations.filter((annotation) => annotation.id !== id);
		void this.saveAll();
	}

	public async openAnnotation(id: string): Promise<void> {
		const annotation = this.annotations.find((candidate) => candidate.id === id);
		if (!annotation) return;
		const file = this.app.vault.getAbstractFileByPath(annotation.sourcePath);
		if (!(file instanceof TFile)) {
			new Notice(t('notFound'));
			return;
		}
		const book = this.resolveBookForFile(file, annotation.bookId);
		await this.openReaderTarget(file, book.id, annotation.fraction);
	}

	private async openReaderTarget(
		file: TFile,
		bookId: string,
		initialFraction?: number,
	): Promise<void> {
		let leaf: WorkspaceLeaf;
		try {
			if (this.settings.openIn === 'current') leaf = this.app.workspace.getLeaf(false);
			else if (this.settings.openIn === 'split') leaf = this.app.workspace.getLeaf('split');
			else if (this.settings.openIn === 'window' && Platform.isDesktop) {
				leaf = this.app.workspace.getLeaf('window');
			} else leaf = this.app.workspace.getLeaf('tab');

			await leaf.setViewState({
				type: VIEW_TYPE_READER,
				active: true,
				state: { filePath: file.path, bookId, initialFraction },
			});
			await this.app.workspace.revealLeaf(leaf);
			this.applyImmersive(leaf);
		} catch (error) {
			console.error('Obsidian Books could not open the reader.', error);
			new Notice(t('openError'));
		}
	}

	public refreshOpenViews(): void {
		for (const view of this.readerViews()) {
			view.applySettings();
			view.requestRepagination();
		}
		this.applyImmersive(this.app.workspace.getActiveViewOfType(ReaderView)?.leaf ?? null);
	}

	public applyImmersive(leaf: WorkspaceLeaf | null): void {
		const ownerDocument = this.documentForLeaf(leaf);
		const isReader = leaf?.view instanceof ReaderView;
		const immersive = Boolean(isReader && this.settings.immersive);

		if (immersive) {
			if (this.immersiveDocument && this.immersiveDocument !== ownerDocument) {
				this.immersiveDocument.body?.removeClass('books-immersive', 'books-chrome-hidden');
			}
			ownerDocument.body?.addClass('books-immersive', 'books-chrome-hidden');
			this.immersiveDocument = ownerDocument;
			return;
		}

		ownerDocument.body?.removeClass('books-immersive', 'books-chrome-hidden');
		if (this.immersiveDocument === ownerDocument) this.immersiveDocument = null;
	}

	public toggleImmersiveChrome(ownerDocument: Document): void {
		ownerDocument.body?.toggleClass(
			'books-chrome-hidden',
			!ownerDocument.body.hasClass('books-chrome-hidden'),
		);
	}

	public showImmersiveChrome(ownerDocument: Document): void {
		ownerDocument.body?.removeClass('books-chrome-hidden');
	}

	public releaseImmersive(ownerDocument: Document): void {
		if (this.immersiveDocument !== ownerDocument) return;
		const activeLeaf = this.app.workspace.getActiveViewOfType(ReaderView)?.leaf ?? null;
		if (
			activeLeaf?.view instanceof ReaderView &&
			this.documentForLeaf(activeLeaf) === ownerDocument
		) {
			return;
		}
		ownerDocument.body?.removeClass('books-immersive', 'books-chrome-hidden');
		this.immersiveDocument = null;
	}

	private dataBlob(): PersistedData {
		return {
			schemaVersion: 4,
			settings: this.settings,
			positions: this.positions,
			bookProgress: this.bookProgress,
			bookmarks: this.bookmarks,
			annotations: this.annotations,
		};
	}

	private readerViews(): ReaderView[] {
		return this.app.workspace
			.getLeavesOfType(VIEW_TYPE_READER)
			.map((leaf) => leaf.view)
			.filter((view): view is ReaderView => view instanceof ReaderView);
	}

	private bookshelfViews(): BookshelfView[] {
		return this.app.workspace
			.getLeavesOfType(VIEW_TYPE_BOOKSHELF)
			.map((leaf) => leaf.view)
			.filter((view): view is BookshelfView => view instanceof BookshelfView);
	}

	private preferredChapterPath(book: BookRecord): string {
		const savedPath = this.bookProgress[book.id]?.chapterPath;
		return (
			book.chapters.find((chapter) => chapter.path === savedPath)?.path ??
			book.chapters[0]?.path ??
			book.manifestPath ??
			''
		);
	}

	private quoteDestinationPath(book: BookRecord): string {
		const settings = this.settings;
		if (settings.quoteDestination === 'single-note') {
			return normalizePath(this.ensureMarkdownExtension(settings.quotesNotePath));
		}
		if (settings.quoteDestination === 'per-book') {
			const name = book.kind === 'folder' ? 'Annotations.md' : `${safeAnnotationFilename(book.title)} Annotations.md`;
			return normalizePath(book.rootPath ? `${book.rootPath}/${name}` : name);
		}
		return normalizePath(
			`${settings.annotationsFolder}/${safeAnnotationFilename(book.title)}.md`,
		);
	}

	private ensureMarkdownExtension(path: string): string {
		return path.toLowerCase().endsWith('.md') ? path : `${path}.md`;
	}

	private async ensureParentFolder(path: string): Promise<void> {
		const slash = path.lastIndexOf('/');
		if (slash < 0) return;
		const parts = path.slice(0, slash).split('/').filter(Boolean);
		let current = '';
		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			if (!this.app.vault.getAbstractFileByPath(current)) {
				await this.app.vault.createFolder(current);
			}
		}
	}

	private invalidateBooks(): void {
		this.cachedBooks = null;
		for (const view of this.bookshelfViews()) void view.refresh();
	}

	private documentForLeaf(leaf: WorkspaceLeaf | null): Document {
		return leaf?.view.containerEl.ownerDocument ?? document;
	}

	private movePosition(from: string, to: string): void {
		const position = this.positions[from];
		if (!position) return;
		this.positions[to] = position;
		delete this.positions[from];
	}

	private handleRename(file: TAbstractFile, oldPath: string): void {
		this.movePosition(oldPath, file.path);
		const prefix = `${oldPath}/`;
		for (const path of Object.keys(this.positions)) {
			if (path.startsWith(prefix)) {
				this.movePosition(path, `${file.path}/${path.slice(prefix.length)}`);
			}
		}

		for (const view of this.readerViews()) {
			if (view.file) view.filePath = view.file.path;
		}

		const rewrite = (path: string): string => {
			if (path === oldPath) return file.path;
			const prefix = `${oldPath}/`;
			return path.startsWith(prefix) ? `${file.path}/${path.slice(prefix.length)}` : path;
		};
		for (const [bookId, progress] of Object.entries(this.bookProgress)) {
			const prefix = bookId.startsWith('folder:') ? 'folder:' : 'note:';
			const rewrittenId = `${prefix}${rewrite(bookId.slice(prefix.length))}`;
			const rewrittenProgress = {
				...progress,
				chapterPath: rewrite(progress.chapterPath),
			};
			if (rewrittenId !== bookId) delete this.bookProgress[bookId];
			this.bookProgress[rewrittenId] = rewrittenProgress;
		}
		this.bookmarks = this.bookmarks.map((bookmark) => {
			const idPrefix = bookmark.bookId?.startsWith('folder:') ? 'folder:' : 'note:';
			return {
				...bookmark,
				sourcePath: rewrite(bookmark.sourcePath),
				bookId: bookmark.bookId
					? `${idPrefix}${rewrite(bookmark.bookId.slice(bookmark.bookId.indexOf(':') + 1))}`
					: undefined,
			};
		});
		this.annotations = this.annotations.map((annotation) => {
			const idPrefix = annotation.bookId?.startsWith('folder:') ? 'folder:' : 'note:';
			return {
				...annotation,
				sourcePath: rewrite(annotation.sourcePath),
				destinationPath: annotation.destinationPath
					? rewrite(annotation.destinationPath)
					: undefined,
				bookId: annotation.bookId
					? `${idPrefix}${rewrite(annotation.bookId.slice(annotation.bookId.indexOf(':') + 1))}`
					: undefined,
			};
		});
		this.invalidateBooks();
	}

	private handleDelete(file: TAbstractFile): void {
		delete this.positions[file.path];
		const prefix = `${file.path}/`;
		for (const path of Object.keys(this.positions)) {
			if (path.startsWith(prefix)) delete this.positions[path];
		}

		for (const view of this.readerViews()) {
			if (view.filePath !== file.path && !view.filePath?.startsWith(prefix)) continue;
			view.file = null;
			view.filePath = null;
			void view.renderFile();
		}

		for (const [bookId, progress] of Object.entries(this.bookProgress)) {
			const sourcePath = bookId.slice(bookId.indexOf(':') + 1);
			if (
				sourcePath === file.path ||
				sourcePath.startsWith(prefix) ||
				progress.chapterPath === file.path ||
				progress.chapterPath.startsWith(prefix)
			) {
				delete this.bookProgress[bookId];
			}
		}
		this.bookmarks = this.bookmarks.filter(
			(bookmark) =>
				bookmark.sourcePath !== file.path && !bookmark.sourcePath.startsWith(prefix),
		);
		this.annotations = this.annotations
			.filter(
				(annotation) =>
					annotation.sourcePath !== file.path &&
					!annotation.sourcePath.startsWith(prefix),
			)
			.map((annotation) => ({
				...annotation,
				destinationPath:
					annotation.destinationPath === file.path ||
					annotation.destinationPath?.startsWith(prefix)
						? undefined
						: annotation.destinationPath,
			}));
		this.invalidateBooks();
	}
}
