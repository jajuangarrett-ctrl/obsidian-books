export type PageMode = 'auto' | 'single' | 'double';
export type OpenMode = 'new-tab' | 'current' | 'split' | 'window';
export type TransitionMode = 'none' | 'slide' | 'page-turn';

export interface ReaderSettings {
	fontSize: number;
	lineHeight: number;
	pageMode: PageMode;
	maxPageWidth: number;
	columnGap: number;
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

export interface PersistedData {
	schemaVersion: 2;
	settings: ReaderSettings;
	positions: PositionMap;
	bookProgress: BookProgressMap;
}

export interface LegacyData extends Partial<ReaderSettings> {
	animate?: boolean;
	collapseSidebars?: boolean;
	hideMobileBar?: boolean;
	positions?: PositionMap;
}
