# Reader layout verification: 0.2.7

As of November 15, 2026.

- `npm run validate`: format, ESLint (three existing warnings), 52 unit tests and TypeScript/production bundle pass.
- `CHROME_PATH=/path/to/Chrome npm run test:browser`: real ReaderView code with a minimal mocked Obsidian host, synthetic non-private prose, actual Chrome CSS columns.
- Portrait 390×844: single-page reading, compact padding, visible quiet number.
- Landscape 844×390: two continuous columns, narrow gutter, separate page numbers.
- Rotation round-trip: normalized progress remains within one spread; 2× font size safely falls back to single column.
- Auto-hide, center reveal without a page turn or stage resize, selection and keyboard protection, and setting opt-out checked.
- Browser harness writes inspection screenshots to a temporary folder and reports its path.
- Existing bookmarks/highlight anchor tests pass; storage schema and source Markdown are not changed.

This is browser simulation, not a claim of physical iPhone installation, iOS WebKit testing or VoiceOver certification. Device acceptance: update through BRAT, open a long Markdown chapter, rotate both ways, select/highlight/bookmark text, and verify focus and host navigation return with center tap. Saved font/spacing choices stay unchanged; new defaults apply only to settings not previously saved.
