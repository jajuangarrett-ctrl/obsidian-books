# Test checklist and results

Last updated: 2026-07-22

Statuses: **Pass**, **Fail**, **Pending**, or **Physical device required**.

## Automated validation

| Check             | Status | Current evidence                                                                           |
| ----------------- | ------ | ------------------------------------------------------------------------------------------ |
| Format check      | Pass   | `npm run format:check`                                                                     |
| ESLint            | Pass   | `npm run lint`; one advisory retained for the Obsidian 1.13 declarative settings API       |
| Unit tests        | Pass   | 9 tests across pagination geometry, normalized position conversion, and settings migration |
| Type check        | Pass   | Strict TypeScript through `npm run build`                                                  |
| Production bundle | Pass   | esbuild produces `main.js`                                                                 |
| GitHub Actions    | Pass   | Hosted Linux validation completed successfully for the TypeScript foundation               |

## Desktop reader

| Workflow                                              | Status  | Notes                        |
| ----------------------------------------------------- | ------- | ---------------------------- |
| Install and enable in dedicated test vault            | Pending |                              |
| Open from ribbon, command, and file menu              | Pending |                              |
| None transition                                       | Pending |                              |
| Horizontal Slide transition                           | Pending |                              |
| 3D Page Turn transition                               | Pending |                              |
| Arrow, Page Up/Down, Space, Home/End navigation       | Pending |                              |
| Mouse wheel navigation                                | Pending |                              |
| Tap zones and visible controls                        | Pending |                              |
| Single-page portrait/narrow layout                    | Pending |                              |
| Two-page landscape/wide layout                        | Pending |                              |
| Responsive repagination preserves approximate passage | Pending |                              |
| Immersive mode enters and exits safely                | Pending |                              |
| Light and dark Obsidian themes                        | Pending |                              |
| Minimum and maximum font/spacing settings             | Pending |                              |
| Reduced motion                                        | Pending |                              |
| Increased contrast and visible focus                  | Pending |                              |
| Keyboard-only operation                               | Pending |                              |
| Screen-reader labels and page announcements           | Pending | VoiceOver validation planned |

## Rendered Markdown compatibility

| Content                     | Status  | Notes                      |
| --------------------------- | ------- | -------------------------- |
| Long prose and headings     | Pending |                            |
| Images                      | Pending |                            |
| Callouts                    | Pending |                            |
| Tables                      | Pending |                            |
| Inline and fenced code      | Pending |                            |
| Dataview                    | Pending | Requires test-vault plugin |
| Tasks                       | Pending | Requires test-vault plugin |
| Mermaid                     | Pending |                            |
| Note and block embeds       | Pending |                            |
| PDFs                        | Pending |                            |
| Audio and video             | Pending |                            |
| Footnotes                   | Pending |                            |
| Internal and external links | Pending |                            |
| Checkboxes                  | Pending |                            |
| Oversized content fallback  | Pending | Not implemented yet        |

## Touch and mobile conflicts

| Workflow                                                   | Status                   | Notes                                      |
| ---------------------------------------------------------- | ------------------------ | ------------------------------------------ |
| Swipe page turns                                           | Pending                  |                                            |
| Text selection does not turn a page                        | Pending                  |                                            |
| Links and checkboxes remain interactive                    | Pending                  |                                            |
| Embedded horizontal/vertical scrolling wins over page turn | Pending                  |                                            |
| Operating-system edge gesture remains available            | Pending                  |                                            |
| Obsidian sidebars remain usable                            | Pending                  |                                            |
| Mobile portrait and landscape                              | Pending                  | Simulator or device                        |
| iPad single/two-page layouts                               | Pending                  | Simulator or device                        |
| Physical iPad touch, orientation, and VoiceOver            | Physical device required | Final device availability must be recorded |

## Books and study tools

| Workflow                                    | Status  | Notes                                           |
| ------------------------------------------- | ------- | ----------------------------------------------- |
| Single-note book                            | Pending | Baseline reader exists; bookshelf model pending |
| Folder book with `Book.md`                  | Pending | Not implemented                                 |
| Ordered chapters and one-chapter loading    | Pending | Not implemented                                 |
| Covers and metadata                         | Pending | Not implemented                                 |
| Table of contents and chapter navigation    | Pending | Not implemented                                 |
| Bookmarks                                   | Pending | Not implemented                                 |
| Highlights survive repagination             | Pending | Not implemented                                 |
| Quotes write to each configured destination | Pending | Not implemented                                 |
| Quote reopens source near passage           | Pending | Not implemented                                 |
| Source Markdown unchanged by default        | Pending | Not implemented                                 |
