import {
	Component,
	ItemView,
	MarkdownRenderer,
	Notice,
	Platform,
	Scope,
	TFile,
	type Modifier,
	type ViewStateResult,
	type WorkspaceLeaf,
} from 'obsidian';

import type ObsidianBooksPlugin from '../main';
import { createTextAnchor, locateTextAnchor } from '../annotations/anchors';
import { BookContentsModal } from '../books/BookContentsModal';
import type { BookRecord } from '../books/domain';
import { chapterStatus, minutesLeft, pageStatus, t } from '../i18n';
import type { ReadingAnnotation, TextAnchor } from '../types';
import {
	calculateGeometry,
	calculateTranslation,
	calculateTotalPages,
	clampPage,
	fractionToPage,
	pageToFraction,
} from './pagination';

export const VIEW_TYPE_READER = 'obsidian-books-reader';

interface ReaderViewState {
	filePath?: string;
	bookId?: string;
	initialFraction?: number;
}

interface SelectionCapture {
	anchor: TextAnchor;
	selectedText: string;
	heading?: string;
	fraction: number;
}

const INTERACTIVE_SELECTOR = [
	'a',
	'input',
	'button',
	'textarea',
	'select',
	'[contenteditable]',
	'.task-list-item-checkbox',
	'.callout-fold',
	'.footnote-link',
	'.books-highlight',
	'audio',
	'video',
	'iframe',
	'.books-ui',
].join(', ');

export class ReaderView extends ItemView {
	public file: TFile | null = null;
	public filePath: string | null = null;

	private book: BookRecord | null = null;
	private bookId: string | null = null;
	private page = 0;
	private totalPages = 1;
	private pageStride = 0;
	private columnGap = 0;
	private alignmentOffset = 0;
	private measured = false;
	private pendingFraction: number | null = null;
	private requestedFraction: number | null = null;
	private renderGeneration = 0;
	private lastTouchAt = 0;
	private chapterMinutes = 1;

	private viewport!: HTMLElement;
	private chapterBar!: HTMLElement;
	private contentsButton!: HTMLButtonElement;
	private bookmarkButton!: HTMLButtonElement;
	private highlightButton!: HTMLButtonElement;
	private quoteButton!: HTMLButtonElement;
	private bookTitleText!: HTMLElement;
	private chapterTitleText!: HTMLElement;
	private previousChapterButton!: HTMLButtonElement;
	private nextChapterButton!: HTMLButtonElement;
	private stage!: HTMLElement;
	private content!: HTMLElement;
	private previousButton!: HTMLButtonElement;
	private nextButton!: HTMLButtonElement;
	private progressFill!: HTMLElement;
	private statusText!: HTMLElement;
	private selectionCapture: SelectionCapture | null = null;

	private renderChild: Component | null = null;
	private resizeObserver: ResizeObserver | null = null;
	private readerScope: Scope | null = null;
	private scopePushed = false;
	private animationFrame: number | null = null;
	private repaginateTimer: number | null = null;
	private turnTimer: number | null = null;
	private debouncedRemeasure: (() => void) | null = null;

	public constructor(
		leaf: WorkspaceLeaf,
		private readonly booksPlugin: ObsidianBooksPlugin,
	) {
		super(leaf);
	}

	public getViewType(): string {
		return VIEW_TYPE_READER;
	}

	public getDisplayText(): string {
		return this.book?.title ?? this.file?.basename ?? t('fallbackTitle');
	}

	public getIcon(): string {
		return 'book-open';
	}

	public getState(): Record<string, unknown> {
		return { filePath: this.filePath, bookId: this.bookId };
	}

	public async setState(state: unknown, result: ViewStateResult): Promise<void> {
		const readerState = this.parseState(state);
		if (
			readerState.filePath &&
			(readerState.filePath !== this.filePath ||
				readerState.bookId !== this.bookId ||
				readerState.initialFraction !== undefined)
		) {
			this.savePosition();
			this.filePath = readerState.filePath;
			this.bookId = readerState.bookId ?? null;
			this.requestedFraction = readerState.initialFraction ?? null;
			const abstractFile = this.app.vault.getAbstractFileByPath(readerState.filePath);
			this.file = abstractFile instanceof TFile ? abstractFile : null;
			await this.renderFile();
		}
		await super.setState(state, result);
	}

