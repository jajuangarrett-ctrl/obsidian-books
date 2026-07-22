import { describe, expect, it } from 'vitest';

import {
	calculateGeometry,
	calculateTotalPages,
	clampFraction,
	clampPage,
	fractionToPage,
	pageToFraction,
} from '../src/reader/pagination';

describe('pagination geometry', () => {
	it('uses a two-page spread on a wide desktop viewport', () => {
		const geometry = calculateGeometry({
			viewportWidth: 1200,
			columnGap: 40,
			outerMargin: 24,
			pageMode: 'auto',
			isDesktop: true,
			maxPageWidth: 600,
		});

		expect(geometry.pageCount).toBe(2);
		expect(geometry.pageWidth).toBe(556);
		expect(geometry.stageWidth).toBe(1152);
		expect(geometry.stride).toBe(1192);
	});

	it('uses a single page for mobile and narrow forced spreads', () => {
		expect(
			calculateGeometry({
				viewportWidth: 900,
				columnGap: 32,
				outerMargin: 24,
				pageMode: 'auto',
				isDesktop: false,
				maxPageWidth: 600,
			}).pageCount,
		).toBe(1);

		expect(
			calculateGeometry({
				viewportWidth: 500,
				columnGap: 32,
				outerMargin: 24,
				pageMode: 'double',
				isDesktop: true,
				maxPageWidth: 600,
			}).pageCount,
		).toBe(1);
	});

	it('calculates page count from the column strip width', () => {
		expect(calculateTotalPages(5000, 40, 1000)).toBe(5);
		expect(calculateTotalPages(0, 40, 0)).toBe(1);
	});
});

describe('normalized reading positions', () => {
	it('round-trips representative pages', () => {
		for (const page of [0, 1, 5, 10]) {
			const totalPages = 11;
			expect(fractionToPage(pageToFraction(page, totalPages), totalPages)).toBe(page);
		}
	});

	it('clamps invalid and out-of-range values', () => {
		expect(clampFraction(Number.NaN)).toBe(0);
		expect(clampFraction(-1)).toBe(0);
		expect(clampFraction(2)).toBe(1);
		expect(clampPage(Number.POSITIVE_INFINITY, 9)).toBe(0);
		expect(clampPage(12, 9)).toBe(8);
	});
});
