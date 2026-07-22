# Architecture

## Foundation and provenance

Obsidian Books is a derivative of
[mrrepac/obsidian-md-reader](https://github.com/mrrepac/obsidian-md-reader), version
1.1.0. MD Reader is MIT-licensed and its original history and copyright notice
are preserved.

The project intentionally keeps MD Reader's central pagination model:

1. Obsidian's `MarkdownRenderer` renders a note into the reader content element.
2. CSS multi-column layout divides that rendered DOM into page-sized columns.
3. The viewport clips overflow while the content moves horizontally with
   `translateX`.
4. A page or two-page spread is one navigation step.
5. Location is stored as a fraction of total navigation steps so the reader can
   restore approximately the same place after reflow.

This is a horizontal paginated reader, not a paper-curl renderer. The 3D page
turn option will add perspective and surface animation around the same column
layout instead of replacing it.

## Upstream audit

MD Reader 1.1.0 is a compact, working JavaScript plugin:

- `main.js` contains plugin lifecycle, settings, rendering, pagination, input,
  persistence, responsive reflow, and immersive behavior.
- `styles.css` contains the column layout, clipping, content compatibility rules,
  controls, and immersive styles.
- `manifest.json` declares a desktop-and-mobile community plugin.
- There is no build system, type checking, linting, formatter, or automated test
  suite.

Behavior worth preserving includes rendered Markdown, single/two-page layouts,
keyboard/tap/swipe/wheel navigation, responsive repagination, immersive mode,
theme variables, sidebar restoration, and percentage-based saved positions.

## Compatibility findings

Supported Obsidian APIs already used by the foundation include `Plugin`,
`ItemView`, `MarkdownRenderer`, `Component`, `Scope`, settings components, vault
events, workspace events, and leaf view state.

The migration must remove or replace behavior that relies on implementation
details rather than the supported plugin API:

- The `data-ignore-swipe` marker used to suppress an Obsidian mobile recognizer.
- Direct access to `window.Capacitor.Plugins.StatusBar`.
- Direct access to workspace split internals for collapsing sidebars.

The supported fallback is to keep gestures scoped to the reader, preserve a
small operating-system edge zone, avoid consuming interactive or scrollable
content gestures, and let Obsidian manage its own system chrome and sidebars.

## Target modules

- `src/main.ts`: plugin lifecycle, commands, registered views, and vault events.
- `src/settings.ts`: settings schema, defaults, migration, persistence, and UI.
- `src/reader/ReaderView.ts`: view lifecycle and orchestration.
- `src/reader/pagination.ts`: pure page geometry and percentage conversion.
- `src/reader/gestures.ts`: input arbitration for navigation, selection, links,
  controls, embedded scrolling, and operating-system edge gestures.
- `src/reader/content.ts`: Markdown rendering, compatibility classification, and
  scroll fallback decisions.
- `src/books/domain.ts`: pure book metadata, marker, link, and natural-order helpers.
- `src/books/discovery.ts`: vault-backed `Book.md`, single-note, cover, and chapter
  discovery.
- `src/bookshelf/BookshelfView.ts`: searchable library cards and progress.
- `src/annotations/anchors.ts`: exact-text and surrounding-context anchor creation
  and recovery.
- `src/annotations/quote-format.ts`: portable Markdown quote entries and safe
  destination filenames.
- `src/bookshelf/*`: vault book index and bookshelf view.

Pure domain and geometry modules must not import Obsidian so they can be tested
in a normal JavaScript DOM or Node environment. Obsidian-facing classes stay
thin and delegate to those modules.

## Persistent data

The plugin will keep one versioned data document containing:

- Settings.
- Reading locations keyed by source or book/chapter identity.
- Current chapter and normalized in-chapter location keyed by book identity.
- Bookmarks.
- Highlight anchors and quote destinations.
- A small bookshelf metadata cache that can be rebuilt from the vault.

MD Reader's legacy top-level settings and `positions` map will be accepted and
migrated. Saved locations remain normalized to `0..1`; later stable text anchors
can refine the position without making page numbers persistent.

The current schema is version 4. Bookmarks keep a source path, optional book
identity, normalized in-chapter fraction, creation timestamp, and stable ID. File
and folder rename/delete handlers update or remove these paths together with
saved positions and book progress. Annotations add selected text, heading,
chapter metadata, destination path, and an exact/prefix/suffix/offset anchor.

## Accessibility contract

The reader is a labelled landmark containing rendered semantic Markdown. All
commands are real buttons with accessible names, visible focus, disabled state,
and keyboard equivalents. Page and chapter changes are announced through a
polite live region. Reduced motion disables all navigation animation, and
high-contrast system preferences preserve borders, focus, and control contrast.
Animation is decorative and never required to navigate or understand state.

## Pagination fallback

CSS columns work well for prose but some rendered blocks can be taller than a
page or require their own scrolling surface. Content classification will mark
incompatible chapters for a vertical reading fallback rather than clipping or
hiding material. The fallback keeps navigation, progress, bookmarks, headings,
and annotations available while using normal document flow.

PDF embeds always use vertical flow. Other interactive and break-avoiding blocks
switch only when their measured or estimated height exceeds the safe viewport.
The fallback stores the viewport scroll fraction in the same normalized location
model used by paginated chapters.
