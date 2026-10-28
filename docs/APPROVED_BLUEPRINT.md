# Rare Encounter — approved product blueprint

## Goal
A premium Pokémon personality / aesthetics discovery with 30/60/90-question modes and fair species-wide candidate eligibility. Every eligible species should have a demonstrated valid pathway to Soul Match in each mode before launch; this remains a HARD TARGET, not verified or mathematically assumed.

## Content & matching
6 scoring categories: Personality 25%; Aesthetics/Colors 20%; Values/Emotions 20%; Environments/Elements 15%; Behavior/Energy 10%; Instinct/Choices 10%.
Mode category quotas ordered as above:
30 = 8/6/6/4/3/3.
60 = 15/12/12/9/6/6.
90 = 23/18/18/13/9/9.
Fundamental/adaptive mix: 21/9; 42/18; 63/27 respectively, without repeats; preserve quotas and adaptive validity.
300 questions bank, proposed distribution 75/60/60/45/30/30, all pt-BR/en/es with stable IDs and versioning.
48 editorial attributes per eligible Pokémon with individual evolutionary stages and branched evolutions. Exact 48-trait taxonomy remains unapproved; no made-up traits to force winners. Alternate forms cataloged but not independent species candidates in initial release.
Versioned local catalog; PokéAPI factual data / TCGdex possible art source. Verify media rights before publication.
Compare all species with normalized weighted scores, no popularity/rarity/id bonus. Stable fair tie-breaking on unrounded values then neutral deterministic criteria; audit bias. Distinct Soul Match, Hidden Match, Alternative Match; explainable affinity (not probability).
Universal reachability validation requires full valid adaptive answer witnesses for each species/mode, not random simulation or unsupported certainty. Failure blocks launch.

## UX and persistence
No mandatory account, online-first with local progress survival. localStorage preferences; IndexedDB sessions/answers/adaptive selection/result. Hybrid recovery with validated migration or assisted restart; never silently delete or silently recompute older results. Save each answer before advancing. Back/edit, pause/resume/start over with confirmation; returning-user context banner prioritizes unfinished session, then last result. Only last completed result retained, until replacement on next completion.
Three languages; explicit saved preference > browser > en; change language mid-quiz without altering answer IDs.
Accessible, fully responsive, reduced motion.

## Repository and execution
React/TypeScript/Vite. Public GitHub; All Rights Reserved applies to original code (does not include third-party Pokémon rights). Main approved baseline and phase/00...06 branches. Reports hybrid (summary + technical verification). Continuous Vitest/Playwright testing, screenshot evidence. Every phase stops for explicit Or7 approval; never automatically merge or deploy. Hosting undecided.

## Phases
00 foundation; 01 visual/landing; 02 quiz UX; 03 catalog/profiles; 04 question bank/engine/coverage; 05 results/share; 06 full QA/release.

## Status
Only planning and approved reference imagery exists; implementation/test coverage is not established. Image motion-video experiment REJECTED: do not add it.
