export interface HighlightGestureStart {
	enabled: boolean;
	isPrimary: boolean;
	button: number;
	pointerType: string;
	insideContent: boolean;
	interactive: boolean;
}

export interface GesturePoint {
	x: number;
	y: number;
}

const DIRECT_HIGHLIGHT_POINTERS = new Set(['mouse', 'pen', 'touch']);

export function canStartHighlightGesture(input: HighlightGestureStart): boolean {
	return (
		input.enabled &&
		input.isPrimary &&
		input.button === 0 &&
		DIRECT_HIGHLIGHT_POINTERS.has(input.pointerType) &&
		input.insideContent &&
		!input.interactive
	);
}

export function hasHighlightDrag(
	start: GesturePoint,
	current: GesturePoint,
	minimumDistance = 3,
): boolean {
	const deltaX = current.x - start.x;
	const deltaY = current.y - start.y;
	return Math.hypot(deltaX, deltaY) >= minimumDistance;
}

export function pageGestureAllowed(highlightMode: boolean, hasSelection: boolean): boolean {
	return !highlightMode && !hasSelection;
}
