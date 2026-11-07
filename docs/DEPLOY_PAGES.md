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
- **Loading video:** 9.1 MB, too large for the repository (`check:safety` keeps files over 5 MB and video out of Git). It is published as an asset of the GitHub Release `media-v1` and downloaded by the workflow (see "Loading video" below).
- **What Git never holds:** `.cache/`, `public/fonts/`, `public/media/`, `dist/`, `.claude/` and `*.log` stay out.

## The workflow (`.github/workflows/pages.yml`)
1. `npm ci`.
2. Download Clash Display.
3. Download the loading video from Release `media-v1` (GitHub CLI, `GH_TOKEN`, `contents: read`) and verify its name, size and SHA-256 against `scripts/media-manifest.json`. **If it is missing or different, the job stops and nothing is deployed.**
4. Typecheck, lint, unit tests and React Bits integrity.
5. `build:pages`, then check the video is in `dist/media/`, byte for byte.
6. Publish `dist/` to Pages.

It runs on every push to `feature/complete-experience`, or by hand: Actions → "Deploy preview to GitHub Pages" → Run workflow.

## Loading video (Release asset)
- **Pinned:** the tag (`media-v1`), the asset name (`encounter-loading.mp4`), the size (9,137,638 bytes) and the SHA-256 (`4f7a3323…e639607`) are in `scripts/media-manifest.json`. The workflow never uses "latest".
- **Same file everywhere:** locally, `npm run media:setup` copies the original into `public/media/encounter-loading.mp4`, and `npm run media:verify` checks it against the manifest. The asset uploaded to the Release must be exactly that file, never re-encoded.
- **Upload it once** (owner only), in the GitHub interface:
  1. https://github.com/lorenzo-or7/rare-encounter/releases/new
  2. Tag: `media-v1` (create new tag on publish, target the branch being deployed). Title: `media-v1 — loading video`.
  3. Attach `public/media/encounter-loading.mp4` from your local copy (after `npm run media:setup`). The asset must be named exactly `encounter-loading.mp4`.
  4. Do not mark it as a pre-release or draft: the workflow downloads only published releases. Publish.
- **Replacing the video later:** upload it as a new release (`media-v2`) and update `release`, `bytes` and `sha256` in the manifest in the same commit. Never replace the asset of an existing tag.
- **In the browser:** the static fallback stays for playback failures and for reduced motion (the video is not even requested then).

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
