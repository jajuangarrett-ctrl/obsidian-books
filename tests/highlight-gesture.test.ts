import { describe, expect, it } from 'vitest';

import {
	canContinueHighlight,
	canStartHighlightGesture,
	hasHighlightDrag,
	mergeHighlightOffsets,
	pageGestureAllowed,
} from '../src/reader/highlight-gesture';

describe('direct highlight gestures', () => {
	it.each(['touch', 'pen', 'mouse'])(
		'accepts a primary %s drag over chapter text',
		(pointerType) => {
			expect(
				canStartHighlightGesture({
					enabled: true,
					isPrimary: true,
					button: 0,
					pointerType,
					insideContent: true,
					interactive: false,
				}),
			).toBe(true);
		},
	);

	it('rejects gestures outside highlightable chapter text', () => {
		const base = {
			enabled: true,
			isPrimary: true,
			button: 0,
			pointerType: 'pen',
			insideContent: true,
			interactive: false,
		};

		expect(canStartHighlightGesture({ ...base, enabled: false })).toBe(false);
		expect(canStartHighlightGesture({ ...base, isPrimary: false })).toBe(false);
		expect(canStartHighlightGesture({ ...base, button: 2 })).toBe(false);
		expect(canStartHighlightGesture({ ...base, insideContent: false })).toBe(false);
		expect(canStartHighlightGesture({ ...base, interactive: true })).toBe(false);
	});

	it('requires a deliberate drag before saving a highlight', () => {
		expect(hasHighlightDrag({ x: 10, y: 10 }, { x: 11, y: 11 })).toBe(false);
		expect(hasHighlightDrag({ x: 10, y: 10 }, { x: 14, y: 10 })).toBe(true);
	});

	it('does not let page swiping take over highlight mode or a native text selection', () => {
		expect(pageGestureAllowed(false, false)).toBe(true);
		expect(pageGestureAllowed(true, false)).toBe(false);
		expect(pageGestureAllowed(false, true)).toBe(false);
	});

	it('offers continuation only when another paginated page exists', () => {
		expect(canContinueHighlight(0, 3, false)).toBe(true);
		expect(canContinueHighlight(2, 3, false)).toBe(false);
		expect(canContinueHighlight(0, 3, true)).toBe(false);
	});

	it('merges separately selected page fragments into one continuous range', () => {
		expect(mergeHighlightOffsets({ start: 120, end: 165 }, { start: 166, end: 218 })).toEqual({
			start: 120,
			end: 218,
		});
		expect(mergeHighlightOffsets({ start: 166, end: 218 }, { start: 165, end: 120 })).toEqual({
			start: 120,
			end: 218,
		});
	});
});
