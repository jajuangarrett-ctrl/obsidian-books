# Test checklist and results

Last updated: 2026-07-22

Statuses: **Pass**, **Fail**, **Pending**, or **Physical device required**. Unless
noted otherwise, manual results below were recorded in Obsidian 1.12.7 on macOS
using the dedicated `obsidian-books-test` vault.

## Automated validation

| Check             | Status | Current evidence                                                                                                                                                                          |
| ----------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format check      | Pass   | `npm run format:check`                                                                                                                                                                    |
| ESLint            | Pass   | `npm run lint`; one advisory retained for the Obsidian 1.13 declarative settings API                                                                                                      |
| Unit tests        | Pass   | 25 tests across pagination geometry, translation, normalized positions, migration, book discovery helpers, bookmarks, text-anchor recovery, quote formatting, and fallback classification |
| Type check        | Pass   | Strict TypeScript through `npm run build`                                                                                                                                                 |
| Production bundle | Pass   | esbuild produces `main.js`                                                                                                                                                                |
| GitHub Actions    | Pass   | Hosted Linux validation completed successfully for the TypeScript foundation                                                                                                              |

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
| Reduced motion                                        | Pending                  |                                                                                                         |
| Increased contrast and visible focus                  | Pending                  | Focus styling is present; the operating-system increased-contrast mode still needs a direct pass        |
| Keyboard-only operation                               | Pass                     | Command launch and all primary page-navigation keys passed                                              |
| Screen-reader labels and page announcements           | Physical device required | Accessibility tree exposes labelled reader, buttons, headings, and progress; VoiceOver remains untested |

## Rendered Markdown compatibility

| Content                     | Status  | Notes                                                                                                       |
| --------------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| Long prose and headings     | Pass    | Stress fixture paginates across responsive one- and two-page layouts                                        |
| Images                      | Pass    | Local SVG cover rendered in the reader                                                                      |
| Callouts                    | Pass    | Native rendered callout visible and themed                                                                  |
| Tables                      | Pass    | Native rendered table visible and aligned                                                                   |
| Inline and fenced code      | Pass    | Both forms rendered through `MarkdownRenderer`                                                              |
| Dataview                    | Pass    | Dataview 0.5.68 rendered a live three-row table through its Markdown post-processor                         |
| Tasks                       | Pass    | Tasks 8.2.2 rendered interactive query results; standard checkboxes also passed                             |
| Mermaid                     | Pass    | Diagram rendered in the stress fixture                                                                      |
| Note and block embeds       | Pass    | Embedded note rendered with its heading and backlink                                                        |
| PDFs                        | Pass    | A real one-page PDF rendered completely and selected the native vertical fallback                           |
| Audio and video             | Pass    | Native controls responded to play/pause, and content after every embed remained reachable                   |
| Footnotes                   | Pass    | Footnote content and return link rendered                                                                   |
| Internal and external links | Pending | Both render and remain excluded from page turns; full navigation automation remains                         |
| Checkboxes                  | Pass    | Checkbox changed state without changing the current reader page                                             |
| Oversized content fallback  | Pass    | 50-line code fixture switched to vertical flow; Page Down and wheel reached 81–100% and reopen restored 81% |

## Touch and mobile conflicts

| Workflow                                                   | Status                   | Notes                                                                            |
| ---------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------- |
| Swipe page turns                                           | Pass                     | Synthetic renderer touch swipe advanced one page                                 |
| Text selection does not turn a page                        | Pass                     | Pointer selection enabled highlight/quote controls without changing the page     |
| Links and checkboxes remain interactive                    | Pass                     | Checkbox toggled and both interaction types were excluded from page turning      |
| Embedded horizontal/vertical scrolling wins over page turn | Pass                     | Synthetic swipe beginning in a scrollable child did not paginate                 |
| Operating-system edge gesture remains available            | Pass                     | Synthetic gesture beginning at the left OS edge did not paginate                 |
| Obsidian sidebars remain usable                            | Pass                     | Sidebar toggle worked and reader reflowed without losing its normalized position |
| Mobile portrait and landscape                              | Pass                     | Desktop viewport simulation passed; physical mobile remains separate below       |
| iPad single/two-page layouts                               | Pass                     | Narrow single-page and wide two-page viewport simulations passed                 |
| Physical iPad touch, orientation, and VoiceOver            | Physical device required | Final device availability must be recorded                                       |

## Books and study tools

| Workflow                                    | Status | Notes                                                                                                              |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| Single-note book                            | Pass   | Recently read stress fixture appears and opens from the bookshelf                                                  |
| Folder book with `Book.md`                  | Pass   | Three-chapter dedicated-vault fixture discovered from its manifest                                                 |
| Ordered chapters and one-chapter loading    | Pass   | Declared 01/02/10 order preserved; accessibility tree contained only the active chapter                            |
| Covers and metadata                         | Pass   | SVG cover, title, author, and chapter count rendered on the shelf                                                  |
| Table of contents and chapter navigation    | Pass   | Next/previous boundaries and direct Contents jump passed                                                           |
| Bookmarks                                   | Pass   | Added from the toolbar, exposed in Contents, persisted across vault close/reopen, and restored by chapter/fraction |
| Highlights survive repagination             | Pass   | Highlight persisted across plugin reload and recovered after nearby source insertion shifted offsets               |
| Quotes write to each configured destination | Pass   | Shared note, adjacent per-book `Annotations.md`, and configured annotation folder all passed                       |
| Quote reopens source near passage           | Pass   | Generated `obsidian://books-open` link reopened the saved book/chapter/fraction                                    |
| Source Markdown unchanged by default        | Pass   | Highlight and quote capture left the source chapter free of injected markers                                       |
