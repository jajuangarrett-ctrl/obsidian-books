const STRINGS = {
	en: {
		fallbackTitle: 'Obsidian Books',
		aria: 'Paginated book reader. Use arrow keys or swipe to turn pages.',
		notFound: 'Note not found.',
		renderError: 'This chapter could not be rendered.',
		ribbonOpen: 'Open in Obsidian Books',
		needMarkdown: 'Open a Markdown note to read it in Obsidian Books.',
		commandOpen: 'Open current note in Obsidian Books',
		menuOpen: 'Open in Obsidian Books',
		settingsTitle: 'Obsidian Books',
		pageMode: 'Page mode',
		pageModeDescription: 'How many pages to show on screen',
		auto: 'Auto (two on a wide screen, one on a narrow screen)',
		single: 'Always one',
		double: 'Always two (book spread)',
		maxPageWidth: 'Maximum page width',
		maxPageWidthDescription: 'Width of one page in pixels; 0 removes the limit',
		fontSize: 'Font size',
		fontSizeDescription: "Multiplier relative to the active theme's reading font",
		lineHeight: 'Line height',
		pageGap: 'Gap between pages',
		transition: 'Page transition',
		none: 'None',
		slide: 'Horizontal slide',
		pageTurn: '3D page turn',
		tapZones: 'Tap zones',
		tapZonesDescription:
			'Tap the left or right third to turn; tap the center to toggle controls',
		rememberPosition: 'Remember position',
		rememberPositionDescription: 'Reopen each note at approximately the same passage',
		showTitle: 'Show note title',
		openIn: 'Open in',
		newTab: 'New tab',
		currentTab: 'Current tab',
		split: 'Split',
		newWindow: 'New window',
		immersive: 'Immersive reading',
		immersiveDescription:
			'Hide app chrome while reading; press Escape or tap the center to restore it',
		previousPage: 'Previous page',
		nextPage: 'Next page',
		pageStatus: (page: number, total: number) => `Page ${page} of ${total}`,
	},
	ru: {
		fallbackTitle: 'Obsidian Books',
		aria: 'Постраничная читалка. Листайте стрелками или свайпом.',
		notFound: 'Заметка не найдена.',
		renderError: 'Не удалось отобразить эту главу.',
		ribbonOpen: 'Открыть в Obsidian Books',
		needMarkdown: 'Откройте заметку Markdown, чтобы читать её в Obsidian Books.',
		commandOpen: 'Открыть текущую заметку в Obsidian Books',
		menuOpen: 'Открыть в Obsidian Books',
		settingsTitle: 'Obsidian Books',
		pageMode: 'Режим страниц',
		pageModeDescription: 'Сколько страниц показывать на экране',
		auto: 'Авто (две на широком экране, одна на узком)',
		single: 'Всегда одна',
		double: 'Всегда две (книжный разворот)',
		maxPageWidth: 'Максимальная ширина страницы',
		maxPageWidthDescription: 'Ширина одной страницы в пикселях; 0 снимает ограничение',
		fontSize: 'Размер шрифта',
		fontSizeDescription: 'Множитель относительно шрифта активной темы',
		lineHeight: 'Межстрочный интервал',
		pageGap: 'Промежуток между страницами',
		transition: 'Переход между страницами',
		none: 'Без анимации',
		slide: 'Горизонтальное скольжение',
		pageTurn: 'Трёхмерное перелистывание',
		tapZones: 'Зоны нажатия',
		tapZonesDescription: 'Нажмите слева или справа для листания, в центре — для панели',
		rememberPosition: 'Запоминать позицию',
		rememberPositionDescription: 'Открывать заметку примерно на прежнем месте',
		showTitle: 'Показывать заголовок заметки',
		openIn: 'Где открывать',
		newTab: 'Новая вкладка',
		currentTab: 'Текущая вкладка',
		split: 'Разделить экран',
		newWindow: 'Новое окно',
		immersive: 'Полноэкранное чтение',
		immersiveDescription: 'Прятать интерфейс; Escape или нажатие по центру возвращает его',
		previousPage: 'Предыдущая страница',
		nextPage: 'Следующая страница',
		pageStatus: (page: number, total: number) => `Страница ${page} из ${total}`,
	},
} as const;

type Language = keyof typeof STRINGS;
export type StringKey = Exclude<keyof (typeof STRINGS)['en'], 'pageStatus'>;

function language(): Language {
	try {
		const moment = (window as Window & { moment?: { locale?: () => string } }).moment;
		const locale = moment?.locale?.() ?? '';
		const code = locale.toLowerCase().split('-')[0];
		return code === 'ru' ? 'ru' : 'en';
	} catch {
		return 'en';
	}
}

export function t(key: StringKey): string {
	return STRINGS[language()][key];
}

export function pageStatus(page: number, total: number): string {
	return STRINGS[language()].pageStatus(page, total);
}
