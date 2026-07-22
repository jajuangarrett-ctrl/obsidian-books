# Test checklist and results

Last updated: 2026-07-22

Statuses: **Pass**, **Fail**, **Pending**, or **Physical device required**.

## Automated validation

| Check             | Status | Current evidence                                                                                                                                             |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Format check      | Pass   | `npm run format:check`                                                                                                                                       |
| ESLint            | Pass   | `npm run lint`; one advisory retained for the Obsidian 1.13 declarative settings API                                                                         |
| Unit tests        | Pass   | 15 tests across pagination geometry, centered-stage translation, normalized positions, settings migration, book markers, chapter links, and natural ordering |
| Type check        | Pass   | Strict TypeScript through `npm run build`                                                                                                                    |
| Production bundle | Pass   | esbuild produces `main.js`                                                                                                                                   |
| GitHub Actions    | Pass   | Hosted Linux validation completed successfully for the TypeScript foundation                                                                                 |

## Desktop reader

| Workflow                                              | Status  | Notes                                                                                                     |
| ----------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| Install and enable in dedicated test vault            | Pass    | Enabled in `obsidian-books-test`, outside the primary vault                                               |
| Open from ribbon, command, and file menu              | Pending |                                                                                                           |
| None transition                                       | Pass    | Selected through plugin settings and used for page navigation                                             |
| Horizontal Slide transition                           | Pass    | Default transition exercised during initial navigation                                                    |
| 3D Page Turn transition                               | Pass    | Selected through plugin settings and used for page navigation                                             |
| Arrow, Page Up/Down, Space, Home/End navigation       | Pending |                                                                                                           |
| Mouse wheel navigation                                | Pending |                                                                                                           |
| Tap zones and visible controls                        | Pending | Labelled next button passed; tap zones still need direct touch validation                                 |
| Single-page portrait/narrow layout                    | Pass    | Stable centered page with six-page stress fixture                                                         |
| Two-page landscape/wide layout                        | Pass    | Sidebar toggle reflowed the fixture to four two-page spreads                                              |
| Responsive repagination preserves approximate passage | Pass    | Page 3/4 reflowed to page 4/6 at the equivalent reading fraction                                          |
| Immersive mode enters and exits safely                | Pending |                                                                                                           |
| Light and dark Obsidian themes                        | Pending |                                                                                                           |
| Minimum and maximum font/spacing settings             | Pending |                                                                                                           |
| Reduced motion                                        | Pending |                                                                                                           |
| Increased contrast and visible focus                  | Pending |                                                                                                           |
| Keyboard-only operation                               | Pending |                                                                                                           |
| Screen-reader labels and page announcements           | Pending | Accessibility tree exposes labelled reader, buttons, headings, and progress; VoiceOver validation remains |

## Rendered Markdown compatibility

| Content                     | Status  | Notes                                                                               |
| --------------------------- | ------- | ----------------------------------------------------------------------------------- |
| Long prose and headings     | Pass    | Stress fixture paginates across responsive one- and two-page layouts                |
| Images                      | Pass    | Local SVG cover rendered in the reader                                              |
| Callouts                    | Pass    | Native rendered callout visible and themed                                          |
| Tables                      | Pass    | Native rendered table visible and aligned                                           |
| Inline and fenced code      | Pass    | Both forms rendered through `MarkdownRenderer`                                      |
| Dataview                    | Pending | Requires test-vault plugin                                                          |
| Tasks                       | Pending | Requires test-vault plugin                                                          |
| Mermaid                     | Pass    | Diagram rendered in the stress fixture                                              |
| Note and block embeds       | Pass    | Embedded note rendered with its heading and backlink                                |
| PDFs                        | Pending |                                                                                     |
| Audio and video             | Pending |                                                                                     |
| Footnotes                   | Pass    | Footnote content and return link rendered                                           |
| Internal and external links | Pending | Both render and remain excluded from page turns; full navigation automation remains |
| Checkboxes                  | Pass    | Checkbox changed state without changing the current reader page                     |
| Oversized content fallback  | Pending | Not implemented yet                                                                 |

## Touch and mobile conflicts

| Workflow                                                   | Status                   | Notes                                                                                     |
| ---------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| Swipe page turns                                           | Pending                  |                                                                                           |
| Text selection does not turn a page                        | Pending                  |                                                                                           |
| Links and checkboxes remain interactive                    | Pending                  | Checkbox passed; link was excluded from page turning but macOS automation only focused it |
| Embedded horizontal/vertical scrolling wins over page turn | Pending                  |                                                                                           |
| Operating-system edge gesture remains available            | Pending                  |                                                                                           |
| Obsidian sidebars remain usable                            | Pending                  |                                                                                           |
| Mobile portrait and landscape                              | Pending                  | Simulator or device                                                                       |
| iPad single/two-page layouts                               | Pending                  | Simulator or device                                                                       |
| Physical iPad touch, orientation, and VoiceOver            | Physical device required | Final device availability must be recorded                                                |

## Books and study tools

| Workflow                                    | Status  | Notes                                                                                   |
| ------------------------------------------- | ------- | --------------------------------------------------------------------------------------- |
| Single-note book                            | Pass    | Recently read stress fixture appears and opens from the bookshelf                       |
| Folder book with `Book.md`                  | Pass    | Three-chapter dedicated-vault fixture discovered from its manifest                      |
| Ordered chapters and one-chapter loading    | Pass    | Declared 01/02/10 order preserved; accessibility tree contained only the active chapter |
| Covers and metadata                         | Pass    | SVG cover, title, author, and chapter count rendered on the shelf                       |
| Table of contents and chapter navigation    | Pass    | Next/previous boundaries and direct Contents jump passed                                |
| Bookmarks                                   | Pending | Not implemented                                                                         |
| Highlights survive repagination             | Pending | Not implemented                                                                         |
| Quotes write to each configured destination | Pending | Not implemented                                                                         |
| Quote reopens source near passage           | Pending | Not implemented                                                                         |
| Source Markdown unchanged by default        | Pending | Not implemented                                                                         |
