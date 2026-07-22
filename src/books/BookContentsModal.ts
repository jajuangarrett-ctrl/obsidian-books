import { App, Modal } from 'obsidian';

import { chapterCount, t } from '../i18n';
import type { BookRecord } from './domain';

export class BookContentsModal extends Modal {
	public constructor(
		app: App,
		private readonly book: BookRecord,
		private readonly activeChapterPath: string,
		private readonly onChoose: (chapterPath: string) => void,
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
				this.onChoose(chapter.path);
			});
		});
	}

	public onClose(): void {
		this.contentEl.empty();
	}
}
