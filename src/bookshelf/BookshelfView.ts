import { ItemView, type WorkspaceLeaf } from 'obsidian';

import { chapterCount, readingProgress, t } from '../i18n';
import type ObsidianBooksPlugin from '../main';
import type { BookRecord } from '../books/domain';

export const VIEW_TYPE_BOOKSHELF = 'obsidian-books-bookshelf';

export class BookshelfView extends ItemView {
	private query = '';

	public constructor(
		leaf: WorkspaceLeaf,
		private readonly booksPlugin: ObsidianBooksPlugin,
	) {
		super(leaf);
	}

	public getViewType(): string {
		return VIEW_TYPE_BOOKSHELF;
	}

	public getDisplayText(): string {
		return t('bookshelf');
	}

	public getIcon(): string {
		return 'library';
	}

	public async onOpen(): Promise<void> {
		this.contentEl.addClass('books-shelf-view');
		await this.refresh();
	}

	public async refresh(): Promise<void> {
		if (!this.contentEl) return;
		const books = this.booksPlugin.getBooks();
		this.contentEl.empty();

		const header = this.contentEl.createDiv({ cls: 'books-shelf-header' });
		const heading = header.createDiv();
		heading.createEl('h1', { text: t('bookshelf') });
		heading.createEl('p', { text: t('bookshelfDescription') });
		const search = header.createEl('input', {
			cls: 'books-shelf-search',
			attr: {
				type: 'search',
				placeholder: t('searchBooks'),
				'aria-label': t('searchBooks'),
			},
		});
		search.value = this.query;
		this.registerDomEvent(search, 'input', () => {
			this.query = search.value;
			this.renderGrid(books, grid);
		});

		const grid = this.contentEl.createDiv({ cls: 'books-shelf-grid' });
		this.renderGrid(books, grid);
	}

	private renderGrid(books: readonly BookRecord[], grid: HTMLElement): void {
		grid.empty();
		const query = this.query.trim().toLocaleLowerCase();
		const matches = books.filter((book) => {
			if (!query) return true;
			return [book.title, book.author ?? '', ...book.chapters.map((chapter) => chapter.title)]
				.join('\n')
				.toLocaleLowerCase()
				.includes(query);
		});

		if (!matches.length) {
			grid.createDiv({
				cls: 'books-shelf-empty',
				text: books.length ? t('noBookMatches') : t('emptyBookshelf'),
			});
			return;
		}

		for (const book of matches) this.renderCard(book, grid);
	}

	private renderCard(book: BookRecord, grid: HTMLElement): void {
		const card = grid.createEl('button', {
			cls: 'books-shelf-card',
			attr: { type: 'button', 'aria-label': `${t('openBook')}: ${book.title}` },
		});
		const cover = card.createDiv({ cls: 'books-shelf-cover' });
		const coverUrl = this.booksPlugin.resolveCoverUrl(book);
		if (coverUrl) {
			cover.createEl('img', {
				attr: { src: coverUrl, alt: '', loading: 'lazy' },
			});
		} else {
			cover.createDiv({ cls: 'books-shelf-cover-placeholder', text: book.title.slice(0, 1) });
		}

		const metadata = card.createDiv({ cls: 'books-shelf-metadata' });
		metadata.createEl('strong', { cls: 'books-shelf-title', text: book.title });
		if (book.author) metadata.createDiv({ cls: 'books-shelf-author', text: book.author });
		metadata.createDiv({
			cls: 'books-shelf-chapters',
			text: chapterCount(book.chapters.length),
		});

		const fraction = this.booksPlugin.getBookFraction(book);
		const progress = metadata.createEl('progress', {
			cls: 'books-shelf-progress',
			attr: {
				max: 100,
				value: Math.round(fraction * 100),
				'aria-label': readingProgress(fraction),
			},
		});
		progress.setAttribute('title', readingProgress(fraction));
		this.registerDomEvent(card, 'click', () => void this.booksPlugin.openBook(book));
	}
}
