import type {
	LegacyData,
	OpenMode,
	PageMode,
	PersistedData,
	PositionMap,
	ReaderSettings,
	TransitionMode,
} from './types';
import { clampFraction } from './reader/pagination';

export const DEFAULT_SETTINGS: ReaderSettings = {
	fontSize: 1,
	lineHeight: 1.6,
	pageMode: 'auto',
	maxPageWidth: 600,
	columnGap: 2.5,
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
		lineHeight: numberSetting(candidate.lineHeight, DEFAULT_SETTINGS.lineHeight, 1.2, 2.4),
		pageMode: enumSetting<PageMode>(
			candidate.pageMode,
			['auto', 'single', 'double'],
			DEFAULT_SETTINGS.pageMode,
		),
		maxPageWidth: numberSetting(candidate.maxPageWidth, DEFAULT_SETTINGS.maxPageWidth, 0, 1000),
		columnGap: numberSetting(candidate.columnGap, DEFAULT_SETTINGS.columnGap, 0.5, 5),
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

export function migratePersistedData(value: unknown): PersistedData {
	const candidate = isRecord(value) ? value : {};
	const hasNestedSettings = isRecord(candidate.settings);

	return {
		schemaVersion: 1,
		settings: normalizeSettings(hasNestedSettings ? candidate.settings : candidate),
		positions: normalizePositions(candidate.positions),
	};
}
