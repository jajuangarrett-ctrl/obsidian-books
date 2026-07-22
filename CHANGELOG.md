# Changelog

All notable changes to Obsidian Books will be documented in this file.

## [Unreleased]

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

### Removed

- Direct Capacitor status-bar access.
- The internal `data-ignore-swipe` mobile hook.
- Direct workspace split access for sidebar collapse and restoration.

These removals keep the plugin on supported Obsidian APIs and browser features.
