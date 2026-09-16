import { describe, expect, it } from 'vitest';

import {
	buildSectionOutline,
	pageForSectionOffset,
	scrollTopForSection,
} from '../src/reader/section-outline';

describe('section table of contents', () => {
	it('preserves heading and subheading hierarchy even when levels are skipped', () => {
		expect(
			buildSectionOutline([
				{ text: 'Chapter', level: 1 },
				{ text: 'First topic', level: 2 },
				{ text: 'Detail', level: 4 },
				{ text: 'Second topic', level: 2 },
				{ text: 'Follow-up', level: 3 },
			]).map(({ text, depth }) => ({ text, depth })),
		).toEqual([
			{ text: 'Chapter', depth: 0 },
			{ text: 'First topic', depth: 1 },
			{ text: 'Detail', depth: 2 },
			{ text: 'Second topic', depth: 1 },
			{ text: 'Follow-up', depth: 2 },
		]);
	});

	it('normalizes labels and skips blank or invalid headings', () => {
		expect(
			buildSectionOutline([
				{ text: '  A   useful\nheading  ', level: 2 },
				{ text: '   ', level: 3 },
				{ text: 'Invalid', level: 7 },
			]),
		).toEqual([{ text: 'A useful heading', level: 2, depth: 0, sourceIndex: 0 }]);
	});

	it('maps horizontal heading offsets to a clamped reader page', () => {
		expect(pageForSectionOffset(0, 1200, 5)).toBe(0);
		expect(pageForSectionOffset(1199, 1200, 5)).toBe(0);
		expect(pageForSectionOffset(1200, 1200, 5)).toBe(1);
		expect(pageForSectionOffset(9000, 1200, 5)).toBe(4);
	});

	it('accounts for the sticky toolbar and clamps vertical destinations', () => {
		expect(scrollTopForSection(600, 64, 2000)).toBe(536);
		expect(scrollTopForSection(40, 64, 2000)).toBe(0);
		expect(scrollTopForSection(2600, 64, 2000)).toBe(2000);
	});
});
