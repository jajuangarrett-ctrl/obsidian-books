import { App, Modal } from 'obsidian';

import { t } from '../i18n';
import type { SectionOutlineItem } from '../reader/section-outline';

export class SectionContentsModal extends Modal {
	public constructor(
		app: App,
		private readonly chapterTitle: string,
		private readonly sections: readonly SectionOutlineItem[],
		private readonly onChoose: (section: SectionOutlineItem) => void,
	) {
		super(app);
	}

	public onOpen(): void {
		this.setTitle(t('sectionContents'));
		const description = this.contentEl.createDiv({
			cls: 'books-section-contents-description',
		});
		description.createEl('strong', { text: this.chapterTitle });
		description.createDiv({ text: t('sectionContentsDescription') });

		if (!this.sections.length) {
			this.contentEl.createDiv({
				cls: 'books-section-contents-empty',
				text: t('noSectionHeadings'),
				attr: { role: 'status' },
			});
			return;
		}

		const list = this.contentEl.createEl('ol', {
			cls: 'books-section-contents-list',
		});
		for (const section of this.sections) {
			const item = list.createEl('li');
			const button = item.createEl('button', {
				cls: 'books-section-contents-open',
				attr: { type: 'button' },
			});
			button.style.setProperty('--books-section-indent', `${section.depth * 18}px`);
			button.createSpan({
				cls: 'books-section-contents-level',
				text: `H${section.level}`,
			});
			button.createSpan({
				cls: 'books-section-contents-label',
				text: section.text,
			});
			button.addEventListener('click', () => {
				this.close();
				this.onChoose(section);
			});
		}
	}

	public onClose(): void {
		this.contentEl.empty();
	}
}
