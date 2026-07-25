import { describe, expect, it } from 'vitest';

import {
	canStartHighlightGesture,
	hasHighlightDrag,
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
});
