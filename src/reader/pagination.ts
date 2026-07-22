import type { PageMode } from '../types';

export interface PaginationInput {
	viewportWidth: number;
	columnGap: number;
	outerMargin: number;
	pageMode: PageMode;
	isDesktop: boolean;
	maxPageWidth: number;
}

export interface PaginationGeometry {
	pageCount: 1 | 2;
	pageWidth: number;
	stageWidth: number;
	stride: number;
}

export function clampFraction(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(value, 1));
}

export function pageToFraction(page: number, totalPages: number): number {
	if (totalPages <= 1) return 0;
	return clampFraction(page / (totalPages - 1));
}

export function fractionToPage(fraction: number, totalPages: number): number {
	if (totalPages <= 1) return 0;
	return Math.round(clampFraction(fraction) * (totalPages - 1));
}

export function clampPage(page: number, totalPages: number): number {
	if (!Number.isFinite(page) || totalPages <= 1) return 0;
	return Math.max(0, Math.min(Math.round(page), totalPages - 1));
}

export function calculateGeometry(input: PaginationInput): PaginationGeometry {
	const viewportWidth = Math.max(0, input.viewportWidth);
	const margin = Math.max(0, input.outerMargin);
	const gap = Math.max(0, input.columnGap);
	const available = Math.max(120, viewportWidth - margin * 2);

	let pageCount: 1 | 2 = 1;
	if (input.pageMode === 'double') pageCount = 2;
	else if (input.pageMode === 'auto' && input.isDesktop && viewportWidth >= 820) pageCount = 2;

	let pageWidth = (available - gap * (pageCount - 1)) / pageCount;
	if (pageCount === 2 && pageWidth < 260) {
		pageCount = 1;
		pageWidth = available;
	}

	if (input.maxPageWidth > 0) pageWidth = Math.min(pageWidth, input.maxPageWidth);
	const stageWidth = pageCount * pageWidth + gap * (pageCount - 1);

	return {
		pageCount,
		pageWidth,
		stageWidth,
		stride: stageWidth + gap,
	};
}

export function calculateTotalPages(scrollWidth: number, gap: number, stride: number): number {
	if (!Number.isFinite(scrollWidth) || !Number.isFinite(stride) || stride <= 0) return 1;
	return Math.max(1, Math.round((Math.max(0, scrollWidth) + Math.max(0, gap)) / stride));
}

