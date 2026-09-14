# Changelog

All notable changes to Iconry are documented here. Newest first.

---

## Moved to the OM-DevTeam org

Iconry now lives at **OM-DevTeam/iconry-app**, and the live app moved with it.

**New link — update your bookmarks:**
`https://om-devteam.github.io/iconry-app/`

The old `jason-om.github.io/iconry-app/` address no longer works, so any
bookmark or saved link from before this change will 404.

If you cloned the repo before the move, point your copy at the new home:

```bash
git remote set-url origin git@github.com:OM-DevTeam/iconry-app.git
```

Nothing about the app itself changed in this move.

---

## v1.1.0 — Workspace layout

**Live:** https://om-devteam.github.io/iconry-app/

This release rebuilds the interface as a proper workspace. The old page
scrolled as one long column; Iconry now fills the window with three panels
that stay put while you work, so the icon you're editing no longer slides out
of view when you reach for a control.

### What's new

**A three-panel workspace**
The window is now split into a fixed shell — your icons on the left, the
preview in the middle, and the controls on the right. Nothing scrolls away
mid-edit.

**Collapsible side panels**
Click the `‹` / `›` chevron on either panel to fold it into a slim rail and
hand the space to the preview. Useful when you're fine-tuning a single icon
and want it as large as possible. Click again to bring the panel back.

**A persistent top bar**
Icon count and the Single/Grid toggle now live in a bar pinned to the top of
the window, reachable from anywhere.

**Icons moved to their own panel**
Pasting SVG code, uploading files, and the loaded-icon thumbnails have moved
out of the sidebar into a dedicated left panel. The old filmstrip under the
preview is gone — the thumbnails in the left panel replace it.

**Drop files anywhere**
The drag-and-drop target is now the whole window instead of just the preview
area, so you can release a batch of SVGs wherever your cursor happens to be.

**A typeable export size**
Export size was a slider with a read-only number. It's now an editable field —
type an exact value (1–2048) instead of nudging a slider toward it. The slider
and presets still work as before.

**Small-screen layout**
Below 820px wide the three panels stack vertically and the collapse chevrons
hide, so Iconry stays usable on a laptop in split-screen or on a tablet.

**A real browser icon**
Iconry now has its own favicon, so it's easy to pick out when you have a wall
of tabs open.

### Fixed

**Export size and scale could silently produce the wrong number.**
Both fields corrected the value on every keystroke, so clearing a field
snapped it to its minimum. Typing over that appended to it — entering `256`
in the export field produced `1256`, and the icon exported at the wrong size
with nothing on screen indicating a problem. Both fields now accept a
half-typed value and only correct it when you leave the field.

### Notes for the team

- Nothing you've exported before is affected — the SVG processing itself is
  unchanged. This release is interface work plus the input fix above.
- Settings and loaded icons still live in memory for the session. A refresh
  clears them; persistence isn't built yet.
- Everything still runs entirely in your browser. No icon is ever uploaded.

---

## v1.0.0 — Initial release

First working version of Iconry.

- Load icons by dragging `.svg` files in, browsing for them, or pasting SVG
  code
- Detects whether an icon is line or fill and adapts the controls to it
- **Colors** — keep the original, set a solid fill/stroke, or switch to
  `currentColor` so the icon inherits color from CSS (best for Elementor)
- **Display** — scale, nudge, rotate, and flip
- **Stroke** — adjust weight, or **Normalize** a mismatched line-icon pack to
  a single uniform value
- Rename icons inline; names auto-format to web-safe `kebab-case`
- Export by copying the code, downloading one file, or downloading the whole
  set as a `.zip` with de-duplicated names
- Auto-deploys to GitHub Pages on every push to `main`
