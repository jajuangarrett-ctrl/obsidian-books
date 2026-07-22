import type { ReadingAnnotation } from '../types';

function quoteLines(text: string): string {
	return text
		.trim()
		.split(/\r?\n/)
		.map((line) => `> ${line}`)
		.join('\n');
}

export function formatQuoteEntry(annotation: ReadingAnnotation, vaultName: string): string {
	const source = annotation.sourcePath.replace(/\.md$/i, '');
	const params = new URLSearchParams({
		vault: vaultName,
		id: annotation.id,
	});
	const heading = annotation.heading ? `\n- Heading: ${annotation.heading}` : '';
	return [
		`## ${annotation.chapterTitle}`,
		'',
		quoteLines(annotation.selectedText),
		'',
		`- Source: [[${source}|${annotation.chapterTitle}]]${heading}`,
		`- Captured: ${annotation.createdAt}`,
		`- Location: ${Math.round(annotation.fraction * 100)}%`,
		`- [Open in Obsidian Books](obsidian://books-open?${params.toString()})`,
		'',
		`^${annotation.id}`,
		'',
	].join('\n');
}

export function safeAnnotationFilename(title: string): string {
	const cleaned = title
		.replace(/[\\/:*?"<>|#^[\]]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	return cleaned || 'Untitled Book';
}