	public async onOpen(): Promise<void> {
		this.contentEl.addClass('books-view-content');

		this.viewport = this.contentEl.createDiv({ cls: 'books-viewport' });
		this.viewport.tabIndex = 0;
		this.viewport.setAttribute('role', 'region');
		this.viewport.setAttribute('aria-roledescription', 'paginated book reader');
		this.viewport.setAttribute('aria-label', t('aria'));

		this.chapterBar = this.viewport.createDiv({ cls: 'books-chapterbar books-ui' });
		const chapterLeading = this.chapterBar.createDiv({ cls: 'books-chapter-actions' });
		this.contentsButton = chapterLeading.createEl('button', {
			cls: 'books-chapter-button books-contents-button',
			text: '☰',
			attr: { type: 'button', 'aria-label': t('contents') },
		});
		this.bookmarkButton = chapterLeading.createEl('button', {
			cls: 'books-chapter-button books-bookmark-button',
			text: '☆',
			attr: { type: 'button', 'aria-label': t('addBookmark') },
		});
		this.highlightButton = chapterLeading.createEl('button', {
			cls: 'books-chapter-button books-highlight-button',
			text: '▰',
			attr: { type: 'button', 'aria-label': t('highlightSelection') },
		});
		this.quoteButton = chapterLeading.createEl('button', {
			cls: 'books-chapter-button books-quote-button',
			text: '❝',
			attr: { type: 'button', 'aria-label': t('saveQuote') },
		});
		this.highlightButton.disabled = true;
		this.quoteButton.disabled = true;
		const chapterLabels = this.chapterBar.createDiv({ cls: 'books-chapter-labels' });
		this.bookTitleText = chapterLabels.createDiv({ cls: 'books-book-title' });
		this.chapterTitleText = chapterLabels.createDiv({ cls: 'books-chapter-title' });
		const chapterActions = this.chapterBar.createDiv({
			cls: 'books-chapter-actions books-chapter-navigation',
		});
		this.previousChapterButton = chapterActions.createEl('button', {
			cls: 'books-chapter-button',
			text: '‹',
			attr: { type: 'button', 'aria-label': t('previousChapter') },
		});
		this.nextChapterButton = chapterActions.createEl('button', {
			cls: 'books-chapter-button',
			text: '›',
			attr: { type: 'button', 'aria-label': t('nextChapter') },
		});

		this.stage = this.viewport.createDiv({ cls: 'books-stage' });
		this.stage.setAttribute('role', 'main');
		this.content = this.stage.createDiv({ cls: 'books-content markdown-rendered' });
		this.content.setAttribute('role', 'article');

		this.previousButton = this.viewport.createEl('button', {
			cls: 'books-nav-button books-previous books-ui',
			attr: { 'aria-label': t('previousPage'), type: 'button' },
		});
		this.previousButton.setText('‹');

		this.nextButton = this.viewport.createEl('button', {
			cls: 'books-nav-button books-next books-ui',
			attr: { 'aria-label': t('nextPage'), type: 'button' },
		});
		this.nextButton.setText('›');

		const statusBar = this.viewport.createDiv({ cls: 'books-statusbar books-ui' });
		statusBar.setAttribute('role', 'status');
		statusBar.setAttribute('aria-live', 'polite');
		statusBar.setAttribute('aria-atomic', 'true');
		const progress = statusBar.createDiv({ cls: 'books-progress' });
		progress.setAttribute('role', 'progressbar');
		progress.setAttribute('aria-valuemin', '1');
		this.progressFill = progress.createDiv({ cls: 'books-progress-fill' });
		this.statusText = statusBar.createDiv({ cls: 'books-status-text', text: pageStatus(1, 1) });

		this.registerDomEvent(this.previousButton, 'click', (event) => {
			event.stopPropagation();
			this.previous();
		});
		this.registerDomEvent(this.nextButton, 'click', (event) => {
			event.stopPropagation();
			this.next();
		});
		this.registerDomEvent(this.contentsButton, 'click', (event) => {
			event.stopPropagation();
			this.openContents();
		});
		this.registerDomEvent(this.bookmarkButton, 'click', (event) => {
			event.stopPropagation();
			this.toggleBookmark();
		});
		for (const button of [this.highlightButton, this.quoteButton]) {
			this.registerDomEvent(button, 'mousedown', (event) => event.preventDefault());
		}
		this.registerDomEvent(this.highlightButton, 'click', (event) => {
			event.stopPropagation();
			this.saveSelection('highlight');
		});
		this.registerDomEvent(this.quoteButton, 'click', (event) => {
			event.stopPropagation();
			this.saveSelection('quote');
		});
		this.registerDomEvent(this.previousChapterButton, 'click', (event) => {
			event.stopPropagation();
			void this.changeChapter(-1, 1);
		});
		this.registerDomEvent(this.nextChapterButton, 'click', (event) => {
			event.stopPropagation();
			void this.changeChapter(1, 0);
		});

		this.buildScope();
		this.registerDomEvent(this.viewport, 'focusin', () => this.pushScope());
		this.registerDomEvent(this.viewport, 'focusout', () => this.popScope());

		this.setupInput();
		this.setupSelectionCapture();
		this.setupRepagination();
		this.applySettings();
		if (this.file) await this.renderFile();
	}

