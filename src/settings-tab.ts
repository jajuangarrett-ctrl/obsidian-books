import { App, PluginSettingTab, Setting } from 'obsidian';

import type ObsidianBooksPlugin from './main';
import { t } from './i18n';
import type { OpenMode, PageMode, TransitionMode } from './types';

export class ReaderSettingTab extends PluginSettingTab {
	public constructor(app: App, private readonly booksPlugin: ObsidianBooksPlugin) {
		super(app, booksPlugin);
	}

	public display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: t('settingsTitle') });

		const save = async (): Promise<void> => {
			await this.booksPlugin.saveAll();
			this.booksPlugin.refreshOpenViews();
		};

		new Setting(containerEl)
			.setName(t('pageMode'))
			.setDesc(t('pageModeDescription'))
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({ auto: t('auto'), single: t('single'), double: t('double') })
					.setValue(this.booksPlugin.settings.pageMode)
					.onChange(async (value) => {
						this.booksPlugin.settings.pageMode = value as PageMode;
						await save();
					}),
			);

		new Setting(containerEl)
			.setName(t('maxPageWidth'))
			.setDesc(t('maxPageWidthDescription'))
			.addSlider((slider) =>
				slider
					.setLimits(0, 1000, 20)
					.setValue(this.booksPlugin.settings.maxPageWidth)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.booksPlugin.settings.maxPageWidth = value;
						await save();
					}),
			);

		new Setting(containerEl)
			.setName(t('fontSize'))
			.setDesc(t('fontSizeDescription'))
			.addSlider((slider) =>
				slider
					.setLimits(0.6, 2, 0.05)
					.setValue(this.booksPlugin.settings.fontSize)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.booksPlugin.settings.fontSize = value;
						await save();
					}),
			);

		new Setting(containerEl).setName(t('lineHeight')).addSlider((slider) =>
			slider
				.setLimits(1.2, 2.4, 0.05)
				.setValue(this.booksPlugin.settings.lineHeight)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.booksPlugin.settings.lineHeight = value;
					await save();
				}),
		);

		new Setting(containerEl).setName(t('pageGap')).addSlider((slider) =>
			slider
				.setLimits(0.5, 5, 0.25)
				.setValue(this.booksPlugin.settings.columnGap)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.booksPlugin.settings.columnGap = value;
					await save();
				}),
		);

		new Setting(containerEl).setName(t('transition')).addDropdown((dropdown) =>
			dropdown
				.addOptions({ none: t('none'), slide: t('slide'), 'page-turn': t('pageTurn') })
				.setValue(this.booksPlugin.settings.transition)
				.onChange(async (value) => {
					this.booksPlugin.settings.transition = value as TransitionMode;
					await save();
				}),
		);

		new Setting(containerEl)
			.setName(t('tapZones'))
			.setDesc(t('tapZonesDescription'))
			.addToggle((toggle) =>
				toggle.setValue(this.booksPlugin.settings.tapZones).onChange(async (value) => {
					this.booksPlugin.settings.tapZones = value;
					await save();
				}),
			);

		new Setting(containerEl)
			.setName(t('rememberPosition'))
			.setDesc(t('rememberPositionDescription'))
			.addToggle((toggle) =>
				toggle.setValue(this.booksPlugin.settings.rememberPosition).onChange(async (value) => {
					this.booksPlugin.settings.rememberPosition = value;
					await save();
				}),
			);

		new Setting(containerEl).setName(t('showTitle')).addToggle((toggle) =>
			toggle.setValue(this.booksPlugin.settings.showTitle).onChange(async (value) => {
				this.booksPlugin.settings.showTitle = value;
				await save();
			}),
		);

		new Setting(containerEl).setName(t('openIn')).addDropdown((dropdown) =>
			dropdown
				.addOptions({
					'new-tab': t('newTab'),
					current: t('currentTab'),
					split: t('split'),
					window: t('newWindow'),
				})
				.setValue(this.booksPlugin.settings.openIn)
				.onChange(async (value) => {
					this.booksPlugin.settings.openIn = value as OpenMode;
					await save();
				}),
		);

		new Setting(containerEl)
			.setName(t('immersive'))
			.setDesc(t('immersiveDescription'))
			.addToggle((toggle) =>
				toggle.setValue(this.booksPlugin.settings.immersive).onChange(async (value) => {
					this.booksPlugin.settings.immersive = value;
					await save();
				}),
			);
	}
}

