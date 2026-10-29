# Approved Features Integration Report

Branch `integration/approved-features-v1`, created from local `main` at `c46fc67`. **Nothing was merged into `main`, pushed or deployed.**

## Stage 0: repository audit
| Reference in the brief | Verified state |
| --- | --- |
| `main` `c46fc67` (Phase 01B) | present, clean, unchanged |
| `feature/visual-polish-scrollbar` `f3aa407` | present, unchanged |
| `feature/visual-polish-lunar-slider` `0d81287` | present, unchanged (`73ac115` + logotype fix) |
| `phase/02-quiz-experience` `fdbb8bb` (CP01–CP03) | present, unchanged |

- **Working tree:** clean at the start. No stashes, and no remotes in use (nothing was fetched or pushed).
- **Overlaps between the three branches** (computed before merging):
  - scrollbar ∩ lunar: `tokens.css`;
  - (scrollbar ∪ lunar) ∩ CP03: `Button.css`, `SiteLayout.tsx`, `SiteNav.tsx`, the three i18n files, `Hero.tsx` and `tokens.css`.
- **The companion pack** (`rare_encounter_claude_companion_pack.zip`) holds planning only:
  - a manifest;
  - the 60 pilot candidates;
  - the editorial and coverage contract;
  - a checklist of missing files.
- **Missing from both the repository and the pack:**
  - the 300-question drafts (`rare_encounter_300_perguntas_rascunho.json`, `…_leitura.md`);
  - `rare_encounter_cobertura_especies.md`;
  - the 12 pilot questions and their 48 Layered Traits;
  - the Holo Card references.

## Integration history (one feature at a time, `--no-ff`, three-way)
| Step | Commit | Conflicts | Resolution |
| --- | --- | --- | --- |
| CI-01 Scrollbar | `b393b82` | none | — |
| CI-02 Lunar Slider + light mode + logotype | `832cc15` | `tokens.css`: both branches only added tokens to the same block | Both kept (`--accent-hover` and the three scrollbar tokens). The track comment now says it follows light and dark mode. |
| CI-03 Quiz CP01–CP03 | `d9e4977` | `SiteLayout.tsx`, `SiteNav.tsx`, `Hero.tsx`, `tokens.css` | See below |

**CI-03 resolutions** (approved behaviour from both sides, nothing dropped):
- **`SiteLayout` / `SiteNav`:** kept CP03's `brandHref` and the nav without section links on `/encounter`, plus the light-surface logotype tone (`logoTone`) from CI-02.
- **`Hero`:** kept CP03's `after` slot (the resume banner in the page flow, below the CTA) plus the light-mode props for GhostFibers (`lightMode`) and StarBorder (`theme`).
- **`tokens.css`:** CP03 had added `--color-danger` to the old dark block, which CI-02 had reorganized into the per-mode blocks. It's now set in each mode:
  - **dark** `#ff8f9a`, unchanged;
  - **light** `#b4232f`: about 5.6:1 as text on the light background, and 6.5:1 under white text on the button.
  - **New `--on-danger` token:** the "Start over" confirmation used a fixed near-black text that becomes unreadable on the light red. Its hover now follows `--accent-hover-toward` instead of always mixing toward white.

**The CP03 320 px fix** (`Begin.css`, the Star Border light passing the screen edge) is in the integrated build. The width sweeps at 320 px report no horizontal scroll.

## Checks after each integration
| After | Typecheck | Lint | Vitest | Playwright (full suite, desktop / tablet / mobile) |
| --- | --- | --- | --- | --- |
| CI-01 | ✅ | ✅ | 48/48 | not run on its own (CI-02 followed immediately; covered by the run below) |
| CI-02 | ✅ | ✅ | 51/51 | **92 passed, 0 failed, 31 skipped** |
| CI-03 | ✅ | ✅ | 94/94 | **202 passed, 1 failed, 64 skipped** |

**The CI-03 failure:** `landing.spec.ts:129`, reduced-motion hero, mobile.
- Its assertions passed. The failure came from `page.screenshot`: "Unable to capture screenshot", the known instability of software-rendered WebGL (GhostFibers) in headless Chromium.
- A preview server I had left running on another port was adding CPU load during that run. It was stopped.
- Rerun alone, the test passed 3/3. **Per the brief, that rerun does not turn the suite run into a pass:** it is recorded as **flaky**.
- No timeout was raised and no test was skipped.

**Scrollbar across the 12 combinations.** The pixels were sampled with scrollbars made visible (headless Chromium hides them by default). Evidence: `approved-features-integration/scrollbar/`, plus `scrollbar-matrix.txt` with every value.
- **The thumb follows each palette's accents in both modes,** in a fixed 10 px gutter.
- **Thumb-to-track contrast** (UI-component threshold 3:1):
  - dark: 6.97–13.83:1;
  - light: 3.41–4.76:1. The lowest are Amethyst at the bottom of the gradient (3.41) and Sakura (3.45).
- Touch devices keep the native indicator.

## Light mode on the CP03 screens
Captured in light and dark mode. Evidence: `approved-features-integration/quiz-light-dark/`.
- **Preparation with the original Border Glow:** all six palettes, desktop. BorderGlow gets the light surface through `useThemeColors`, and the original file wasn't touched.
- **The questions with image answers:** the cards, the caption and the mark adapt to light.
- **Pause, and the "Start over" confirmation:** the danger red is readable in both modes (values above).
- **The resume banner:** stays in the page flow under the hero, desktop and mobile, with no horizontal scroll.
- **Liquid Flow:** already uses `--color-bg` and the accent, so it follows the mode.

**Found and not changed (copy):** "This deletes your **1 answers**…". The CP03 string has no plural form, and the i18n layer has no plural support. Fixing it is a copy and i18n change, so it's left for approval.

## Regressions
None detected in the approved landing, nav, settings, themes, Lunar Slider, logotype or quiz flows, beyond the flaky capture above. The final run on the finished branch is in `RARE_ENCOUNTER_IMPLEMENTATION_STATUS.md`.

## Process note
While isolating the merge state, a `git stash` with a path filter also took the merge's staged files for those paths. It was caught immediately and fully restored:
- the index was put back from the stash's index commit;
- the working tree was put back from the stash itself;
- the index was confirmed byte-identical to the merge resolution before committing.

No work was lost, and no branch was touched.