	public async onClose(): Promise<void> {
		this.popScope();
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
		if (this.animationFrame !== null)
			this.contentEl.win.cancelAnimationFrame(this.animationFrame);
		if (this.repaginateTimer !== null) window.clearTimeout(this.repaginateTimer);
		if (this.turnTimer !== null) window.clearTimeout(this.turnTimer);
		this.animationFrame = null;
		this.repaginateTimer = null;
		this.turnTimer = null;
		this.savePosition();
		this.disposeRenderedMarkdown();

		const ownerDocument = this.contentEl.ownerDocument;
		this.booksPlugin.releaseImmersive(ownerDocument);
		this.contentEl.empty();
	}

	public async renderFile(): Promise<void> {
		if (!this.content) return;
		if (!this.file) {
			this.content.empty();
			this.content.createDiv({ cls: 'books-empty', text: t('notFound') });
			return;
		}

		const generation = ++this.renderGeneration;
		const sourceFile = this.file;
		this.book = this.booksPlugin.resolveBookForFile(sourceFile, this.bookId ?? undefined);
		this.bookId = this.book.id;
		this.updateChapterBar();
		const raw = await this.app.vault.cachedRead(sourceFile);
		if (generation !== this.renderGeneration) return;

		const cache = this.app.metadataCache.getFileCache(sourceFile);
		const frontmatterPosition = cache?.frontmatterPosition;
		let markdown = frontmatterPosition
			? raw.slice(frontmatterPosition.end.offset)
			: raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
		markdown = markdown.replace(/^\s+/, '');
		this.chapterMinutes = Math.max(1, Math.ceil(this.countWords(markdown) / 225));

		this.disposeRenderedMarkdown();
		this.renderChild = new Component();
		this.addChild(this.renderChild);
		this.content.empty();
		this.content.setCssProps({ transform: 'none' });
		this.page = 0;
		this.alignmentOffset = 0;
		this.measured = false;

		try {
			await MarkdownRenderer.render(
				this.app,
				markdown,
				this.content,
				sourceFile.path,
				this.renderChild,
			);
		} catch (error) {
			console.error('Obsidian Books could not render Markdown.', error);
			this.content.empty();
			this.content.createDiv({ cls: 'books-empty', text: t('renderError') });
			return;
		}
		if (generation !== this.renderGeneration) return;

		if (this.booksPlugin.settings.showTitle && !this.hasLeadingHeading()) {
			const title = this.content.createEl('h1', {
				cls: 'books-title',
				text: sourceFile.basename,
			});
			this.content.insertBefore(title, this.content.firstChild);
		}
		this.applyStoredHighlights();

		const savedPosition = this.booksPlugin.settings.rememberPosition
			? this.booksPlugin.positions[sourceFile.path]
			: undefined;
		this.pendingFraction = this.requestedFraction ?? savedPosition?.fraction ?? null;
		this.requestedFraction = null;
		this.watchMediaLoading();

		this.animationFrame = this.contentEl.win.requestAnimationFrame(() => {
			this.animationFrame = null;
			if (generation !== this.renderGeneration || !this.content.isConnected) return;
			this.measure();
		});

		this.viewport.focus();
	}

	public applySettings(): void {
		if (!this.content) return;
		const settings = this.booksPlugin.settings;
		this.content.style.setProperty('--books-font-size', `${settings.fontSize}em`);
		this.content.style.setProperty('--books-line-height', String(settings.lineHeight));
		this.content.style.setProperty(
			'--books-paragraph-spacing',
			`${settings.paragraphSpacing}em`,
		);
		this.content.style.setProperty('--books-column-gap', `${settings.columnGap}em`);
		this.content.removeClass('books-font-theme', 'books-font-serif', 'books-font-sans');
		this.content.addClass(`books-font-${settings.fontFamily}`);
		this.viewport.removeClass(
			'books-surface-theme',
			'books-surface-white',
			'books-surface-cream',
			'books-surface-sepia',
			'books-surface-dark',
		);
		this.viewport.addClass(`books-surface-${settings.appearance}`);
		this.content.removeClass('books-dragging');
		this.content.style.transition =
			settings.transition === 'slide' ? 'transform 220ms ease' : 'none';
		this.stage.toggleClass('books-page-turn-mode', settings.transition === 'page-turn');
	}

	public requestRepagination(): void {
		this.debouncedRemeasure?.();
	}

