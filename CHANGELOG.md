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

### Changed

- Rebranded the plugin, view type, commands, settings, and CSS namespace from MD
  Reader to Obsidian Books.
- Raised the minimum Obsidian version to 1.7.2 to use the supported
  `Workspace.revealLeaf` API.
- Migrated saved settings to a versioned nested data format while accepting the
  original MD Reader shape.

### Removed

- Direct Capacitor status-bar access.
- The internal `data-ignore-swipe` mobile hook.
- Direct workspace split access for sidebar collapse and restoration.

These removals keep the plugin on supported Obsidian APIs and browser features.
