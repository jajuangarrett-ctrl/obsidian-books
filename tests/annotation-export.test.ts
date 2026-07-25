import { describe, expect, it } from 'vitest';

import {
	annotationExportMarker,
	annotationExportPath,
	formatAnnotationExport,
	isManagedAnnotationExport,
	timestampedAnnotationExportPath,
	type ExportableAnnotation,
} from '../src/annotations/export-format';
import type { AnnotationKind } from '../src/types';

function annotation(
	kind: AnnotationKind,
	overrides: Partial<ExportableAnnotation> = {},
): ExportableAnnotation {
	return {
		id: `books-${kind}-1`,
		kind,
		sourcePath: 'Novel/01 Start.md',
		bookId: 'folder:Novel/Book.md',
		bookKey: 'folder:Novel/Book.md',
		bookTitle: 'A Novel',
		chapterTitle: 'Start',
		heading: 'The station',
		selectedText: `${kind} text`,
		anchor: {
			exact: `${kind} text`,
			prefix: '',
			suffix: '',
			startOffset: 0,
			endOffset: kind.length + 5,
		},
		fraction: 0.4,
		createdAt: '2026-07-24T18:00:00.000Z',
		...overrides,
	};
}

describe('annotation exports', () => {
	it('keeps highlights and quotes in their respective exports', () => {
		const highlight = annotation('highlight');
		const quote = annotation('quote', {
			id: 'books-quote-2',
			selectedText: 'A saved quotation.',
			destinationPath: 'Obsidian Books/Quotes.md',
		});

		const highlights = formatAnnotationExport(
			'highlight',
			[quote, highlight],
			'Test Vault',
			'2026-07-24T19:00:00.000Z',
		);
		const quotes = formatAnnotationExport(
			'quote',
			[highlight, quote],
			'Test Vault',
			'2026-07-24T19:00:00.000Z',
		);

		expect(highlights).toContain('# All Highlights');
		expect(highlights).toContain('> highlight text');
		expect(highlights).not.toContain('A saved quotation.');
		expect(quotes).toContain('# All Quotes');
		expect(quotes).toContain('> A saved quotation.');
		expect(quotes).toContain('[[Obsidian Books/Quotes]]');
		expect(quotes).not.toContain('highlight text');
	});

	it('groups annotations by book and chapter in deterministic reading order', () => {
		const later = annotation('highlight', {
			id: 'later',
			fraction: 0.8,
			selectedText: 'Later passage',
		});
		const earlier = annotation('highlight', {
			id: 'earlier',
			fraction: 0.2,
			selectedText: 'Earlier passage',
		});
		const secondBook = annotation('highlight', {
			id: 'second-book',
			bookKey: 'note:Zebra.md',
			bookId: 'note:Zebra.md',
			bookTitle: 'Zebra',
			sourcePath: 'Zebra.md',
			chapterTitle: 'Zebra',
			selectedText: 'Second book passage',
		});

		const exported = formatAnnotationExport(
			'highlight',
			[secondBook, later, earlier],
			'Test Vault',
			'2026-07-24T19:00:00.000Z',
		);

		expect(exported.indexOf('## A Novel')).toBeLessThan(exported.indexOf('## Zebra'));
		expect(exported.indexOf('Earlier passage')).toBeLessThan(exported.indexOf('Later passage'));
		expect(exported.match(/### Start/g)).toHaveLength(1);
	});

	it('includes traceable metadata and a reopen link', () => {
		const exported = formatAnnotationExport(
			'highlight',
			[annotation('highlight')],
			'Test Vault',
			'2026-07-24T19:00:00.000Z',
		);

		expect(exported).toContain('[[Novel/01 Start|Start]]');
		expect(exported).toContain('- Heading: The station');
		expect(exported).toContain('- Captured: 2026-07-24T18:00:00.000Z');
		expect(exported).toContain('- Location: 40%');
		expect(exported).toContain('obsidian://books-open?vault=Test+Vault&id=books-highlight-1');
	});

	it('identifies managed targets and creates safe collision paths', () => {
		const managed = `# All Highlights\n\n${annotationExportMarker('highlight')}\n`;

		expect(annotationExportPath('highlight')).toBe('Obsidian Books/Exports/All Highlights.md');
		expect(annotationExportPath('quote')).toBe('Obsidian Books/Exports/All Quotes.md');
		expect(isManagedAnnotationExport(managed, 'highlight')).toBe(true);
		expect(isManagedAnnotationExport(managed, 'quote')).toBe(false);
		expect(timestampedAnnotationExportPath('quote', '2026-07-24T19:02:03.456Z')).toBe(
			'Obsidian Books/Exports/All Quotes 2026-07-24-19-02-03.md',
		);
		expect(timestampedAnnotationExportPath('quote', '2026-07-24T19:02:03.456Z', 1)).toBe(
			'Obsidian Books/Exports/All Quotes 2026-07-24-19-02-03 2.md',
		);
	});
});