	private parseState(state: unknown): ReaderViewState {
		if (typeof state !== 'object' || state === null || !('filePath' in state)) return {};
		const candidate = state as {
			filePath?: unknown;
			bookId?: unknown;
			initialFraction?: unknown;
		};
		if (typeof candidate.filePath !== 'string') return {};
		return {
			filePath: candidate.filePath,
			bookId: typeof candidate.bookId === 'string' ? candidate.bookId : undefined,
			initialFraction:
				typeof candidate.initialFraction === 'number'
					? Math.max(0, Math.min(candidate.initialFraction, 1))
					: undefined,
		};
	}

	private disposeRenderedMarkdown(): void {
		if (!this.renderChild) return;
		this.removeChild(this.renderChild);
		this.renderChild = null;
	}

	private hasLeadingHeading(): boolean {
		return Array.from(this.content.children)
			.slice(0, 4)
			.some((element) => element.tagName === 'H1');
	}

	private watchMediaLoading(): void {
		this.content.querySelectorAll('img, audio, video').forEach((element) => {
			const handleLoad = (): void => this.debouncedRemeasure?.();
			if (element.instanceOf(HTMLImageElement)) {
				if (!element.complete) element.addEventListener('load', handleLoad, { once: true });
			} else {
				element.addEventListener('loadedmetadata', handleLoad, { once: true });
			}
		});
	}

	private measure(): void {
		if (!this.content || !this.viewport) return;
		const viewportWidth = this.viewport.clientWidth;
		if (!viewportWidth) return;

		const computedGap =
			Number.parseFloat(this.content.win.getComputedStyle(this.content).columnGap) || 0;
		const geometry = calculateGeometry({
			viewportWidth,
			columnGap: computedGap,
			outerMargin: this.booksPlugin.settings.pageMargin,
			pageMode: this.booksPlugin.settings.pageMode,
			isDesktop: Platform.isDesktop,
			maxPageWidth: this.booksPlugin.settings.maxPageWidth,
		});

		this.stage.style.width = `${geometry.stageWidth}px`;
		this.stage.toggleClass('books-two-page', geometry.pageCount === 2);
		this.content.style.width = `${geometry.stageWidth}px`;
		this.content.style.columnWidth = `${geometry.pageWidth}px`;
		this.columnGap = computedGap;
		this.pageStride = geometry.stride;

		// Chromium can anchor a transformed multi-column strip to the view rather
		// than its centered clipping stage. Calibrate the untransformed strip to
		// the stage before applying page translation so every column starts at the
		// visible page edge in narrow panes, popouts, and centered max-width layouts.
		this.content.addClass('books-measuring');
		this.content.setCssProps({ transform: 'none' });
		this.alignmentOffset =
			this.stage.getBoundingClientRect().left - this.content.getBoundingClientRect().left;
		this.totalPages = calculateTotalPages(
			this.content.scrollWidth,
			this.columnGap,
			this.pageStride,
		);
		this.measured = true;

		if (this.pendingFraction !== null) {
			this.page = fractionToPage(this.pendingFraction, this.totalPages);
			const mediaStillLoading = Array.from(this.content.querySelectorAll('img')).some(
				(image) => image.instanceOf(HTMLImageElement) && !image.complete,
			);
			if (!mediaStillLoading) this.pendingFraction = null;
		}

		this.page = clampPage(this.page, this.totalPages);
		this.applyTransform();
		this.content.removeClass('books-measuring');
		this.updateStatus();
	}

	private applyTransform(): void {
		const translateX = calculateTranslation(this.alignmentOffset, this.page, this.pageStride);
		this.content.style.transform = `translateX(${translateX}px)`;
	}

	private goTo(requestedPage: number): void {
		const nextPage = clampPage(requestedPage, this.totalPages);
		if (nextPage === this.page) {
			this.updateStatus();
			return;
		}

		const direction = nextPage > this.page ? 'forward' : 'backward';
		this.page = nextPage;
		this.applyTransform();
		this.animatePageTurn(direction);
		this.updateStatus();
		this.savePosition();
	}

	private next(): void {
		if (this.page < this.totalPages - 1) this.goTo(this.page + 1);
		else void this.changeChapter(1, 0);
	}

	private previous(): void {
		if (this.page > 0) this.goTo(this.page - 1);
		else void this.changeChapter(-1, 1);
	}

	private animatePageTurn(direction: 'forward' | 'backward'): void {
		if (this.booksPlugin.settings.transition !== 'page-turn') return;
		if (this.turnTimer !== null) window.clearTimeout(this.turnTimer);
		this.stage.removeClass('books-turn-forward', 'books-turn-backward');
		this.stage.getBoundingClientRect();
		this.stage.addClass(direction === 'forward' ? 'books-turn-forward' : 'books-turn-backward');
		this.turnTimer = window.setTimeout(() => {
			this.stage.removeClass('books-turn-forward', 'books-turn-backward');
			this.turnTimer = null;
		}, 320);
	}

