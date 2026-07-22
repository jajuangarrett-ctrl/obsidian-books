export type PageMode = 'auto' | 'single' | 'double';
export type OpenMode = 'new-tab' | 'current' | 'split' | 'window';
export type TransitionMode = 'none' | 'slide' | 'page-turn';
export type AppearancePreset = 'theme' | 'white' | 'cream' | 'sepia' | 'dark';
export type FontFamily = 'theme' | 'serif' | 'sans';

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

export interface PersistedData {
	schemaVersion: 3;
	settings: ReaderSettings;
	positions: PositionMap;
	bookProgress: BookProgressMap;
	bookmarks: ReadingBookmark[];
}

export interface LegacyData extends Partial<ReaderSettings> {
	animate?: boolean;
	collapseSidebars?: boolean;
	hideMobileBar?: boolean;
	positions?: PositionMap;
}
