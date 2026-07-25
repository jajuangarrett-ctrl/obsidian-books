# Test checklist and results

Last updated: 2026-07-25

Statuses: **Pass**, **Fail**, **Pending**, or **Physical device required**. Unless
noted otherwise, manual results below were recorded in Obsidian 1.12.7 on macOS
using the dedicated `obsidian-books-test` vault.

## Automated validation

| Check             | Status | Current evidence                                                                                                                                                                                                                                                       |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format check      | Pass   | `npm run format:check`                                                                                                                                                                                                                                                 |
| ESLint            | Pass   | `npm run lint`; one advisory retained for the Obsidian 1.13 declarative settings API                                                                                                                                                                                   |
| Unit tests        | Pass   | 38 tests across pagination geometry, touch/pen/mouse highlight and swipe intent, translation, normalized positions, migration, bookshelf visibility, book discovery helpers, bookmarks, text-anchor recovery, quote and export formatting, and fallback classification |
| Type check        | Pass   | Strict TypeScript through `npm run build`                                                                                                                                                                                                                              |
| Production bundle | Pass   | esbuild produces `main.js`                                                                                                                                                                                                                                             |
| GitHub Actions    | Pass   | Hosted Linux validation completed successfully for the TypeScript foundation                                                                                                                                                                                           |

## Desktop reader

| Workflow                                              | Status                   | Notes                                                                                                   |
| ----------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| Install and enable in dedicated test vault            | Pass                     | Enabled in `obsidian-books-test`, outside the primary vault                                             |
| Open from ribbon, command, and file menu              | Pass                     | All three entry points opened the active note in the reader                                             |
| None transition                                       | Pass                     | Selected through plugin settings and used for page navigation                                           |
| Horizontal Slide transition                           | Pass                     | Default transition exercised during initial navigation                                                  |
| 3D Page Turn transition                               | Pass                     | Selected through plugin settings and used for page navigation                                           |
| Arrow, Page Up/Down, Space, Home/End navigation       | Pass                     | Forward, reverse, first-page, and last-page paths passed                                                |
| Mouse wheel navigation                                | Pass                     | Paginates horizontal flow; native wheel scroll remains available in vertical fallback                   |
| Tap zones and visible controls                        | Pass                     | Left/right tap zones and labelled toolbar/page controls all changed pages correctly                     |
| Single-page portrait/narrow layout                    | Pass                     | Narrow desktop viewport produced a stable centered seven-page layout                                    |
| Two-page landscape/wide layout                        | Pass                     | Wide desktop viewport produced a five-spread two-page layout                                            |
| Responsive repagination preserves approximate passage | Pass                     | Page 3/7 reflowed to page 2/5 while preserving the normalized reading location                          |
| Immersive mode enters and exits safely                | Pass                     | Pointer reveal/hide and Escape reveal passed                                                            |
| Light and dark Obsidian themes                        | Pass                     | Theme-derived light and dark surfaces passed; cream override also passed                                |
| Minimum and maximum font/spacing settings             | Pass                     | Font, line height, paragraph spacing, margin, and gap extremes remained readable                        |
| Reduced motion                                        | Pass                     | DevTools media emulation matched `reduce` and produced a `0s` reader-stage transition                   |
| Increased contrast and visible focus                  | Pass                     | DevTools media emulation matched `more`, added the 1px progress border, and retained focus styling      |
| Keyboard-only operation                               | Pass                     | Command launch and all primary page-navigation keys passed                                              |
| Screen-reader labels and page announcements           | Physical device required | Accessibility tree exposes labelled reader, buttons, headings, and progress; VoiceOver remains untested |

## Rendered Markdown compatibility

| Content                     | Status | Notes                                                                                                       |
| --------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| Long prose and headings     | Pass   | Stress fixture paginates across responsive one- and two-page layouts                                        |
| Images                      | Pass   | Local SVG cover rendered in the reader                                                                      |
| Callouts                    | Pass   | Native rendered callout visible and themed                                                                  |
| Tables                      | Pass   | Native rendered table visible and aligned                                                                   |
| Inline and fenced code      | Pass   | Both forms rendered through `MarkdownRenderer`                                                              |
| Dataview                    | Pass   | Dataview 0.5.68 rendered a live three-row table through its Markdown post-processor                         |
| Tasks                       | Pass   | Tasks 8.2.2 rendered interactive query results; standard checkboxes also passed                             |
| Mermaid                     | Pass   | Diagram rendered in the stress fixture                                                                      |
| Note and block embeds       | Pass   | Embedded note rendered with its heading and backlink                                                        |
| PDFs                        | Pass   | A real one-page PDF rendered completely and selected the native vertical fallback                           |
| Audio and video             | Pass   | Native controls responded to play/pause, and content after every embed remained reachable                   |
| Footnotes                   | Pass   | Footnote content and return link rendered                                                                   |
| Internal and external links | Pass   | Internal link opened its vault note; external link opened `obsidian.md` in Safari without paginating        |
| Checkboxes                  | Pass   | Checkbox changed state without changing the current reader page                                             |
| Oversized content fallback  | Pass   | 50-line code fixture switched to vertical flow; Page Down and wheel reached 81–100% and reopen restored 81% |

