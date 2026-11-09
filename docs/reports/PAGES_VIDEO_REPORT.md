# GitHub Pages: loading video as a Release asset

Branch `feature/cosmic-experience`, on top of `94dd70a`. Local commit only: no push, merge, deploy or Release created.

## What was implemented
- **`scripts/media-manifest.json`:** fixes the release (`media-v1`), the asset name (`encounter-loading.mp4`), the target (`public/media/encounter-loading.mp4`), the size (9,137,638 bytes) and the SHA-256 (`4f7a3323835416e3989a6ec00fa9ae8bf8ee0fc9178ee1ff213de1307e639607`) of the original file.
- **`scripts/verify-media.mjs`** (`npm run media:verify`): checks name, exact size, MP4 signature and SHA-256. Exits 1 with a clear message on any difference. `--file` checks another copy (used on `dist/`).
- **`scripts/setup-media.mjs`:** now runs the same verification after the local byte-for-byte copy.
- **`.github/workflows/pages.yml`:**
  - downloads the pinned asset with `gh release download media-v1` (`GH_TOKEN: github.token`, existing `contents: read`), never `latest`;
  - verifies it and puts it in `public/media/` before the build;
  - after `build:pages`, checks that `dist/media/encounter-loading.mp4` is the same file;
  - a missing or different asset stops the job with an `::error` that says what to do. Nothing is deployed.
- **`docs/DEPLOY_PAGES.md`:** "Loading video" section with the upload steps.
- **Unchanged:**
  - the original video;
  - the app code (`src/` untouched in this step);
  - the engine, the questions, the results and the animations;
  - `check:safety` (the video stays in `public/media/`, which is ignored);
  - the browser fallback for playback failures and reduced motion.

## Tests and results
| Check | Result |
| --- | --- |
| `media:verify` on the original | passed |
| `verify-media`, wrong content / truncated / wrong name / missing | all four rejected, exit 1 |
| Workflow download step, simulated with a fake `gh` (real `gh` is not installed locally; it is preinstalled on `ubuntu-latest`) | correct asset: exit 0 · missing asset: clear `::error`, exit 1 · altered asset: clear `::error`, exit 1 |
| `build:pages` + verification of `dist/media/encounter-loading.mp4` | passed, identical bytes |
| URL and MIME (`preview:pages`) | `/rare-encounter/media/encounter-loading.mp4` → `200 video/mp4`, 9,137,638 bytes; range request → `206 Partial Content` |
| Playback on the Pages build (Chromium) | `data-video="playing"`, muted, 1280×720, `currentTime` advancing; loading completes in 7.9 s |
| Video blocked | static fallback (three card backs), results reached |
| Reduced motion | video not requested at all; static fallback |
| `tsc`, `eslint`, `check:vendor`, `check:safety` | passed |
| Vitest | 185/185 |
| E2E, full suite (3 projects) | 216 passed, **1 failed**, 68 skipped |

**The E2E failure.**
- **What failed:** `recovery.spec.ts › pause › summary, Escape continues…` on the mobile project hit the 30 s test timeout. That test normally takes 5 s.
- **Reruns:** 4 isolated reruns passed, at about 5 s each, and so did the whole `recovery.spec.ts` on mobile in suite order (20 passed).
- **Context:** no app code changed in this step, and the previous full run on the same `src/` passed 217/0.
- **How it is recorded:** an intermittent timeout, not fixed, with no timeout raised. The reruns do not turn that full run into a pass.
- **Not tested:** Firefox and WebKit (not installed). The real `gh` download runs for the first time in the workflow itself.

## Pending
1. **Create Release `media-v1`** and upload the asset. This is the owner's step (see "Next steps" below).
2. **How the workflow reaches this branch:**
   - It runs on a push to `feature/complete-experience`.
   - `main` has no copy of it, so the Actions "Run workflow" button (manual dispatch) is not available.
   - Deploying the Cosmic Experience needs one of these, with Or7's authorization:
     - merge `feature/cosmic-experience` into `feature/complete-experience` and push;
     - add this branch to the workflow's `push` trigger;
     - have the workflow on `main`.
   - The `github-pages` environment may also restrict which branches can deploy.
