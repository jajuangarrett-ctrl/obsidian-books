import { describe, expect, it } from 'vitest';

import { verticalFallbackReason } from '../src/reader/fallback';

describe('vertical fallback classification', () => {
	it('always sends PDF chapters to vertical flow', () => {
		expect(verticalFallbackReason(700, [{ kind: 'pdf', height: 300 }])).toBe('pdf');
	});

	it('sends oversized unbreakable content to vertical flow', () => {
		expect(verticalFallbackReason(700, [{ kind: 'unbreakable', height: 900 }])).toBe(
			'unbreakable',
		);
	});

	it('keeps compatible blocks in paginated flow', () => {
		expect(
			verticalFallbackReason(700, [
				{ kind: 'interactive', height: 400 },
				{ kind: 'unbreakable', height: 650 },
			]),
		).toBeNull();
	});
});
