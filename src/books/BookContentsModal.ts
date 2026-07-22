import { App, Modal } from 'obsidian';

import { bookmarkLocation, chapterCount, t } from '../i18n';
import type { ReadingBookmark } from '../types';
import type { BookRecord } from './domain';

export class BookContentsModal extends Modal {
	public constructor(
		app: App,
		private readonly book: BookRecord,
		private readonly activeChapterPath: string,
		private readonly bookmarks: readonly ReadingBookmark[],
		private readonly onChoose: (chapterPath: string, fraction: number) => void,
		private readonly onRemoveBookmark: (id: string) => void,
	) {
		super(app);
	}

	public onOpen(): void {
		this.setTitle(t('contents'));
		const summary = this.contentEl.createDiv({ cls: 'books-contents-summary' });
		summary.createEl('strong', { text: this.book.title });
		if (this.book.author) summary.createDiv({ cls: 'books-byline', text: this.book.author });
		summary.createDiv({
			cls: 'books-contents-count',
			text: chapterCount(this.book.chapters.length),
		});

		const list = this.contentEl.createEl('ol', { cls: 'books-contents-list' });
		this.book.chapters.forEach((chapter, index) => {
			const item = list.createEl('li');
			const button = item.createEl('button', {
				cls: 'books-contents-chapter',
				text: chapter.title,
				attr: { type: 'button' },
			});
			button.toggleClass('is-active', chapter.path === this.activeChapterPath);
			button.setAttribute(
				'aria-current',
				chapter.path === this.activeChapterPath ? 'location' : 'false',
			);
			button.setAttribute('aria-label', `${index + 1}. ${chapter.title}`);
			button.addEventListener('click', () => {
				this.close();
				this.onChoose(chapter.path, 0);
			});
		});

		if (!this.bookmarks.length) return;
		this.contentEl.createEl('h3', { cls: 'books-bookmarks-heading', text: t('bookmarks') });
		const bookmarksList = this.contentEl.createEl('ul', { cls: 'books-bookmarks-list' });
		for (const bookmark of this.bookmarks) {
			const item = bookmarksList.createEl('li', { cls: 'books-bookmark-item' });
			const chapter = this.book.chapters.find(
				(candidate) => candidate.path === bookmark.sourcePath,
			);
			const open = item.createEl('button', {
				cls: 'books-bookmark-open',
				text: bookmarkLocation(
					chapter?.title ?? bookmark.sourcePath,
					Math.round(bookmark.fraction * 100),
				),
				attr: { type: 'button' },
			});
			open.addEventListener('click', () => {
				this.close();
				this.onChoose(bookmark.sourcePath, bookmark.fraction);
			});
			const remove = item.createEl('button', {
				cls: 'books-bookmark-remove',
				text: t('remove'),
				attr: {
					type: 'button',
					'aria-label': `${t('removeBookmark')}: ${open.textContent}`,
				},
			});
			remove.addEventListener('click', () => {
				this.onRemoveBookmark(bookmark.id);
				item.remove();
			});
		}
	}

	public onClose(): void {
		this.contentEl.empty();
	}
}
