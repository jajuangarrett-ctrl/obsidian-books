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

		expect(migrated.schemaVersion).toBe(3);
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

	it('loads book progress and clamps its chapter fraction', () => {
		const migrated = migratePersistedData({
			schemaVersion: 2,
			settings: DEFAULT_SETTINGS,
			positions: {},
			bookProgress: {
				'folder:Novel/Book.md': {
					chapterPath: 'Novel/02 Middle.md',
					fraction: -0.5,
				},
				broken: { chapterPath: '', fraction: 0.2 },
			},
		});

		expect(migrated.bookProgress).toEqual({
			'folder:Novel/Book.md': {
				chapterPath: 'Novel/02 Middle.md',
				fraction: 0,
			},
		});
	});

	it('normalizes persistent bookmarks', () => {
		const migrated = migratePersistedData({
			bookmarks: [
				{
					id: 'bookmark-1',
					sourcePath: 'Novel/01 Start.md',
					bookId: 'folder:Novel/Book.md',
					fraction: 1.5,
					createdAt: '2026-07-22T18:00:00.000Z',
				},
				{ id: 'bookmark-1', sourcePath: 'duplicate.md', fraction: 0, createdAt: '' },
				{ id: '', sourcePath: 'broken.md', fraction: 0, createdAt: '' },
			],
		});

		expect(migrated.bookmarks).toEqual([
			{
				id: 'bookmark-1',
				sourcePath: 'Novel/01 Start.md',
				bookId: 'folder:Novel/Book.md',
				fraction: 1,
				createdAt: '2026-07-22T18:00:00.000Z',
			},
		]);
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
