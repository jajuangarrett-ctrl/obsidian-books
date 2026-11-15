# Reader controls regression verification: 0.2.8

As of November 15, 2026.

- Root cause: the 0.2.7 overlay occupied the same hit-testing/paint area as the first and last text lines. Faster hiding alone would not help while selection deliberately held controls open.
- Fix: visible chrome reserves its actual measured height. Hidden chrome returns the full reading area. Temporary repagination uses a live text-range anchor, so repeated toggles preserve the passage rather than stepping backwards.
- Idle delay: 1.25 seconds; pointer holds, selection, keyboard use and menus remain protected.
- Chrome labels are not selectable; plugin copy and highlights use only the portion of native ranges inside book content.
- Actual browser regression: first glyph is below toolbar and resolves to book content via elementFromPoint. Native mouse drag selects that line; the real Copy button sends exactly that selection to a mocked clipboard; the real Highlight button stores/wraps exactly it. Bottom line also clears footer and passes hit testing.
- Repeated toggles, rotation, large-text fallback, accessibility opt-out and existing storage/anchor tests pass.

Run `npm run validate` and `CHROME_PATH=/path/to/Chrome npm run test:browser`.
The browser fixture uses synthetic prose and a mocked Obsidian host. Physical iPhone/WebKit and native iOS selection handles still require device acceptance; no physical install is claimed. Source notes and existing bookmarks/highlights are not migrated or rewritten.
