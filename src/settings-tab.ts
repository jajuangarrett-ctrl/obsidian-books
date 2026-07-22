import { App, PluginSettingTab, Setting } from 'obsidian';

import type ObsidianBooksPlugin from './main';
import { t } from './i18n';
import type {
	AppearancePreset,
	FontFamily,
	OpenMode,
	PageMode,
	QuoteDestination,
	TransitionMode,
} from './types';

export class ReaderSettingTab extends PluginSettingTab {
	public constructor(
		app: App,
		private readonly booksPlugin: ObsidianBooksPlugin,
	) {
		super(app, booksPlugin);
	}

	public display(): void {
		const { containerEl } = this;
		containerEl.empty();
		new Setting(containerEl).setName(t('settingsTitle')).setHeading();

		const save = async (): Promise<void> => {
			await this.booksPlugin.saveAll();
			this.booksPlugin.refreshOpenViews();
		};

		new Setting(containerEl).setName(t('appearance')).addDropdown((dropdown) =>
			dropdown
				.addOptions({
					theme: t('themeSurface'),
					white: t('whiteSurface'),
					cream: t('creamSurface'),
					sepia: t('sepiaSurface'),
					dark: t('darkSurface'),
				})
				.setValue(this.booksPlugin.settings.appearance)
				.onChange(async (value) => {
					this.booksPlugin.settings.appearance = value as AppearancePreset;
					await save();
				}),
		);

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
					.onChange(async (value) => {
						this.booksPlugin.settings.maxPageWidth = value;
						await save();
					}),
			);

		new Setting(containerEl).setName(t('pageMargin')).addSlider((slider) =>
			slider
				.setLimits(8, 80, 4)
				.setValue(this.booksPlugin.settings.pageMargin)
				.onChange(async (value) => {
					this.booksPlugin.settings.pageMargin = value;
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
					.onChange(async (value) => {
						this.booksPlugin.settings.fontSize = value;
						await save();
					}),
			);

		new Setting(containerEl).setName(t('fontFamily')).addDropdown((dropdown) =>
			dropdown
				.addOptions({
					theme: t('themeFont'),
					serif: t('serifFont'),
					sans: t('sansFont'),
				})
				.setValue(this.booksPlugin.settings.fontFamily)
				.onChange(async (value) => {
					this.booksPlugin.settings.fontFamily = value as FontFamily;
					await save();
				}),
		);

		new Setting(containerEl).setName(t('lineHeight')).addSlider((slider) =>
			slider
				.setLimits(1.2, 2.4, 0.05)
				.setValue(this.booksPlugin.settings.lineHeight)
				.onChange(async (value) => {
					this.booksPlugin.settings.lineHeight = value;
					await save();
				}),
		);

		new Setting(containerEl).setName(t('paragraphSpacing')).addSlider((slider) =>
			slider
				.setLimits(0, 2, 0.1)
				.setValue(this.booksPlugin.settings.paragraphSpacing)
				.onChange(async (value) => {
					this.booksPlugin.settings.paragraphSpacing = value;
					await save();
				}),
		);

		new Setting(containerEl).setName(t('pageGap')).addSlider((slider) =>
			slider
				.setLimits(0.5, 5, 0.25)
				.setValue(this.booksPlugin.settings.columnGap)
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
				toggle
					.setValue(this.booksPlugin.settings.rememberPosition)
					.onChange(async (value) => {
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

		new Setting(containerEl).setName(t('annotationsSettings')).setHeading();

		new Setting(containerEl).setName(t('quoteDestination')).addDropdown((dropdown) =>
			dropdown
				.addOptions({
					'single-note': t('singleQuotesNote'),
					'per-book': t('perBookNote'),
					folder: t('annotationFolderOption'),
				})
				.setValue(this.booksPlugin.settings.quoteDestination)
				.onChange(async (value) => {
					this.booksPlugin.settings.quoteDestination = value as QuoteDestination;
					await save();
					this.display();
				}),
		);

		if (this.booksPlugin.settings.quoteDestination === 'single-note') {
			new Setting(containerEl).setName(t('quotesNotePath')).addText((text) =>
				text
					.setValue(this.booksPlugin.settings.quotesNotePath)
					.onChange(async (value) => {
						this.booksPlugin.settings.quotesNotePath = value;
						await this.booksPlugin.saveAll();
					}),
			);
		}

		if (this.booksPlugin.settings.quoteDestination === 'folder') {
			new Setting(containerEl).setName(t('annotationsFolder')).addText((text) =>
				text
					.setValue(this.booksPlugin.settings.annotationsFolder)
					.onChange(async (value) => {
						this.booksPlugin.settings.annotationsFolder = value;
						await this.booksPlugin.saveAll();
					}),
			);
		}
	}
}
