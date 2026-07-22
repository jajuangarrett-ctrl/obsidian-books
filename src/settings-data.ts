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

export function migratePersistedData(value: unknown): PersistedData {
	const candidate = isRecord(value) ? value : {};
	const hasNestedSettings = isRecord(candidate.settings);

	return {
		schemaVersion: 3,
		settings: normalizeSettings(hasNestedSettings ? candidate.settings : candidate),
		positions: normalizePositions(candidate.positions),
		bookProgress: normalizeBookProgress(candidate.bookProgress),
		bookmarks: normalizeBookmarks(candidate.bookmarks),
	};
}
