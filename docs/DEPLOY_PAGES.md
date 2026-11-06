# Preview on GitHub Pages

Address: **https://lorenzo-or7.github.io/rare-encounter/**

## How it is built
- **`npm run build:pages`:** builds with `vite build --base=/rare-encounter/`, then copies `dist/index.html` to `dist/404.html`.
  - Pages serves `404.html` for any path that isn't a file. That's how `/rare-encounter/encounter` opens the app on a direct link or a reload, with an HTTP 404 status that the browser logs and the app ignores.
- **Local development and tests:** they stay at `/` (`npm run dev`, `npm run build`, `npm run test:e2e`).
  - The router translates app paths (`/`, `/encounter`) to and from the real URL with `import.meta.env.BASE_URL` (`src/app/routing.ts`).
- **Clash Display:** licensed (ITF FFL v2.0).
  - The workflow downloads it from Fontshare at build time (`npm run fonts:setup`).
  - It's served only by the site itself (self-hosting, allowed by section 01) and **never** goes into Git, since publishing it through a repository is forbidden by section 02.
- **What Git never holds:** `.cache/`, `public/fonts/`, `dist/`, `.claude/` and `*.log` stay out.

## The workflow (`.github/workflows/pages.yml`)
1. `npm ci`.
2. Download Clash Display.
3. Typecheck, lint, unit tests and React Bits integrity.
4. `build:pages`.
5. Publish `dist/` to Pages.

It runs on every push to `feature/complete-experience`, or by hand: Actions → "Deploy preview to GitHub Pages" → Run workflow.

## One-time setting
Settings → Pages → Build and deployment → Source: **GitHub Actions**.

## Checking a Pages build locally
```bash
npm run build:pages
npm run preview:pages
```
Then open http://localhost:4174/rare-encounter/. `vite preview` answers deep links on its own, so testing the 404 fallback needs a server that behaves like Pages.

## Notes
- Pokémon artwork is loaded from PokéAPI's GitHub repository. The rights review is still required before any public launch.
- The page has `noindex`: the preview is not meant for search engines.