	private updateStatus(): void {
		const current = this.page + 1;
		const chapterIndex = this.currentChapterIndex();
		const label =
			this.book && this.book.chapters.length > 1 && chapterIndex >= 0
				? chapterStatus(
						chapterIndex + 1,
						this.book.chapters.length,
						current,
						this.totalPages,
					)
				: pageStatus(current, this.totalPages);
		const remainingPages = Math.max(1, this.totalPages - this.page);
		const remainingMinutes = Math.max(
			1,
			Math.ceil((this.chapterMinutes * remainingPages) / this.totalPages),
		);
		this.statusText.setText(`${label} · ${minutesLeft(remainingMinutes)}`);
		const percentage = this.totalPages > 0 ? (current / this.totalPages) * 100 : 0;
		this.progressFill.style.width = `${percentage}%`;
		const progress = this.progressFill.parentElement;
		progress?.setAttribute('aria-valuemax', String(this.totalPages));
		progress?.setAttribute('aria-valuenow', String(current));
		progress?.setAttribute('aria-valuetext', label);
		this.previousButton.disabled = this.page <= 0 && !this.hasPreviousChapter();
		this.nextButton.disabled = this.page >= this.totalPages - 1 && !this.hasNextChapter();
		this.updateBookmarkButton();
	}

	private savePosition(): void {
		if (!this.booksPlugin.settings.rememberPosition || !this.file || !this.measured) return;
		if (this.pendingFraction !== null) return;
		const fraction = pageToFraction(this.page, this.totalPages);
		this.booksPlugin.positions[this.file.path] = { fraction };
		if (this.book) this.booksPlugin.updateBookProgress(this.book, this.file.path, fraction);
	}

	private currentChapterIndex(): number {
		if (!this.book || !this.file) return -1;
		return this.book.chapters.findIndex((chapter) => chapter.path === this.file?.path);
	}

	private hasPreviousChapter(): boolean {
		return this.currentChapterIndex() > 0;
	}

	private hasNextChapter(): boolean {
		const index = this.currentChapterIndex();
		return Boolean(this.book && index >= 0 && index < this.book.chapters.length - 1);
	}

	private updateChapterBar(): void {
		if (!this.chapterBar) return;
		const index = this.currentChapterIndex();
		const chapter = index >= 0 ? this.book?.chapters[index] : undefined;
		this.bookTitleText.setText(this.book?.title ?? this.file?.basename ?? t('fallbackTitle'));
		this.chapterTitleText.setText(chapter?.title ?? '');
		this.chapterBar.toggleClass('is-single-note', (this.book?.chapters.length ?? 0) <= 1);
		this.previousChapterButton.disabled = index <= 0;
		this.nextChapterButton.disabled =
			!this.book || index < 0 || index >= this.book.chapters.length - 1;
	}

	private currentFraction(): number {
		return pageToFraction(this.page, this.totalPages);
	}

	private updateBookmarkButton(): void {
		if (!this.bookmarkButton || !this.file) return;
		const bookmarked = Boolean(
			this.booksPlugin.findBookmark(this.file.path, this.currentFraction()),
		);
		this.bookmarkButton.setText(bookmarked ? '★' : '☆');
		this.bookmarkButton.toggleClass('is-active', bookmarked);
		this.bookmarkButton.setAttribute(
			'aria-label',
			bookmarked ? t('removeBookmark') : t('addBookmark'),
		);
		this.bookmarkButton.setAttribute('aria-pressed', String(bookmarked));
	}

	private toggleBookmark(): void {
		if (!this.book || !this.file || !this.measured) return;
		const added = this.booksPlugin.toggleBookmark(
			this.book,
			this.file.path,
			this.currentFraction(),
		);
		this.updateBookmarkButton();
		new Notice(added ? t('bookmarkAdded') : t('bookmarkRemoved'));
	}

	private openContents(): void {
		if (!this.book || !this.file) return;
		new BookContentsModal(
			this.app,
			this.book,
			this.file.path,
			this.booksPlugin.getBookmarksForBook(this.book),
			(chapterPath, fraction) => {
				void this.openChapter(chapterPath, fraction);
			},
			(id) => {
				this.booksPlugin.removeBookmark(id);
				this.updateBookmarkButton();
			},
		).open();
	}

