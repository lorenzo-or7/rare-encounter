# Rare Encounter: Implementation Status

Branch `integration/approved-features-v1`, from `main` `c46fc67`. **Not merged into `main`, not pushed, not deployed.** Waiting for Or7 review.

## Checkpoint matrix
| Checkpoint | Status | Notes |
| --- | --- | --- |
| Stage 0: repository audit | **Completed and verified** | All four reported commits exist and are unchanged. Missing editorial files are listed below. |
| CI-01 Slim Chromatic Scrollbar | **Completed and verified** (Chromium) | Merged without conflicts. 12 combinations measured from pixels. Safari and Firefox not tested. |
| CI-02 Lunar Slider + light mode + logotype | **Completed and verified** (Chromium) | One `tokens.css` conflict, both sides kept. Full suite: 92 passed, 0 failed. |
| CI-03 Quiz CP01–CP03 | **Completed and verified, with one flaky test** | 4 conflicts resolved. `--color-danger` is now per mode, plus `--on-danger`. Light mode reviewed on the CP03 screens. The suite after the merge had one failed screenshot capture (environment), which passed 3/3 on its own and is recorded as flaky. |
| AV-01 Visual Answer Art System | **Implemented and verified as a system; blocked for content** | Ratio, comparison, 2×2 at every width, caption, skeleton, fallback, reduced motion. The real images for the bank don't exist. |
| ME-01 Matching data foundation | **Completed and verified (structure)** | Registry, profile schema, validation, loader, versions, provenance, fixtures. **The registry has no vocabulary:** the 48 Layered Traits are missing. |
| ME-02 Editorial pilot | **Partially implemented** | 60 IDs verified (PokéAPI), 60 Draft profiles with sourced canonical facts only. **0 of 60 editorially approved**, 0 interpretations, 0 mappings. |
| ME-03 Matching core | **Implemented, experimental and isolated; not for production** | Every approved component is built and tested on synthetic data. Parameters uncalibrated. A test enforces that the app never imports it. |
| ME-04 Calibration & coverage audit | **Framework implemented and verified on synthetic data; real coverage not measurable** | Real pilot: 0 candidates, 0 witnesses. |
| RE-01 Results Experience | **Partially implemented (contracts only)** | Share formats and an answer-proof payload, plus the card's motion model. **No visual component**, because the art, the emblem, the phrases and the result data are missing. |
| ME-05 Engine → quiz → results | **Not started (blocked by design)** | Its prerequisites are missing. Not executed, per the brief. |
| First Encounter | **Not started (pending owner decision)** | Approved copy preserved; the visual direction is not approved. |

## Pending Or7 decisions and missing material
1. **The question bank and trait vocabulary.** These files are missing:
   - `rare_encounter_300_perguntas_rascunho.json` and `…_leitura.md`;
   - the 12 pilot questions with their 48 Layered Traits;
   - `rare_encounter_cobertura_especies.md`.

   Also needs a decision: the blueprint says "48 editorial attributes per species", and the brief says "48 Layered Traits for 12 pilot questions". Which one is the trait taxonomy?
2. **Editorial review of the pilot:** reviewers, official sources per species, interpretations, mappings and approvals.
3. **Calibration:** the band, the gate thresholds, the hidden-match dominance share and the alternative's overlap.
   - Plus one explicit policy question: should a thinly documented species be able to win through a targeted journey? The audit shows it can.
4. **Results Experience assets and copy:**
   - official artwork after rights review;
   - the original celestial emblem for the card back;
   - the approved share templates and editorial phrases (both registries ship empty);
   - the route or entry point for results within the existing navigation.
5. **The First Encounter's visual direction.**
6. **The "1 answers" plural** in the CP03 restart message (copy and i18n change).
7. **The image assets for image questions** under Hybrid Naturalism, with Pokémon/TCG rights review where relevant.

## Final checks on the finished branch
| Check | Result |
| --- | --- |
| Typecheck, lint | ✅ |
| Vitest | ✅ **142/142** (20 files) |
| Production build | ✅ JS 433.4 kB (139.5 kB gzip), against `main`'s 137.66 kB gzip |
| Vendor integrity | ✅ 10 React Bits originals unchanged |
| Safety scan | ✅ 516 files |
| Playwright, full suite (desktop, tablet = iPad Mini on Chromium, mobile = Pixel 7) | ✅ **207 passed, 0 failed, 0 flaky, 66 skipped** |

**The 66 skips** are per-project scoping that existed before:
- desktop-only nav, keyboard and pointer paths;
- phone-only width sweeps;
- top-bar checks on tablet and phone only.

The one added is the AV-01 width sweep, which runs on the phone project only.

**Earlier in the session:** the full suite after the CI-03 merge had one flaky screenshot capture (see the integration report). It didn't recur in this run.

**Not executed:**
- Safari and Firefox: not installed, so nothing is claimed for them.
- 1024 px as a separate viewport.
- The matching audit against real data: none exists.

## Commits (`main..integration/approved-features-v1`)
| Commit | Content |
| --- | --- |
| `b393b82` | merge CI-01 scrollbar |
| `832cc15` | merge CI-02 Lunar Slider, light mode, logotype |
| `d9e4977` | merge CI-03 quiz CP01–CP03 |
| `dfce685` | AV-01 Visual Answer Art System |
| `98382b9` | ME-01..ME-04 matching foundation, pilot, experimental engine, audit |
| `3e940ed` | RE-01 results contracts |
| (this commit) | reports |

Branches confirmed unchanged:
- `main` `c46fc67`;
- `feature/visual-polish-scrollbar` `f3aa407`;
- `feature/visual-polish-lunar-slider` `0d81287`;
- `phase/02-quiz-experience` `fdbb8bb`.

## Reports
`APPROVED_FEATURES_INTEGRATION_REPORT.md`, `APPROVED_VISUAL_SYSTEM_REPORT.md`, `MATCHING_ENGINE_ARCHITECTURE_REPORT.md`, `MATCHING_EDITORIAL_PILOT_REPORT.md`, `MATCHING_COVERAGE_REPORT.md`, all in `docs/reports/`.
