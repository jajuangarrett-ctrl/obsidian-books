export type PageMode = 'auto' | 'single' | 'double';
export type OpenMode = 'new-tab' | 'current' | 'split' | 'window';
export type TransitionMode = 'none' | 'slide' | 'page-turn';
export type AppearancePreset = 'theme' | 'white' | 'cream' | 'sepia' | 'dark';
export type FontFamily = 'theme' | 'serif' | 'sans';
export type QuoteDestination = 'single-note' | 'per-book' | 'folder';

export interface ReaderSettings {
	fontSize: number;
	fontFamily: FontFamily;
	lineHeight: number;
	paragraphSpacing: number;
	pageMode: PageMode;
	maxPageWidth: number;
	pageMargin: number;
	columnGap: number;
	appearance: AppearancePreset;
	transition: TransitionMode;
	tapZones: boolean;
	rememberPosition: boolean;
	showTitle: boolean;
	openIn: OpenMode;
	immersive: boolean;
	quoteDestination: QuoteDestination;
	quotesNotePath: string;
	annotationsFolder: string;
}

export interface ReadingPosition {
	fraction: number;
}

export type PositionMap = Record<string, ReadingPosition>;

export interface BookReadingPosition extends ReadingPosition {
	chapterPath: string;
}

export type BookProgressMap = Record<string, BookReadingPosition>;

export interface ReadingBookmark extends ReadingPosition {
	id: string;
	sourcePath: string;
	bookId?: string;
	createdAt: string;
}

export interface TextAnchor {
	exact: string;
	prefix: string;
	suffix: string;
	startOffset: number;
	endOffset: number;
}

export type AnnotationKind = 'highlight' | 'quote';

export interface ReadingAnnotation extends ReadingPosition {
	id: string;
	kind: AnnotationKind;
	sourcePath: string;
	bookId?: string;
	chapterTitle: string;
	heading?: string;
	selectedText: string;
	anchor: TextAnchor;
	createdAt: string;
	destinationPath?: string;
}

export interface PersistedData {
	schemaVersion: 4;
	settings: ReaderSettings;
	positions: PositionMap;
	bookProgress: BookProgressMap;
	bookmarks: ReadingBookmark[];
	annotations: ReadingAnnotation[];
}

export interface LegacyData extends Partial<ReaderSettings> {
	animate?: boolean;
	collapseSidebars?: boolean;
	hideMobileBar?: boolean;
	positions?: PositionMap;
}