	private countWords(markdown: string): number {
		return markdown
			.replace(/```[\s\S]*?```/g, ' ')
			.replace(/`[^`]*`/g, ' ')
			.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
			.replace(/[#[\]>*_~|{}-]/g, ' ')
			.trim()
			.split(/\s+/u)
			.filter(Boolean).length;
	}

	private setupSelectionCapture(): void {
		const update = (): void => {
			this.selectionCapture = this.captureSelection();
			const enabled = Boolean(this.selectionCapture);
			this.highlightButton.disabled = !enabled;
			this.quoteButton.disabled = !enabled;
		};
		this.registerDomEvent(this.viewport, 'mouseup', update);
		this.registerDomEvent(this.viewport, 'keyup', update);
		this.registerDomEvent(this.viewport, 'touchend', () => {
			window.setTimeout(update, 0);
		});
	}

	private captureSelection(): SelectionCapture | null {
		const selection = this.contentEl.ownerDocument.getSelection();
		if (!selection || selection.rangeCount !== 1 || selection.isCollapsed) return null;
		const range = selection.getRangeAt(0);
		if (!this.content.contains(range.commonAncestorContainer)) return null;
		const rawText = range.toString();
		const selectedText = rawText.trim();
		if (!selectedText) return null;

		const before = range.cloneRange();
		before.selectNodeContents(this.content);
		before.setEnd(range.startContainer, range.startOffset);
		const leadingWhitespace = rawText.length - rawText.trimStart().length;
		const startOffset = before.toString().length + leadingWhitespace;
		const fullText = this.content.textContent ?? '';
		const anchor = createTextAnchor(fullText, startOffset, startOffset + selectedText.length);
		return {
			anchor,
			selectedText,
			heading: this.headingForRange(range),
			fraction: this.currentFraction(),
		};
	}

	private headingForRange(range: Range): string | undefined {
		const startElement =
			range.startContainer.instanceOf(Element)
				? range.startContainer
				: range.startContainer.parentElement;
		if (!startElement) return undefined;
		const ancestor = startElement.closest('h1, h2, h3, h4, h5, h6');
		if (ancestor?.textContent?.trim()) return ancestor.textContent.trim();

		let preceding: Element | undefined;
		for (const heading of Array.from(this.content.querySelectorAll('h1, h2, h3, h4, h5, h6'))) {
			if (heading.compareDocumentPosition(startElement) & Node.DOCUMENT_POSITION_FOLLOWING) {
				preceding = heading;
			} else if (heading !== startElement) {
				break;
			}
		}
		return preceding?.textContent?.trim() || undefined;
	}

	private saveSelection(kind: 'highlight' | 'quote'): void {
		const capture = this.selectionCapture ?? this.captureSelection();
		if (!capture || !this.file || !this.book) {
			new Notice(t('selectTextFirst'));
			return;
		}
		const annotation: ReadingAnnotation = {
			id: `books-${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
			kind,
			sourcePath: this.file.path,
			bookId: this.book.id,
			chapterTitle:
				this.book.chapters[this.currentChapterIndex()]?.title ?? this.file.basename,
			heading: capture.heading,
			selectedText: capture.selectedText,
			anchor: capture.anchor,
			fraction: capture.fraction,
			createdAt: new Date().toISOString(),
		};

		if (kind === 'highlight') {
			this.booksPlugin.addHighlight(annotation);
			this.wrapAnnotation(annotation);
			new Notice(t('highlightAdded'));
			return;
		}

		void this.booksPlugin
			.addQuote(this.book, annotation)
			.then(() => {
				this.wrapAnnotation(annotation);
				new Notice(t('quoteSaved'));
			})
			.catch((error: unknown) => {
				console.error('Obsidian Books could not save a quote.', error);
				new Notice(t('quoteError'));
			});
	}

	private applyStoredHighlights(): void {
		if (!this.file) return;
		const annotations = this.booksPlugin
			.getAnnotationsForSource(this.file.path)
			.map((annotation) => ({
				annotation,
				location: locateTextAnchor(this.content.textContent ?? '', annotation.anchor),
			}))
			.filter((item) => item.location !== undefined)
			.sort((left, right) => (right.location?.start ?? 0) - (left.location?.start ?? 0));
		for (const { annotation } of annotations) this.wrapAnnotation(annotation);
	}

	private wrapAnnotation(annotation: ReadingAnnotation): void {
		const location = locateTextAnchor(this.content.textContent ?? '', annotation.anchor);
		if (!location) return;
		const walker = this.contentEl.ownerDocument.createTreeWalker(this.content, 4);
		const segments: Array<{ node: Text; start: number; end: number }> = [];
		let offset = 0;
		let current: Node | null;
		while ((current = walker.nextNode())) {
			if (!current.instanceOf(Text)) continue;
			const length = current.data.length;
			const segmentStart = Math.max(0, location.start - offset);
			const segmentEnd = Math.min(length, location.end - offset);
			if (segmentStart < segmentEnd) {
				segments.push({ node: current, start: segmentStart, end: segmentEnd });
			}
			offset += length;
			if (offset >= location.end) break;
		}

		for (const segment of segments.reverse()) {
			let selected = segment.node;
			if (segment.end < selected.data.length) selected.splitText(segment.end);
			if (segment.start > 0) selected = selected.splitText(segment.start);
			const mark = this.contentEl.ownerDocument.win.createEl('mark');
			mark.className = `books-highlight books-highlight-${annotation.kind}`;
			mark.dataset.annotationId = annotation.id;
			mark.title = annotation.kind === 'quote' ? t('saveQuote') : t('highlightSelection');
			selected.parentNode?.insertBefore(mark, selected);
			mark.appendChild(selected);
		}
	}

