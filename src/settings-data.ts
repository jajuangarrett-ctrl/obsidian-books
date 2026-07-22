import type {
	AppearancePreset,
	BookProgressMap,
	FontFamily,
	LegacyData,
	OpenMode,
	PageMode,
	PersistedData,
	PositionMap,
	ReaderSettings,
	ReadingBookmark,
	ReadingAnnotation,
	QuoteDestination,
	TransitionMode,
} from './types';
import { clampFraction } from './reader/pagination';

export const DEFAULT_SETTINGS: ReaderSettings = {
	fontSize: 1,
	fontFamily: 'theme',
	lineHeight: 1.6,
	paragraphSpacing: 0.75,
	pageMode: 'auto',
	maxPageWidth: 600,
	pageMargin: 24,
	columnGap: 2.5,
	appearance: 'theme',
	transition: 'slide',
	tapZones: true,
	rememberPosition: true,
	showTitle: true,
	openIn: 'new-tab',
	immersive: true,
	quoteDestination: 'single-note',
	quotesNotePath: 'Obsidian Books/Quotes.md',
	annotationsFolder: 'Obsidian Books/Annotations',
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberSetting(value: unknown, fallback: number, min: number, max: number): number {
	return typeof value === 'number' && Number.isFinite(value)
		? Math.max(min, Math.min(value, max))
		: fallback;
}

function booleanSetting(value: unknown, fallback: boolean): boolean {
	return typeof value === 'boolean' ? value : fallback;
}

function stringSetting(value: unknown, fallback: string): string {
	return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function enumSetting<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
	return typeof value === 'string' && values.includes(value as T) ? (value as T) : fallback;
}

export function normalizeSettings(value: unknown): ReaderSettings {
	const candidate = isRecord(value) ? value : {};
	const legacy = candidate as LegacyData;
	const legacyTransition =
		typeof legacy.animate === 'boolean' ? (legacy.animate ? 'slide' : 'none') : undefined;

	return {
		fontSize: numberSetting(candidate.fontSize, DEFAULT_SETTINGS.fontSize, 0.6, 2),
		fontFamily: enumSetting<FontFamily>(
			candidate.fontFamily,
			['theme', 'serif', 'sans'],
			DEFAULT_SETTINGS.fontFamily,
		),
		lineHeight: numberSetting(candidate.lineHeight, DEFAULT_SETTINGS.lineHeight, 1.2, 2.4),
		paragraphSpacing: numberSetting(
			candidate.paragraphSpacing,
			DEFAULT_SETTINGS.paragraphSpacing,
			0,
			2,
		),
		pageMode: enumSetting<PageMode>(
			candidate.pageMode,
			['auto', 'single', 'double'],
			DEFAULT_SETTINGS.pageMode,
		),
		maxPageWidth: numberSetting(candidate.maxPageWidth, DEFAULT_SETTINGS.maxPageWidth, 0, 1000),
		pageMargin: numberSetting(candidate.pageMargin, DEFAULT_SETTINGS.pageMargin, 8, 80),
		columnGap: numberSetting(candidate.columnGap, DEFAULT_SETTINGS.columnGap, 0.5, 5),
		appearance: enumSetting<AppearancePreset>(
			candidate.appearance,
			['theme', 'white', 'cream', 'sepia', 'dark'],
			DEFAULT_SETTINGS.appearance,
		),
		transition: enumSetting<TransitionMode>(
			candidate.transition ?? legacyTransition,
			['none', 'slide', 'page-turn'],
			DEFAULT_SETTINGS.transition,
		),
		tapZones: booleanSetting(candidate.tapZones, DEFAULT_SETTINGS.tapZones),
		rememberPosition: booleanSetting(
			candidate.rememberPosition,
			DEFAULT_SETTINGS.rememberPosition,
		),
		showTitle: booleanSetting(candidate.showTitle, DEFAULT_SETTINGS.showTitle),
		openIn: enumSetting<OpenMode>(
			candidate.openIn,
			['new-tab', 'current', 'split', 'window'],
			DEFAULT_SETTINGS.openIn,
		),
		immersive: booleanSetting(candidate.immersive, DEFAULT_SETTINGS.immersive),
		quoteDestination: enumSetting<QuoteDestination>(
			candidate.quoteDestination,
			['single-note', 'per-book', 'folder'],
			DEFAULT_SETTINGS.quoteDestination,
		),
		quotesNotePath: stringSetting(candidate.quotesNotePath, DEFAULT_SETTINGS.quotesNotePath),
		annotationsFolder: stringSetting(
			candidate.annotationsFolder,
			DEFAULT_SETTINGS.annotationsFolder,
		),
	};
}

export function normalizePositions(value: unknown): PositionMap {
	if (!isRecord(value)) return {};
	const positions: PositionMap = {};

	for (const [path, position] of Object.entries(value)) {
		if (!path || !isRecord(position) || typeof position.fraction !== 'number') continue;
		positions[path] = { fraction: clampFraction(position.fraction) };
	}

	return positions;
}

export function normalizeBookProgress(value: unknown): BookProgressMap {
	if (!isRecord(value)) return {};
	const progress: BookProgressMap = {};

	for (const [bookId, position] of Object.entries(value)) {
		if (
			!bookId ||
			!isRecord(position) ||
			typeof position.chapterPath !== 'string' ||
			!position.chapterPath ||
			typeof position.fraction !== 'number'
		) {
			continue;
		}
		progress[bookId] = {
			chapterPath: position.chapterPath,
			fraction: clampFraction(position.fraction),
		};
	}

	return progress;
}

export function normalizeBookmarks(value: unknown): ReadingBookmark[] {
	if (!Array.isArray(value)) return [];
	const bookmarks: ReadingBookmark[] = [];
	const ids = new Set<string>();

	for (const item of value) {
		if (
			!isRecord(item) ||
			typeof item.id !== 'string' ||
			!item.id ||
			ids.has(item.id) ||
			typeof item.sourcePath !== 'string' ||
			!item.sourcePath ||
			typeof item.fraction !== 'number' ||
			typeof item.createdAt !== 'string'
		) {
			continue;
		}
		ids.add(item.id);
		bookmarks.push({
			id: item.id,
			sourcePath: item.sourcePath,
			bookId: typeof item.bookId === 'string' && item.bookId ? item.bookId : undefined,
			fraction: clampFraction(item.fraction),
			createdAt: item.createdAt,
		});
	}

	return bookmarks;
}

export function normalizeAnnotations(value: unknown): ReadingAnnotation[] {
	if (!Array.isArray(value)) return [];
	const annotations: ReadingAnnotation[] = [];
	const ids = new Set<string>();

	for (const item of value) {
		if (
			!isRecord(item) ||
			typeof item.id !== 'string' ||
			!item.id ||
			ids.has(item.id) ||
			(item.kind !== 'highlight' && item.kind !== 'quote') ||
			typeof item.sourcePath !== 'string' ||
			!item.sourcePath ||
			typeof item.chapterTitle !== 'string' ||
			typeof item.selectedText !== 'string' ||
			!item.selectedText ||
			typeof item.fraction !== 'number' ||
			typeof item.createdAt !== 'string' ||
			!isRecord(item.anchor) ||
			typeof item.anchor.exact !== 'string' ||
			typeof item.anchor.prefix !== 'string' ||
			typeof item.anchor.suffix !== 'string' ||
			typeof item.anchor.startOffset !== 'number' ||
			typeof item.anchor.endOffset !== 'number'
		) {
			continue;
		}
		ids.add(item.id);
		annotations.push({
			id: item.id,
			kind: item.kind,
			sourcePath: item.sourcePath,
			bookId: typeof item.bookId === 'string' && item.bookId ? item.bookId : undefined,
			chapterTitle: item.chapterTitle,
			heading: typeof item.heading === 'string' && item.heading ? item.heading : undefined,
			selectedText: item.selectedText,
			fraction: clampFraction(item.fraction),
			createdAt: item.createdAt,
			destinationPath:
				typeof item.destinationPath === 'string' && item.destinationPath
					? item.destinationPath
					: undefined,
			anchor: {
				exact: item.anchor.exact,
				prefix: item.anchor.prefix,
				suffix: item.anchor.suffix,
				startOffset: Math.max(0, Math.floor(item.anchor.startOffset)),
				endOffset: Math.max(0, Math.floor(item.anchor.endOffset)),
			},
		});
	}

	return annotations;
}

export function migratePersistedData(value: unknown): PersistedData {
	const candidate = isRecord(value) ? value : {};
	const hasNestedSettings = isRecord(candidate.settings);

	return {
		schemaVersion: 4,
		settings: normalizeSettings(hasNestedSettings ? candidate.settings : candidate),
		positions: normalizePositions(candidate.positions),
		bookProgress: normalizeBookProgress(candidate.bookProgress),
		bookmarks: normalizeBookmarks(candidate.bookmarks),
		annotations: normalizeAnnotations(candidate.annotations),
	};
}