## Touch and mobile conflicts

| Workflow                                                   | Status                   | Notes                                                                                                                                   |
| ---------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Swipe page turns                                           | Pass                     | Synthetic renderer touch swipe advanced one page                                                                                        |
| Touch-swiped page remains centered                         | Pass                     | At a 1027px iPad-like viewport, both swipe directions held the transform stable during movement, snapped one page, and returned exactly |
| Text selection does not turn a page                        | Pass                     | Native pointer selection enabled highlight/quote controls and saved a highlight while remaining on page 2 of 5                          |
| Direct drag-to-highlight mode                              | Pass                     | Active marker mode saved forward and reverse mouse drags on lift, remained active for repeated highlights, and stayed on page 2 of 5    |
| Finger and Apple Pencil marker input                       | Physical device required | Pointer routing accepts and tests both `touch` and `pen`; final physical-device feel and Pencil precision remain to be confirmed        |
| Links and checkboxes remain interactive                    | Pass                     | Checkbox toggled and both interaction types were excluded from page turning                                                             |
| Embedded horizontal/vertical scrolling wins over page turn | Pass                     | Synthetic swipe beginning in a scrollable child did not paginate                                                                        |
| Operating-system edge gesture remains available            | Pass                     | Synthetic gesture beginning at the left OS edge did not paginate                                                                        |
| Obsidian sidebars remain usable                            | Pass                     | Sidebar toggle worked and reader reflowed without losing its normalized position                                                        |
| Mobile portrait and landscape                              | Pass                     | Desktop viewport simulation passed; physical mobile remains separate below                                                              |
| iPad single/two-page layouts                               | Pass                     | Narrow single-page and wide two-page viewport simulations passed                                                                        |
| iPad bookshelf cards and long titles                       | Pass                     | Five books at a 1027px iPad-like viewport had no grid, card, title, metadata, or progress overflow; titles used at most two lines       |
| Physical iPad touch, orientation, and VoiceOver            | Physical device required | Final device availability must be recorded                                                                                              |

## Books and study tools

| Workflow                                    | Status | Notes                                                                                                                                                                         |
| ------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single-note book                            | Pass   | Recently read stress fixture appears and opens from the bookshelf                                                                                                             |
| Folder book with `Book.md`                  | Pass   | Three-chapter dedicated-vault fixture discovered from its manifest                                                                                                            |
| Ordered chapters and one-chapter loading    | Pass   | Declared 01/02/10 order preserved; accessibility tree contained only the active chapter                                                                                       |
| Covers and metadata                         | Pass   | SVG cover, title, author, and chapter count rendered on the shelf                                                                                                             |
| Remove and restore bookshelf book           | Pass   | Removed Reader Stress Test from a five-card shelf without changing its source, seven annotations, bookmark, or 25% position; reopening restored its card and page 2 highlight |
| Table of contents and chapter navigation    | Pass   | Next/previous boundaries and direct Contents jump passed                                                                                                                      |
| Bookmarks                                   | Pass   | Added from the toolbar, exposed in Contents, persisted across vault close/reopen, and restored by chapter/fraction                                                            |
| Bookmark action in Contents                 | Pass   | Explicit action added the page-2 bookmark, switched to remove state, listed the 25% location, and removed it cleanly                                                          |
| Highlights survive repagination             | Pass   | Highlight persisted across plugin reload and recovered after nearby source insertion shifted offsets                                                                          |
| Quotes write to each configured destination | Pass   | Shared note, adjacent per-book `Annotations.md`, and configured annotation folder all passed                                                                                  |
| Export all highlights                       | Pass   | Created one managed highlights note, opened it, and refreshed the same file from both command and settings button                                                             |
| Export all quotes                           | Pass   | Created one separate managed quotes note, opened it, and refreshed the same file without duplicate snapshots                                                                  |
| Quote reopens source near passage           | Pass   | Generated `obsidian://books-open` link reopened the saved book/chapter/fraction                                                                                               |
| Source Markdown unchanged by default        | Pass   | Highlight and quote capture left the source chapter free of injected markers                                                                                                  |