	private async changeChapter(direction: -1 | 1, initialFraction: number): Promise<void> {
		if (!this.book) return;
		const target = this.book.chapters[this.currentChapterIndex() + direction];
		if (!target) return;
		await this.openChapter(target.path, initialFraction);
	}

	private async openChapter(chapterPath: string, initialFraction: number): Promise<void> {
		if (!this.book) return;
		const target = this.app.vault.getAbstractFileByPath(chapterPath);
		if (!(target instanceof TFile)) return;
		await this.leaf.setViewState({
			type: VIEW_TYPE_READER,
			active: true,
			state: {
				filePath: target.path,
				bookId: this.book.id,
				initialFraction,
			},
		});
	}

	private setupRepagination(): void {
		const repaginate = (): void => {
			if (this.repaginateTimer !== null) window.clearTimeout(this.repaginateTimer);
			this.repaginateTimer = window.setTimeout(() => {
				this.repaginateTimer = null;
				if (!this.content.isConnected) return;
				if (this.pendingFraction !== null) {
					this.measure();
					return;
				}
				const fraction = pageToFraction(this.page, this.totalPages);
				this.measure();
				this.page = fractionToPage(fraction, this.totalPages);
				this.applyTransform();
				this.updateStatus();
			}, 150);
		};

		this.debouncedRemeasure = repaginate;
		this.resizeObserver = new ResizeObserver(repaginate);
		this.resizeObserver.observe(this.viewport);
		this.registerEvent(this.app.workspace.on('css-change', repaginate));
		this.registerEvent(this.app.workspace.on('resize', repaginate));
	}

	private toggleControls(): void {
		if (this.booksPlugin.settings.immersive) {
			this.booksPlugin.toggleImmersiveChrome(this.contentEl.ownerDocument);
		} else {
			this.viewport.toggleClass('books-hide-ui', !this.viewport.hasClass('books-hide-ui'));
		}
	}

	private exitReadingChrome(): void {
		this.booksPlugin.showImmersiveChrome(this.contentEl.ownerDocument);
		this.viewport.removeClass('books-hide-ui');
	}

	private buildScope(): void {
		const scope = new Scope(this.app.scope);
		const register = (modifiers: Modifier[], key: string, callback: () => void): void => {
			scope.register(modifiers, key, () => {
				callback();
				return false;
			});
		};

		register([], 'ArrowRight', () => this.next());
		register([], 'ArrowLeft', () => this.previous());
		register([], 'PageDown', () => this.next());
		register([], 'PageUp', () => this.previous());
		register([], ' ', () => this.next());
		register(['Shift'], ' ', () => this.previous());
		register([], 'Home', () => this.goTo(0));
		register([], 'End', () => this.goTo(this.totalPages - 1));
		register([], 'Escape', () => this.exitReadingChrome());
		this.readerScope = scope;
	}

	private pushScope(): void {
		if (!this.readerScope || this.scopePushed) return;
		this.app.keymap.pushScope(this.readerScope);
		this.scopePushed = true;
	}

	private popScope(): void {
		if (!this.readerScope || !this.scopePushed) return;
		this.app.keymap.popScope(this.readerScope);
		this.scopePushed = false;
	}

