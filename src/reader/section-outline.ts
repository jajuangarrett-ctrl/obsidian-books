import { clampPage } from './pagination';

export interface SectionHeadingInput {
	text: string;
	level: number;
}

export interface SectionOutlineItem extends SectionHeadingInput {
	depth: number;
	sourceIndex: number;
}

export function buildSectionOutline(
	headings: readonly SectionHeadingInput[],
): SectionOutlineItem[] {
	const outline: SectionOutlineItem[] = [];
	const levelStack: number[] = [];

	headings.forEach((heading, sourceIndex) => {
		const text = heading.text.replace(/\s+/gu, ' ').trim();
		const level = Math.floor(heading.level);
		if (!text || level < 1 || level > 6) return;

		while (levelStack.length && levelStack[levelStack.length - 1]! >= level) {
			levelStack.pop();
		}
		levelStack.push(level);
		outline.push({ text, level, depth: levelStack.length - 1, sourceIndex });
	});

	return outline;
}

export function pageForSectionOffset(
	horizontalOffset: number,
	pageStride: number,
	totalPages: number,
): number {
	if (!Number.isFinite(horizontalOffset) || !Number.isFinite(pageStride) || pageStride <= 0) {
		return 0;
	}
	return clampPage(Math.floor(Math.max(0, horizontalOffset) / pageStride), totalPages);
}

export function scrollTopForSection(
	verticalOffset: number,
	topInset: number,
	maximumScroll: number,
): number {
	if (!Number.isFinite(verticalOffset)) return 0;
	const requested = Math.max(0, verticalOffset - Math.max(0, topInset));
	return Math.min(requested, Math.max(0, maximumScroll));
}
