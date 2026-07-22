import {
	Component,
	ItemView,
	MarkdownRenderer,
	Platform,
	Scope,
	TFile,
	type Modifier,
	type ViewStateResult,
	type WorkspaceLeaf,
} from 'obsidian';

import type ObsidianBooksPlugin from '../main';
import { pageStatus, t } from '../i18n';
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
	'audio',
	'video',
	'iframe',
	'.books-ui',
].join(', ');

export class ReaderView extends ItemView {
	public file: TFile | null = null;
	public filePath: string | null = null;

	private page = 0;
	private totalPages = 1;
	private pageStride = 0;
	private columnGap = 0;
	private alignmentOffset = 0;
	private measured = false;
	private pendingFraction: number | null = null;
	private renderGeneration = 0;
	private lastTouchAt = 0;

	private viewport!: HTMLElement;
	private stage!: HTMLElement;
	private content!: HTMLElement;
	private previousButton!: HTMLButtonElement;
	private nextButton!: HTMLButtonElement;
	private progressFill!: HTMLElement;
	private statusText!: HTMLElement;

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
		return this.file?.basename ?? t('fallbackTitle');
	}

	public getIcon(): string {
		return 'book-open';
	}

	public getState(): Record<string, unknown> {
		return { filePath: this.filePath };
	}

	public async setState(state: unknown, result: ViewStateResult): Promise<void> {
		const readerState = this.parseState(state);
		if (readerState.filePath && readerState.filePath !== this.filePath) {
			this.savePosition();
			this.filePath = readerState.filePath;
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

		this.buildScope();
		this.registerDomEvent(this.viewport, 'focusin', () => this.pushScope());
		this.registerDomEvent(this.viewport, 'focusout', () => this.popScope());

		this.setupInput();
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
		const raw = await this.app.vault.cachedRead(sourceFile);
		if (generation !== this.renderGeneration) return;

		const cache = this.app.metadataCache.getFileCache(sourceFile);
		const frontmatterPosition = cache?.frontmatterPosition;
		let markdown = frontmatterPosition
			? raw.slice(frontmatterPosition.end.offset)
			: raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
		markdown = markdown.replace(/^\s+/, '');

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

		const savedPosition = this.booksPlugin.settings.rememberPosition
			? this.booksPlugin.positions[sourceFile.path]
			: undefined;
		this.pendingFraction = savedPosition?.fraction ?? null;
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
		this.content.style.setProperty('--books-column-gap', `${settings.columnGap}em`);
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
		const filePath = (state as { filePath?: unknown }).filePath;
		return typeof filePath === 'string' ? { filePath } : {};
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
			outerMargin: 24,
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
		this.goTo(this.page + 1);
	}

	private previous(): void {
		this.goTo(this.page - 1);
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
		const label = pageStatus(current, this.totalPages);
		this.statusText.setText(label);
		const percentage = this.totalPages > 0 ? (current / this.totalPages) * 100 : 0;
		this.progressFill.style.width = `${percentage}%`;
		const progress = this.progressFill.parentElement;
		progress?.setAttribute('aria-valuemax', String(this.totalPages));
		progress?.setAttribute('aria-valuenow', String(current));
		progress?.setAttribute('aria-valuetext', label);
		this.previousButton.disabled = this.page <= 0;
		this.nextButton.disabled = this.page >= this.totalPages - 1;
	}

	private savePosition(): void {
		if (!this.booksPlugin.settings.rememberPosition || !this.file || !this.measured) return;
		if (this.pendingFraction !== null) return;
		this.booksPlugin.positions[this.file.path] = {
			fraction: pageToFraction(this.page, this.totalPages),
		};
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