	private isInteractive(target: EventTarget | null): boolean {
		return target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));
	}

	private isScrollable(target: EventTarget | null): boolean {
		if (!(target instanceof Element)) return false;
		let element: Element | null = target;
		while (element && element !== this.viewport) {
			if (element.instanceOf(HTMLElement)) {
				const style = element.win.getComputedStyle(element);
				const scrollsX =
					/(auto|scroll)/.test(style.overflowX) &&
					element.scrollWidth > element.clientWidth;
				const scrollsY =
					/(auto|scroll)/.test(style.overflowY) &&
					element.scrollHeight > element.clientHeight;
				if (scrollsX || scrollsY) return true;
			}
			element = element.parentElement;
		}
		return false;
	}

	private hasTextSelection(): boolean {
		return Boolean(this.contentEl.ownerDocument.getSelection()?.toString().trim());
	}

	private setupInput(): void {
		const operatingSystemEdge = 20;
		const swipeThreshold = 45;
		const claimThreshold = 6;
		const tapMoveThreshold = 10;
		const tapTimeThreshold = 300;
		let startX = 0;
		let startY = 0;
		let startTime = 0;
		let dragging = false;
		let decided = false;
		let horizontal = false;

		const abortDrag = (): void => {
			if (!dragging) return;
			dragging = false;
			decided = false;
			horizontal = false;
			this.applySettings();
			this.applyTransform();
		};

		this.registerDomEvent(
			this.viewport,
			'touchstart',
			(event) => {
				if (
					event.touches.length !== 1 ||
					this.isInteractive(event.target) ||
					this.isScrollable(event.target)
				) {
					abortDrag();
					return;
				}
				const touch = event.touches[0];
				if (!touch) return;
				const view = this.viewport.ownerDocument.defaultView;
				if (
					!view ||
					Math.min(touch.clientX, view.innerWidth - touch.clientX) < operatingSystemEdge
				) {
					abortDrag();
					return;
				}
				startX = touch.clientX;
				startY = touch.clientY;
				startTime = Date.now();
				dragging = true;
				decided = false;
				horizontal = false;
				this.content.addClass('books-dragging');
			},
			{ capture: true, passive: true },
		);

		this.registerDomEvent(
			this.viewport,
			'touchmove',
			(event) => {
				if (!dragging) return;
				const touch = event.touches[0];
				if (!touch) return;
				const deltaX = touch.clientX - startX;
				const deltaY = touch.clientY - startY;
				if (!decided) {
					if (Math.abs(deltaX) < claimThreshold && Math.abs(deltaY) < claimThreshold)
						return;
					if (Math.abs(deltaY) > Math.abs(deltaX)) {
						dragging = false;
						this.applySettings();
						return;
					}
					decided = true;
					horizontal = true;
				}
				if (!horizontal) return;
				event.stopPropagation();
				event.preventDefault();
				const translateX = calculateTranslation(
					this.alignmentOffset,
					this.page,
					this.pageStride,
					deltaX,
				);
				this.content.style.transform = `translateX(${translateX}px)`;
			},
			{ capture: true, passive: false },
		);

		const endTouch = (event: TouchEvent): void => {
			if (!dragging) return;
			dragging = false;
			this.lastTouchAt = Date.now();
			this.applySettings();
			const touch = event.changedTouches[0];
			if (!touch) {
				this.applyTransform();
				return;
			}
			const deltaX = touch.clientX - startX;
			const deltaY = touch.clientY - startY;
			const elapsed = Date.now() - startTime;

			if (
				Math.abs(deltaX) < tapMoveThreshold &&
				Math.abs(deltaY) < tapMoveThreshold &&
				elapsed < tapTimeThreshold
			) {
				if (this.hasTextSelection() || !this.booksPlugin.settings.tapZones) {
					this.applyTransform();
					return;
				}
				this.handleTap(touch.clientX);
				return;
			}

			if (
				horizontal &&
				Math.abs(deltaX) >= swipeThreshold &&
				Math.abs(deltaX) > Math.abs(deltaY) * 1.5
			) {
				if (deltaX < 0) this.next();
				else this.previous();
			} else {
				this.applyTransform();
			}
		};

		this.registerDomEvent(this.viewport, 'touchend', endTouch, {
			capture: true,
			passive: true,
		});
		this.registerDomEvent(this.viewport, 'touchcancel', abortDrag, {
			capture: true,
			passive: true,
		});

		this.registerDomEvent(this.viewport, 'click', (event) => {
			if (this.lastTouchAt && Date.now() - this.lastTouchAt < 700) return;
			if (
				this.isInteractive(event.target) ||
				this.isScrollable(event.target) ||
				this.hasTextSelection() ||
				!this.booksPlugin.settings.tapZones
			) {
				return;
			}
			this.handleTap(event.clientX);
		});

		if (Platform.isDesktop) this.setupWheelInput();
	}

	private handleTap(clientX: number): void {
		const bounds = this.viewport.getBoundingClientRect();
		const x = clientX - bounds.left;
		if (x < this.viewport.clientWidth * 0.3) this.previous();
		else if (x > this.viewport.clientWidth * 0.7) this.next();
		else this.toggleControls();
	}

	private setupWheelInput(): void {
		let wheelLocked = false;
		this.registerDomEvent(
			this.viewport,
			'wheel',
			(event) => {
				if (this.isScrollable(event.target)) return;
				const delta =
					Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
				if (Math.abs(delta) < 20) return;
				event.preventDefault();
				if (wheelLocked) return;
				wheelLocked = true;
				window.setTimeout(() => {
					wheelLocked = false;
				}, 350);
				this.goTo(this.page + (delta > 0 ? 1 : -1));
			},
			{ passive: false },
		);
	}
}
