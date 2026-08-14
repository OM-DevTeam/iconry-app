# Iconry

**Recolor, resize, and restyle SVG icons.** Drop in a mismatched set of icons and
get back a consistent family — normalized stroke weight, unified color, tidy names —
then copy or download them individually or as a single `.zip`.

> **Live app:** `https://jason-om.github.io/iconry-app/`
> **What's new:** see [CHANGELOG.md](CHANGELOG.md)

---

## For the team (how to use it)

You don't need to install anything — just open the live link above.

1. **Add icons** — drag `.svg` files onto the page, click to browse, or paste SVG
   code in the sidebar. You can load a whole batch at once.
2. **Pick a view** — *Single* to focus on one icon, *Grid* to see the whole set
   change together.
3. **Adjust** using the tabs:
   - **Colors** — keep the original, set a solid fill/stroke color, or use
     `currentColor` so the icon inherits color from CSS (best for Elementor).
   - **Display** — scale, nudge, rotate, or flip.
   - **Stroke** — thicken/normalize the weight. For a line-icon pack with
     mismatched thicknesses, use **Normalize** to snap them all to one value.
4. **Rename** — click the filename (Single view) or double-click a grid label.
   Names auto-format to web-safe `kebab-case`.
5. **Export** — **Copy code** for pasting into markup, **Download** for one file,
   or **Download all as .zip** for the whole set (names are de-duplicated).

Everything runs in your browser. Nothing is uploaded anywhere.

### Tips for consistent icon sets

- Prefer sourcing a category as **all outline** or **all solid** from one pack —
  Iconry can unify stroke and color, but it can't make a solid glyph and an
  outline glyph the same "weight," since a solid icon has no stroke to adjust.
- Default to **`currentColor`** so a single icon works in light/dark and inherits
  brand color from the surrounding element.

---

## For developers (run locally)

Requires [Node.js](https://nodejs.org) 18+.

```bash
git clone git@github.com:jason-om/iconry-app.git
cd iconry-app
npm install
npm run dev        # http://localhost:5173
```

Build a static bundle:

```bash
npm run build      # outputs to dist/
npm run preview    # serve the built version to check it
```

---

## Deploying (maintainers)

This repo auto-deploys to **GitHub Pages** on every push to `main` via
`.github/workflows/deploy.yml`. One-time setup after the first push:

1. Repo **Settings -> Pages -> Build and deployment -> Source -> GitHub Actions**.
2. Wait for the **Actions** tab run to finish — the site publishes to
   `https://jason-om.github.io/iconry-app/`.

> **Note:** GitHub Pages requires a **public** repo on free plans (private repos
> need Pro/Team/Enterprise). If the deploy runs green but nothing publishes, check
> the repo's visibility.

Every later push to `main` redeploys automatically; you can also trigger a deploy
manually from the **Actions** tab.

---

## Project layout

| Path | What it is |
| --- | --- |
| `src/App.jsx` | The entire app — UI, SVG processing, and the dependency-free zip export |
| `src/main.jsx` | Mounts the app |
| `index.html` | Page shell |
| `vite.config.js` | Uses `base: "./"` so it works at the Pages subpath |
| `.github/workflows/deploy.yml` | Build + deploy to GitHub Pages |

## Notes & current limits

- Fonts (Space Grotesk, JetBrains Mono) load from Google Fonts at runtime.
- Settings and loaded icons live in memory for the session — a refresh clears them
  (no persistence yet).
- The `.zip` export stores files uncompressed. Fine for icons, and it keeps the
  exporter dependency-free.

## Roadmap

- **Phase 2 — Icon Library:** a browsable stock of team icons (Dentistry, Medical,
  General, Social, Users), each in Outline and Solid, served from a folder +
  manifest, with "open in Iconry" to tweak before export. _Confirm Flaticon
  licensing for agency/multi-site use before stocking packs._
