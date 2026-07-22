# Obsidian Books

Obsidian Books turns rendered Markdown notes into a focused, paginated reading
experience on Obsidian desktop and mobile. It is based on
[MD Reader](https://github.com/mrrepac/obsidian-md-reader) and preserves its CSS
columns plus `translateX` pagination model instead of replacing the proven
foundation.

> [!NOTE]
> Obsidian Books is an early development preview. Single-note reading is working;
> bookmarks, annotations, quote capture, and advanced compatibility fallbacks are
> under active development.

## Current features

- Render Markdown with Obsidian's supported `MarkdownRenderer` API.
- Read in responsive one-page or two-page spreads.
- Navigate with swipe, tap zones, arrow keys, Page Up/Down, Space, Home/End,
  mouse wheel, or labelled on-screen buttons.
- Choose None, Horizontal Slide, or 3D Page Turn transitions. The 3D option is a
  perspective animation over MD Reader's column layout, not a paper curl.
- Preserve reading position as a percentage when fonts, themes, or window size
  cause the note to reflow.
- Adjust font size, line height, maximum page width, and page gap.
- Choose the Obsidian theme, white, cream, sepia, or dark reading surface; switch
  between the theme font, a book serif, and a clean sans serif; and adjust
  paragraph spacing and outer page margins.
- Use immersive reading while retaining an Escape-key exit.
- Respect theme colors, visible keyboard focus, reduced-motion preferences, and
  increased-contrast preferences.
- Keep links, checkboxes, media controls, selected text, scrollable embeds, and
  operating-system edge gestures out of page-turn handling.
- Load legacy MD Reader settings and positions when its `data.json` is carried
  into the Obsidian Books plugin folder.
- Discover recently read or explicitly marked single-note books in a searchable
  bookshelf.
- Discover folder books from `Book.md`, including title, author, cover, declared
  chapter order, and numeric-aware fallback ordering.
- Render only the active chapter, continue across chapter boundaries, open a
  table of contents, and resume saved book/chapter progress.
- Show estimated minutes left in the active chapter and save persistent
  chapter-aware bookmarks from the reader toolbar.

## Folder books

Add `Book.md` to a folder and optionally declare metadata in its frontmatter:

```yaml
---
title: The Long Way Home
author: Ada Reader
cover: '[[cover.jpg]]'
chapters:
  - '[[01 Arrival]]'
  - '[[02 Crossing]]'
  - '[[10 Home]]'
---
```

When `chapters` is omitted, Markdown files beneath the folder are ordered with
numeric-aware path sorting. Nested folders with their own `Book.md` stay separate.
Mark a standalone note with `book: true`, `obsidian-books: true`, or `type: book`
to keep it on the bookshelf before it has reading history.

## Open a note

With a Markdown note active, use any of these:

- Select the book icon in the ribbon.
- Run **Open current note in Obsidian Books** from the command palette.
- Right-click a Markdown file and choose **Open in Obsidian Books**.

## Manual installation

Obsidian Books is not yet in the Community Plugins catalog. To install a local
development build:

1. Run `npm ci && npm run build`.
2. Create `<vault>/.obsidian/plugins/obsidian-books/` in a dedicated test vault.
3. Copy `main.js`, `manifest.json`, and `styles.css` into that folder.
4. Restart Obsidian, then enable **Obsidian Books** under Community plugins.

Do not develop or initially test the plugin in an important vault. Obsidian's
developer documentation recommends a dedicated test vault.

## Development

Requirements: Node.js 22 or later and npm.

```bash
npm ci
npm run dev
```

Quality commands:

```bash
npm run format:check
npm run lint
npm test
npm run build
npm run validate
```

The source uses the official Obsidian sample-plugin TypeScript/esbuild structure.
The production bundle is `main.js`; Obsidian also requires `manifest.json` and
`styles.css`.

## Project documentation

- [Architecture and upstream audit](docs/ARCHITECTURE.md)
- [Phased implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Test checklist and results](docs/TEST_CHECKLIST.md)
- [Changes](CHANGELOG.md)
- [MD Reader attribution](NOTICE.md)

## Known limitations

- Highlights, quotes, and annotation destinations are not implemented yet.
- Very tall or unusually interactive rendered blocks still need the planned
  vertical-flow fallback and full compatibility testing.
- Mobile and iPad behavior has not yet been validated on a physical iPad.
- Screenshots will be added after the reader design stabilizes.

## License

[MIT](LICENSE). The original MD Reader copyright and license are preserved; see
[NOTICE.md](NOTICE.md) for attribution.
