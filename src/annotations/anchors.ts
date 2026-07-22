import type { TextAnchor } from '../types';

const CONTEXT_LENGTH = 64;

export interface LocatedTextAnchor {
	start: number;
	end: number;
	score: number;
}

export function createTextAnchor(
	text: string,
	startOffset: number,
	endOffset: number,
): TextAnchor {
	const start = Math.max(0, Math.min(Math.floor(startOffset), text.length));
	const end = Math.max(start, Math.min(Math.floor(endOffset), text.length));
	return {
		exact: text.slice(start, end),
		prefix: text.slice(Math.max(0, start - CONTEXT_LENGTH), start),
		suffix: text.slice(end, Math.min(text.length, end + CONTEXT_LENGTH)),
		startOffset: start,
		endOffset: end,
	};
}

function commonSuffixLength(left: string, right: string): number {
	const limit = Math.min(left.length, right.length);
	let count = 0;
	while (count < limit && left[left.length - 1 - count] === right[right.length - 1 - count]) {
		count += 1;
	}
	return count;
}

function commonPrefixLength(left: string, right: string): number {
	const limit = Math.min(left.length, right.length);
	let count = 0;
	while (count < limit && left[count] === right[count]) count += 1;
	return count;
}

export function locateTextAnchor(text: string, anchor: TextAnchor): LocatedTextAnchor | undefined {
	if (!anchor.exact) return undefined;
	const candidates: LocatedTextAnchor[] = [];
	let from = 0;

	while (from <= text.length - anchor.exact.length) {
		const start = text.indexOf(anchor.exact, from);
		if (start < 0) break;
		const end = start + anchor.exact.length;
		const before = text.slice(Math.max(0, start - anchor.prefix.length), start);
		const after = text.slice(end, end + anchor.suffix.length);
		const contextScore =
			commonSuffixLength(before, anchor.prefix) + commonPrefixLength(after, anchor.suffix);
		const distancePenalty = Math.min(64, Math.abs(start - anchor.startOffset)) / 64;
		candidates.push({ start, end, score: contextScore - distancePenalty });
		from = start + Math.max(1, anchor.exact.length);
	}

	return candidates.sort((left, right) => right.score - left.score)[0];
}
