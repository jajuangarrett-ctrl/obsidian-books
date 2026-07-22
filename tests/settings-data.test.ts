import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS, migratePersistedData, normalizeSettings } from '../src/settings-data';

describe('settings migration', () => {
	it('loads the MD Reader top-level settings and positions', () => {
		const migrated = migratePersistedData({
			fontSize: 1.25,
			lineHeight: 1.8,
			pageMode: 'double',
			maxPageWidth: 540,
			columnGap: 3,
			animate: false,
			tapZones: false,
			rememberPosition: true,
			showTitle: false,
			openIn: 'split',
			immersive: false,
			collapseSidebars: true,
			hideMobileBar: true,
			positions: {
				'Books/Example.md': { fraction: 0.625 },
			},
		});

		expect(migrated.schemaVersion).toBe(1);
		expect(migrated.settings).toMatchObject({
			fontSize: 1.25,
			lineHeight: 1.8,
			pageMode: 'double',
			transition: 'none',
			openIn: 'split',
		});
		expect(migrated.positions['Books/Example.md']).toEqual({ fraction: 0.625 });
		expect(migrated.settings).not.toHaveProperty('collapseSidebars');
		expect(migrated.settings).not.toHaveProperty('hideMobileBar');
	});

	it('loads the versioned nested format', () => {
		const migrated = migratePersistedData({
			schemaVersion: 1,
			settings: { ...DEFAULT_SETTINGS, transition: 'page-turn' },
			positions: { 'Book.md': { fraction: 0.25 } },
		});

		expect(migrated.settings.transition).toBe('page-turn');
		expect(migrated.positions['Book.md']?.fraction).toBe(0.25);
	});

	it('uses safe defaults and clamps malformed values', () => {
		const normalized = normalizeSettings({
			fontSize: 99,
			lineHeight: Number.NaN,
			pageMode: 'quadruple',
			maxPageWidth: -20,
			columnGap: 0,
			transition: 'curl',
		});

		expect(normalized.fontSize).toBe(2);
		expect(normalized.lineHeight).toBe(DEFAULT_SETTINGS.lineHeight);
		expect(normalized.pageMode).toBe(DEFAULT_SETTINGS.pageMode);
		expect(normalized.maxPageWidth).toBe(0);
		expect(normalized.columnGap).toBe(0.5);
		expect(normalized.transition).toBe(DEFAULT_SETTINGS.transition);
	});

	it('drops invalid position entries and clamps fractions', () => {
		const migrated = migratePersistedData({
			positions: {
				good: { fraction: 2 },
				bad: { fraction: 'half' },
			},
		});

		expect(migrated.positions).toEqual({ good: { fraction: 1 } });
	});
});

