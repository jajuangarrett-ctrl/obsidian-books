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
		removeFromBookshelf: 'Remove from bookshelf',
		bookRemovedFromShelf:
			'Removed from bookshelf. Open the note in Obsidian Books to restore it.',
		commandBookshelf: 'Open Obsidian Books bookshelf',
		commandExportHighlights: 'Export all highlights',
		commandExportQuotes: 'Export all quotes',
		ribbonBookshelf: 'Open Obsidian Books bookshelf',
		contents: 'Contents',
		previousChapter: 'Previous chapter',
		nextChapter: 'Next chapter',
		addBookmark: 'Add bookmark',
		removeBookmark: 'Remove bookmark',
		addBookmarkHere: 'Add bookmark at current location',
		removeBookmarkHere: 'Remove bookmark at current location',
		bookmarks: 'Bookmarks',
		remove: 'Remove',
		bookmarkAdded: 'Bookmark added.',
		bookmarkRemoved: 'Bookmark removed.',
		highlightSelection: 'Highlight selection',
		enableHighlightMode: 'Turn on highlight mode',
		disableHighlightMode: 'Turn off highlight mode',
		highlightModeEnabled:
			'Highlight mode on. Drag across text with a finger, Apple Pencil, or mouse.',
		highlightModeDisabled: 'Highlight mode off.',
		saveQuote: 'Save selected quote',
		selectTextFirst: 'Select text in the chapter first.',
		highlightAdded: 'Highlight added without changing the source note.',
		highlightExtended: 'Highlight continued onto this page.',
		highlightSavedForContinuation: 'Highlight saved.',
		continueHighlightNextPage: 'Continue highlight on next page',
		continueHighlightInstruction: 'Drag across the remaining text on this page.',
		finishHighlight: 'Done',
		cancelHighlightContinuation: 'Cancel',
		showHighlightActions: 'Show highlight actions',
		quoteSaved: 'Quote saved.',
		quoteError: 'The quote could not be saved.',
		settingsTitle: 'Obsidian Books',
		annotationsSettings: 'Quotes and annotations',
		annotations: 'Annotations',
		highlight: 'Highlight',
		quote: 'Quote',
		removeAnnotation: 'Remove annotation',
		quoteDestination: 'Quote destination',
		singleQuotesNote: 'One quotes note',
		perBookNote: 'Annotations note beside each book',
		annotationFolderOption: 'One note per book in a folder',
		quotesNotePath: 'Quotes note path',
		annotationsFolder: 'Annotations folder',
		exportFolder: 'Export folder',
		exportFolderDescription:
			'Vault-relative folder for the managed highlights and quotes collection notes.',
		exportHighlightsDescription:
			'Write every saved highlight to a managed Markdown note in the configured export folder.',
		exportQuotesDescription:
			'Write every saved quote to a separate managed Markdown note in the configured export folder.',
		export: 'Export',
		noHighlightsToExport: 'There are no highlights to export.',
		noQuotesToExport: 'There are no quotes to export.',
		highlightsExported: 'Highlights exported to',
		quotesExported: 'Quotes exported to',
		exportError: 'The annotations could not be exported.',
		appearance: 'Reading surface',
		themeSurface: 'Follow Obsidian theme',
		whiteSurface: 'White',
		creamSurface: 'Cream',
		sepiaSurface: 'Sepia',
		darkSurface: 'Dark',
		pageMode: 'Page mode',
		pageModeDescription: 'How many pages to show on screen',
		auto: 'Auto (two on a wide screen, one on a narrow screen)',
		single: 'Always one',
		double: 'Always two (book spread)',
		maxPageWidth: 'Maximum page width',
		maxPageWidthDescription: 'Width of one page in pixels; 0 removes the limit',
		fontSize: 'Font size',
		fontSizeDescription: "Multiplier relative to the active theme's reading font",
		fontFamily: 'Font family',
		themeFont: 'Theme font',
		serifFont: 'Book serif',
		sansFont: 'Clean sans serif',
		lineHeight: 'Line height',
		paragraphSpacing: 'Paragraph spacing',
		pageMargin: 'Outer page margin',
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
		minutesLeft: (minutes: number) => `${minutes} min left in chapter`,
		bookmarkLocation: (chapter: string, percent: number) => `${chapter}, ${percent}%`,
		scrollStatus: (percent: number) => `Scrollable chapter · ${percent}%`,
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
		removeFromBookshelf: 'Убрать с книжной полки',
		bookRemovedFromShelf:
			'Книга убрана с полки. Откройте заметку в Obsidian Books, чтобы вернуть её.',
		commandBookshelf: 'Открыть книжную полку Obsidian Books',
		commandExportHighlights: 'Экспортировать все выделения',
		commandExportQuotes: 'Экспортировать все цитаты',
		ribbonBookshelf: 'Открыть книжную полку Obsidian Books',
		contents: 'Содержание',
		previousChapter: 'Предыдущая глава',
		nextChapter: 'Следующая глава',
		addBookmark: 'Добавить закладку',
		removeBookmark: 'Удалить закладку',
		addBookmarkHere: 'Добавить закладку в текущем месте',
		removeBookmarkHere: 'Удалить закладку в текущем месте',
		bookmarks: 'Закладки',
		remove: 'Удалить',
		bookmarkAdded: 'Закладка добавлена.',
		bookmarkRemoved: 'Закладка удалена.',
		highlightSelection: 'Выделить выбранный текст',
		enableHighlightMode: 'Включить режим выделения',
		disableHighlightMode: 'Выключить режим выделения',
		highlightModeEnabled:
			'Режим выделения включён. Проведите по тексту пальцем, Apple Pencil или мышью.',
		highlightModeDisabled: 'Режим выделения выключен.',
		saveQuote: 'Сохранить выбранную цитату',
		selectTextFirst: 'Сначала выберите текст в главе.',
		highlightAdded: 'Выделение добавлено без изменения исходной заметки.',
		highlightExtended: 'Выделение продолжено на этой странице.',
		highlightSavedForContinuation: 'Выделение сохранено.',
		continueHighlightNextPage: 'Продолжить выделение на следующей странице',
		continueHighlightInstruction: 'Выделите оставшийся текст на этой странице.',
		finishHighlight: 'Готово',
		cancelHighlightContinuation: 'Отмена',
		showHighlightActions: 'Показать действия с выделением',
		quoteSaved: 'Цитата сохранена.',
		quoteError: 'Не удалось сохранить цитату.',
		settingsTitle: 'Obsidian Books',
		annotationsSettings: 'Цитаты и аннотации',
		annotations: 'Аннотации',
		highlight: 'Выделение',
		quote: 'Цитата',
		removeAnnotation: 'Удалить аннотацию',
		quoteDestination: 'Куда сохранять цитаты',
		singleQuotesNote: 'Одна заметка с цитатами',
		perBookNote: 'Заметка аннотаций рядом с книгой',
		annotationFolderOption: 'Отдельная заметка для каждой книги в папке',
		quotesNotePath: 'Путь к заметке цитат',
		annotationsFolder: 'Папка аннотаций',
		exportFolder: 'Папка экспорта',
		exportFolderDescription:
			'Путь внутри хранилища для управляемых коллекций выделений и цитат.',
		exportHighlightsDescription:
			'Записать все сохранённые выделения в управляемую заметку Markdown в настроенной папке экспорта.',
		exportQuotesDescription:
			'Записать все сохранённые цитаты в отдельную управляемую заметку Markdown в настроенной папке экспорта.',
		export: 'Экспортировать',
		noHighlightsToExport: 'Нет выделений для экспорта.',
		noQuotesToExport: 'Нет цитат для экспорта.',
		highlightsExported: 'Выделения экспортированы в',
		quotesExported: 'Цитаты экспортированы в',
		exportError: 'Не удалось экспортировать аннотации.',
		appearance: 'Фон для чтения',
		themeSurface: 'Как в теме Obsidian',
		whiteSurface: 'Белый',
		creamSurface: 'Кремовый',
		sepiaSurface: 'Сепия',
		darkSurface: 'Тёмный',
		pageMode: 'Режим страниц',
		pageModeDescription: 'Сколько страниц показывать на экране',
		auto: 'Авто (две на широком экране, одна на узком)',
		single: 'Всегда одна',
		double: 'Всегда две (книжный разворот)',
		maxPageWidth: 'Максимальная ширина страницы',
		maxPageWidthDescription: 'Ширина одной страницы в пикселях; 0 снимает ограничение',
		fontSize: 'Размер шрифта',
		fontSizeDescription: 'Множитель относительно шрифта активной темы',
		fontFamily: 'Шрифт',
		themeFont: 'Шрифт темы',
		serifFont: 'Книжный с засечками',
		sansFont: 'Без засечек',
		lineHeight: 'Межстрочный интервал',
		paragraphSpacing: 'Интервал между абзацами',
		pageMargin: 'Внешнее поле страницы',
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
		minutesLeft: (minutes: number) => `Осталось ${minutes} мин. в главе`,
		bookmarkLocation: (chapter: string, percent: number) => `${chapter}, ${percent}%`,
		scrollStatus: (percent: number) => `Прокручиваемая глава · ${percent}%`,
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

export function minutesLeft(minutes: number): string {
	return STRINGS[language()].minutesLeft(minutes);
}

export function bookmarkLocation(chapter: string, percent: number): string {
	return STRINGS[language()].bookmarkLocation(chapter, percent);
}

export function scrollStatus(percent: number): string {
	return STRINGS[language()].scrollStatus(percent);
}
