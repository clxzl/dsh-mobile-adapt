# Changelog

All notable changes to this plugin are documented here.

## 1.1.0

Tuned against a real, content-heavy session and against the shell's own
auxiliary surfaces (they were invisible on an empty welcome screen).

### Added

- **Settings dialog**: the stock panel is a desktop two-column dialog — a fixed
  188px nav rail beside the options. In a 390px viewport that left ~154px for
  the content, so every option label wrapped one character per line (measured:
  the section box came out 101px wide and 3562px tall). On phones it now
  collapses to a single column with the nav as a horizontal scrolling strip.
- **Drawer internals**: the sidebar component is now sized to the drawer. It
  previously kept rendering at its desktop width of 280px inside a 335px drawer,
  leaving a dead gutter on the right.
- Safe-area padding for the conversation header, for standalone/PWA use behind a
  translucent status bar.

### Fixed

- **Flow and tool summaries are authored as one `nowrap` line** and measured
  1128–3949px wide inside a 390px viewport. The shell clipped them, leaving the
  reader roughly the first third of every preview with no ellipsis; wrapping is
  now allowed so the whole preview is readable.
- Code blocks shipped at 11px, which is unreadable on a phone → 13px.
- Session and project rows shipped at 32–34px. They are `div[role="treeitem"]`,
  not `button`, so the earlier button-sizing rule never reached them → 40px.
- Tap areas for code-block toolbars and message feedback buttons (24–29px) and
  for flow/tool rows (25px) → at least 36px.

### Notes

- Two traps worth remembering when touching the stylesheet:
  - the slot hosts are `display: contents`, so `overflow` / `max-width` on them
    do nothing — target the real grid box instead;
  - `max-width` has no effect on inline elements, which is what the summary
    lines are.

## 1.0.0

Initial release.

- Single-column layout on phones: the 56px sidebar rail no longer consumes 15%
  of the viewport; the sidebar becomes an edge-anchored drawer with a scrim,
  openable by button or edge swipe.
- Dynamic viewport height (`100dvh`) and soft-keyboard handling via
  `visualViewport`.
- Content type at 15px and text entry at 16px (which also avoids iOS zooming the
  page when a control takes focus).
- Long code lines and wide tables scroll inside their own box instead of
  stretching the conversation column.
- Touch targets raised to 40px across the conversation header, composer and
  sidebar, plus `touch-action: manipulation`.
- `viewport-fit=cover` and `safe-area-inset-*` handling.
- Desktop is untouched: every rule is gated behind `html[data-dsh-mobile]`.
