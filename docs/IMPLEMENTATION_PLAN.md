# Phased implementation plan

Each phase ends with a clean build, lint, format check, automated tests, an
install into a dedicated test vault, and a conventional commit pushed to GitHub.
Runtime failures return to the current phase until reproduced, fixed, rebuilt,
reinstalled, and retested.

## Phase 0 — Foundation and audit

- Preserve MD Reader history, MIT license, and attribution.
- Create the Obsidian Books repository and `upstream` remote.
- Record architecture, compatibility risks, phases, test scope, and release
  gates.

Exit evidence: public repository, remotes, license, architecture notes, and this
plan.

## Phase 1 — TypeScript parity and supported APIs

- Adopt the official Obsidian sample-plugin TypeScript/esbuild structure.
- Split settings, pagination math, the reader view, and plugin lifecycle.
- Rebrand IDs, UI text, CSS classes, and data without breaking legacy settings
  and positions.
- Remove undocumented mobile and workspace hooks.
- Add ESLint, Prettier, Vitest, CI, and unit tests for geometry, saved positions,
  settings migration, and interaction classification.
- Preserve MD Reader behavior before adding new product features.

Exit evidence: build, lint, format, and tests pass; baseline note paginates and
navigates in the test vault on desktop.

## Phase 2 — Reading experience and accessibility

- Add None, Horizontal Slide, and 3D Page Turn transitions.
- Add Apple Books-inspired controls and white, cream, sepia, and dark surfaces.
- Add adjustable font family, font size, line height, paragraph spacing, page
  width, margins, and page gap.
- Improve portrait and landscape spreads, immersive mode, table of contents,
  chapter controls, bookmarks, progress, and reading-time estimate.
- Add landmarks, labels, semantic controls, live announcements, focus states,
  reduced motion, and high contrast.
- Detect content that cannot paginate safely and use a readable scroll fallback.

Exit evidence: interaction tests plus desktop checks across themes, font
extremes, window sizes, keyboard, reduced motion, and assistive labels.

## Phase 3 — Bookshelf and folder books

- Discover single-note books and folders containing `Book.md`.
- Parse title, author, cover, and ordered chapter frontmatter.
- Fall back to deterministic natural chapter order when no order is declared.
- Load only the active chapter and preserve book/chapter progress.
- Add covers, metadata, bookshelf search, and source-health states.

Exit evidence: small and large fixture books open from the bookshelf, chapter
navigation works, and only the active chapter is rendered.

## Phase 4 — Highlights, quotes, and study tools

- Allow text selection without triggering page turns.
- Store a quote plus source note, book, chapter, heading, date, normalized
  position, selected text context, and resilient anchor data.
- Render highlights without changing source Markdown by default.
- Support a single quotes note, per-book annotations note, or configurable
  annotation folder.
- Reopen the reader near a quote and recover anchors after repagination and
  reasonable nearby edits.
- Gate optional source-Markdown mutation behind an explicit setting and warning.

Exit evidence: create, reload, reopen, and remove annotations across reflow and
theme changes without source modification.

## Phase 5 — Compatibility, device validation, and release

- Exercise long prose, images, callouts, tables, code, Dataview, Tasks, Mermaid,
  embeds, PDFs, media, footnotes, links, and checkboxes.
- Exercise portrait/landscape geometry, single/two-page layouts, themes, font
  extremes, selection, embedded scrolling, sidebars, and operating-system edge
  gestures.
- Validate keyboard and screen-reader flow, live announcements, visible focus,
  reduced motion, and high contrast.
- Test desktop directly and use available mobile/iPad simulation; identify tests
  that require a physical iPad and VoiceOver.
- Finish README, screenshots, changelog, test checklist/results, manifest,
  versions, release assets, and limitations.

Release gates: clean install, build, lint, format check, all automated tests,
desktop computer-use validation, documented device results, and no known failing
required workflow.

