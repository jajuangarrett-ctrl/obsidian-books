# Selection stability regression: 0.2.9

As of November 15, 2026.

The physical report showed a selected passage at the top of a hidden-controls page
being replaced by an earlier passage when controls appeared. Reflowing CSS columns
can do this even with a valid anchor: the newly shorter page starts before the old
glyph. Selection must not cause that reflow at all.

## Fix

- No full-control reveal or repagination from native selectionchange, pointer
  release, focus during selection, or vertical touch drift.
- A separate, non-reflowing Copy/Highlight strip stays away from the selected text.
- Captured text survives mobile focus collapsing the native selection. Highlight
  continuation uses the existing annotation and retains visible Continue/Finish.
- Pending resize/settings changes wait until press/selection ends. Deliberate
  center taps without selection may reflow around the retained glyph.
- Source Markdown, stored annotations and bookmarks are not migrated.

## Verification

`npm run validate` passes 52 unit tests, build, formatting and lint (three existing warnings).
All 35 browser checks pass in Chrome and Playwright WebKit 27.2 on macOS.
Re-running the same fixture with the released 0.2.8 ReaderView reproduced the
failure at “long press selection never reveals or repaginates hidden chrome”;
the new code passes that assertion. It uses
synthetic text and the actual ReaderView in a small mocked Obsidian host.

The targeted fixture is one long paragraph spanning many pages, with page 9 starting
mid-paragraph. A held mouse press plus native drag selection at the top is followed
by selection events, copy, highlight, focus-collapse simulation and continuation.
Checks require unchanged page count, transform, padding, glyph coordinates and
selected text throughout selection. Synthetic touch drift exercises touch handlers.

Run Chrome with `CHROME_PATH=/path/to/Chrome npm run test:browser`.
Run WebKit with `BROWSER=webkit npm run test:browser` after installing its Playwright
browser. Screenshots are emitted to a temporary directory.

This is not a physical iPhone/Obsidian-WebView certification: iOS native long-press
menus and selection handles still need device acceptance. No confidential source
notes or screenshots are included in the fixture.
