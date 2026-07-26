# Changelog

All notable changes to Obsidian Books will be documented in this file.

## [Unreleased]

## [0.2.3] - 2026-07-25

### Added

- A touch-friendly **Continue highlight on next page** action after saving a
  paginated highlight.
- Repeatable continuation across multiple pages, with **Done** and
  continuation-only **Cancel** actions.
- Pointer and keyboard access to reopen continuation actions from an existing
  saved highlight.
- Automated coverage for page eligibility, reversed selections, and continuous
  text-anchor reconstruction across page fragments.

### Changed

- Replaced separate page fragments with one continuous, resilient annotation so
  saved highlight exports and reopen links retain the full passage.
- Kept the first page fragment saved immediately so cancelling continuation
  never discards completed highlighting work.

## [0.2.2] - 2026-07-25

### Added

- A clearly labelled **Remove from bookshelf** button beneath every book card.
- Persistent, non-destructive bookshelf visibility records for recently opened,
  explicitly marked, and folder-manifest books.
- Automatic shelf restoration when a hidden book is opened again.
- Data migration and automated coverage for hidden-book normalization and
  bookshelf filtering.

### Changed

- Separated bookshelf membership from bookmarks, highlights, quotes, reading
  progress, and source notes so hiding a card never removes reading data.
- Preserved hidden-book records across file and folder renames and cleaned them
  when their source is deleted.

## [0.2.1] - 2026-07-25

### Added

- A persistent highlight mode that previews and automatically saves a text range
  dragged with a finger, Apple Pencil, or mouse.
- An accessible pressed state, active marker styling, and Escape-to-exit behavior
  for the highlight-mode toolbar control.
- Automated coverage for touch, pen, and mouse marker input, deliberate-drag
  detection, and page-gesture exclusion.

### Fixed

- Prevented horizontal pagination from claiming a gesture while native text
  selection is active.
- Cleared the browser selection before wrapping saved text and restored the
  current page or vertical scroll fraction afterward, preventing annotation
  capture from jumping back to the beginning.

## [0.2.0] - 2026-07-24

### Added

- Separate **Export all highlights** and **Export all quotes** commands.
- Matching export buttons in the Quotes and annotations settings section.
- An explicit add/remove-current-bookmark action at the top of the Contents
  panel, making bookmark capture discoverable on iPad.
- Managed Markdown collection notes grouped by book and chapter with source,
  heading, capture date, location, and Obsidian Books reopen links.
- Non-destructive collision handling that preserves an unrelated note at a
  standard export path and creates a timestamped export instead.
- Automated coverage for separated collections, deterministic grouping,
  traceable metadata, managed-file detection, and collision-safe paths.

### Fixed

- Kept the current page centered during touch movement and snapped the
  destination page into the same frame, preventing the entire multi-column text
  strip from flying across iPad and mobile screens during a swipe.
- Constrained bookshelf cards and progress bars to their responsive grid tracks
  and clamped long book titles to two wrapped lines so metadata cannot bleed into
  neighboring cards on iPad.

## [0.1.0] - 2026-07-22

### Added

- Public Obsidian Books repository preserving the MD Reader 1.1.0 Git history.
- Architecture audit, phased implementation plan, attribution, and test checklist.
- Official Obsidian sample-plugin TypeScript and esbuild structure.
- ESLint, Prettier, Vitest, production build, versioning, CI, and release workflow.
- Modular settings migration and pagination geometry with automated tests.
- None, Horizontal Slide, and 3D Page Turn transition settings.
- Accessible page controls, live page status, progress semantics, keyboard focus,
  reduced motion, and increased-contrast styles.
- Input arbitration for text selection, links, controls, scrollable content, and
  operating-system edge gestures.
- Searchable bookshelf for recently read and explicitly marked single-note books.
- Folder-book discovery through `Book.md` with title, author, cover, declared
  chapter order, and numeric-aware fallback ordering.
- Table of contents, chapter controls, cross-chapter page continuation, and saved
  book/chapter progress while loading only the active chapter.
- Theme, white, cream, sepia, and dark reading surfaces; theme, serif, and sans
  font choices; adjustable paragraph spacing and page margins.
- Chapter reading-time estimates and persistent bookmarks that reopen a saved
  source chapter and normalized location.
- Source-safe rendered highlights with exact text, prefix/suffix context, and
  offset anchors that recover after nearby edits and reflow.
- Quote capture to shared, per-book, or folder destinations with source metadata
  and Obsidian protocol links that reopen the saved chapter location.
- Automatic vertical-flow fallback and saved scroll progress for PDFs and
  oversized unbreakable or interactive content.
- Public screenshots covering the bookshelf, responsive reader, annotation
  manager, and oversized-content fallback.

### Changed

- Rebranded the plugin, view type, commands, settings, and CSS namespace from MD
  Reader to Obsidian Books.
- Raised the minimum Obsidian version to 1.7.2 to use the supported
  `Workspace.revealLeaf` API.
- Migrated saved settings to a versioned nested data format while accepting the
  original MD Reader shape.
- Completed dedicated-vault desktop validation for every launch path, reader
  transition, navigation input, responsive spread, theme and typography extreme,
  bookshelf workflow, bookmark, annotation destination, and vertical fallback.
- Completed direct compatibility passes with Dataview 0.5.68, Tasks 8.2.2, a
  rendered PDF, native audio, and native video.
- Delegated rendered vault links through the supported workspace API so
  vault-root paths open reliably from the custom reader view.

### Removed

- Direct Capacitor status-bar access.
- The internal `data-ignore-swipe` mobile hook.
- Direct workspace split access for sidebar collapse and restoration.

These removals keep the plugin on supported Obsidian APIs and browser features.
