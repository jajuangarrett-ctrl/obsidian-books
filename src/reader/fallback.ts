export type FallbackBlockKind = 'pdf' | 'interactive' | 'unbreakable';

export interface FallbackBlockMeasurement {
	kind: FallbackBlockKind;
	height: number;
}

export type FallbackReason = FallbackBlockKind | null;

export function verticalFallbackReason(
	availableHeight: number,
	blocks: readonly FallbackBlockMeasurement[],
): FallbackReason {
	const safeHeight = Math.max(1, availableHeight);
	for (const block of blocks) {
		if (block.kind === 'pdf') return 'pdf';
		if (block.height > safeHeight) return block.kind;
	}
	return null;
}
