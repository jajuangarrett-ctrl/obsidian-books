const STRINGS = {
	en: {
		fallbackTitle: 'Obsidian Books',
		aria: 'Paginated book reader. Use arrow keys or swipe to turn pages.',
		notFound: 'Note not found.',
		renderError: 'This chapter could not be rendered.',
		openError: 'Obsidian Books could not open this note.',
		ribbonOpen: 'Open in Obsidian Books',
		needMarkdown: 'Open a Markdown note to read it in Obsidian Books.',
		commandOpen: 'Open current note in Obsidian Books',
		menuOpen: 'Open in Obsidian Books',
		bookshelf: 'Bookshelf',
		bookshelfDescription: 'Continue reading notes and folder books from your vault.',
		searchBooks: 'Search books',
		noBookMatches: 'No books match this search.',
		emptyBookshelf:
			'No books yet. Open a note in Obsidian Books, mark a note with book: true, or add Book.md to a folder.',
		openBook: 'Open book',
		commandBookshelf: 'Open Obsidian Books bookshelf',
		ribbonBookshelf: 'Open Obsidian Books bookshelf',
		contents: 'Contents',
		previousChapter: 'Previous chapter',
		nextChapter: 'Next chapter',
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
		chapterCount: (count: number) => `${count} ${count === 1 ? 'chapter' : 'chapters'}`,
		readingProgress: (fraction: number) => `${Math.round(fraction * 100)}% read`,
		chapterStatus: (chapter: number, chapters: number, page: number, pages: number) =>
			`Chapter ${chapter} of ${chapters} · Page ${page} of ${pages}`,
	},
	ru: {
		fallbackTitle: 'Obsidian Books',
		aria: 'Постраничная читалка. Листайте стрелками или свайпом.',
		notFound: 'Заметка не найдена.',
		renderError: 'Не удалось отобразить эту главу.',
		openError: 'Obsidian Books не удалось открыть эту заметку.',
		ribbonOpen: 'Открыть в Obsidian Books',
		needMarkdown: 'Откройте заметку Markdown, чтобы читать её в Obsidian Books.',
		commandOpen: 'Открыть текущую заметку в Obsidian Books',
		menuOpen: 'Открыть в Obsidian Books',
		bookshelf: 'Книжная полка',
		bookshelfDescription: 'Продолжайте читать заметки и книги из папок хранилища.',
		searchBooks: 'Поиск книг',
		noBookMatches: 'Книги по этому запросу не найдены.',
		emptyBookshelf:
			'Книг пока нет. Откройте заметку в Obsidian Books, добавьте book: true или Book.md в папку.',
		openBook: 'Открыть книгу',
		commandBookshelf: 'Открыть книжную полку Obsidian Books',
		ribbonBookshelf: 'Открыть книжную полку Obsidian Books',
		contents: 'Содержание',
		previousChapter: 'Предыдущая глава',
		nextChapter: 'Следующая глава',
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
		chapterCount: (count: number) => `${count} гл.`,
		readingProgress: (fraction: number) => `Прочитано ${Math.round(fraction * 100)}%`,
		chapterStatus: (chapter: number, chapters: number, page: number, pages: number) =>
			`Глава ${chapter} из ${chapters} · Страница ${page} из ${pages}`,
	},
} as const;

type Language = keyof typeof STRINGS;
type NonFunctionKey<T> = {
	[K in keyof T]: T[K] extends (...args: never[]) => unknown ? never : K;
}[keyof T];
export type StringKey = NonFunctionKey<(typeof STRINGS)['en']>;

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

export function chapterCount(count: number): string {
	return STRINGS[language()].chapterCount(count);
}

export function readingProgress(fraction: number): string {
	return STRINGS[language()].readingProgress(fraction);
}

export function chapterStatus(
	chapter: number,
	chapters: number,
	page: number,
	pages: number,
): string {
	return STRINGS[language()].chapterStatus(chapter, chapters, page, pages);
}
