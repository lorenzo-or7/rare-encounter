# Rare Encounter: Complete Experience Report

Branch `feature/complete-experience`, created from `integration/approved-features-v1` (`551d41c`). Not merged, not pushed, not deployed.

## The flow that now works
1. The person opens the landing and chooses one of the three journeys.
2. They answer real, unique questions:
   - the journeys hold 30, 60 or 90 questions, drawn from a 300-question bank in three languages;
   - the session can be paused, resumed, edited and restarted.
3. Three different Pokémon appear: Soul Match, Hidden Match and Alternative Match. Each one has:
   - its artwork, name and Pokédex number;
   - an explanation drawn from the recorded evidence.

The result is stored, so a reload shows it again. Sessions from the old preview bank go to assisted recovery and are never mapped silently onto the new questions.

## Question bank (`src/content/questions/`)
- **300 questions, four options each**, in pt-BR (the reference), en-US and es.

| Category | Total | Fundamental | Adaptive |
| --- | --- | --- | --- |
| Personality | 75 | 52 | 23 |
| Aesthetics | 60 | 42 | 18 |
| Values | 60 | 42 | 18 |
| Environments | 45 | 32 | 13 |
| Behavior | 30 | 21 | 9 |
| Instinct | 30 | 21 | 9 |

- **Formats:**
  - 290 text questions;
  - 6 icon + text questions;
  - 2 image questions, which reuse the project's own scene illustrations. The final Hybrid Naturalism art is still pending.
- **Editorial status:** `candidate`, written for this version. The original 12 pilot questions and the 48 Layered Traits were not in the repository, so nothing claims to restore them.
- **Trait mapping:**
  - every option has one primary trait in its own category;
  - **no secondary traits were used:** the helper supports them, but none was clearly justified;
  - two semantic groups keep near-twin questions out of the same journey.
- **Automatic checks** (`bank.test.ts`):
  - exactly 300 questions and the approved totals;
  - unique ids;
  - complete translations with no repeated text;
  - valid, registered traits, each used at least 20 times;
  - format contracts for image and icon questions;
  - a near-duplicate screen.
    - On its first run it flagged 3 pairs: 2 were rewritten, and 1 (`pe-055`/`be-001`) was reviewed as a false positive and recorded.
    - This screen does not replace editorial review.
- **Journeys:**
  - the approved quotas apply per category, with an adaptive share of about 30% (9, 18 and 27 questions);
  - there are no repeats, and two questions of the same group never appear together;
  - the selection is seeded by the session id, so it differs per session and is stable on resume;
  - adaptive picks follow the answers given so far, in the forward path too (this was missing and was fixed);
  - edits keep the reconcile contract.
- **Spelling:** the English copy was normalized to en-US.

## Trait registry (`src/content/traits.ts`)
- **34 candidate traits:**

| Category | Traits |
| --- | --- |
| Personality | 6 |
| Aesthetics | 6 |
| Values | 6 |
| Environments | 6 |
| Behavior | 5 |
| Instinct | 5 |

- **Each trait has:**
  - a stable id;
  - a name and definition in all three languages;
  - an evidence boundary (what it must never be used to claim);
  - relations: 3 opposing pairs and 3 overlapping pairs.
- **The "48 ambiguity":** this set is neither the blueprint's 48 attributes per species nor the 48 Layered Traits of the pilot questions. It is the documented vocabulary of this version.

## Pokédex (`scripts/pokedex/`, `src/content/pokedex/pokedex.v1.json`)
- **Source:** PokéAPI, retrieved on 2026-11-06.
  - The import is reproducible: a local cache in `.cache/`, outside Git, then derivation.
  - No network call happens while matching.
- **Species:** 1,025 (PokéAPI's own count). The count per generation matches the official National Pokédex.
- **Forms:** 554 form records, kept as context only, never as candidates (Species First, Forms Aware).
- **Data on every species:** artwork reference, genus, types, colour, shape, habitat (where it exists), evolution chain and stage.
- **Traits are automatic candidates, never marked reviewed:**
  - **Kinds of evidence:**
    - keywords in the Pokédex entries (counted as the share of entries that mention them);
    - habitat;
    - base Speed;
    - colour and shape, for aesthetics only;
    - type, as a weak signal only.
  - **Limits:** at most 2 traits per category and 10 in total.
  - **Not stored:** the texts of the entries. Only the keywords and counts are kept.
  - **Usable profiles:** 821 species have at least 3 traits.
  - **Thin or empty profiles:** 204 have fewer than 3, and 11 have none.
- **Images:** the official artwork comes from PokéAPI's repository on GitHub. It loads only on the results screen, with a fallback to the Pokédex number. **Using it requires the planned rights review before any public launch.**

## Matching engine v1 (`src/matching/engine.ts`, `params.ts`)
- **Origin:** the ME-03 core, promoted. It was not rewritten; the changes are listed below.
- **Signals:** answers are read as preferences against the options offered.
- **Score:**
  - each trait counts as `0.5 + 0.5 × preference × intensity`;
  - categories are weighted with the approved weights;
  - uncertainty is applied once, through coverage;
  - a trait with no evidence is unknown, never incompatible.
- **Gate:** counts the person's clear leanings that the species has evidence for.
- **Equivalence band:** relative to the leader's lift.
- **Tie-break:**
  1. reliability;
  2. independent sources;
  3. consistency;
  4. a neutral hash of the answers and the species id.

  There is no popularity, rarity or Pokédex-order bias.
- **Determinism:** the same answers and the same data versions always give the same result.
- **Calibration:** chosen by simulation on separate data, with the procedure and the measured effects in `MATCHING_CALIBRATION_REPORT.md`.
  - **Values:** band 0.05, gate 3/4.
  - **Validation:** 600/600 complete, distinct trios; about 150 different Soul Matches per 200 journeys; no species above 2.5%.
- **"Why this Pokémon?" (`src/features/results/explain.ts`):**
  - the person's leanings come from the trait copy;
  - each reason cites real evidence (for example "comes up in 2 of the 4 Pokédex entries");
  - wording is more cautious when a species has little recorded;
  - there are no percentages.

## Results Experience (`src/features/results/`)
- **Soul Match:**
  - Hybrid Reveal: the art arrives first, then the frame and the name;
  - Holo Card: Ethereal Frame, a restrained foil that follows the pointer, a moderate tilt, and an accessible flip;
  - Celestial Threads on the back, using a **provisional geometric emblem** (`CelestialEmblem.tsx`, `data-provisional="emblem"`) that copies no official symbol;
  - Editorial Split explanation.
- **Hidden Match:** Chromatic Veil, with the light masked to the silhouette. It opens by click, tap or keyboard and stays open (also after a reload).
- **Alternative Match:** Connection Panel.
- **Typography:** species names in DM Serif Display.
- **Other:**
  - six palettes, two modes and three languages;
  - reduced motion: no tilt or sweep, and the flip simply swaps the faces;
  - "Start a new encounter" and "Back to the start" buttons;
  - a line saying that questions and profiles are a candidate version.
- **Sharing (9:16, 1:1):** not offered, because the approved templates and phrases don't exist (and there is no fake button).

## Quiz integration
1. The last answer is saved.
2. `ResultsPhase` validates the session.
3. The catalog and the engine load lazily.
4. The three matches are computed.
5. `completeSession` stores the completed session and the result in one IndexedDB transaction.
6. The results screen opens.

- **On failure:** nothing is deleted or restarted, the person sees a message with "Try again", and the details go to the console.
- **On reload:** the stored result is shown again.
- **Preview-bank sessions:** they go to the existing assisted recovery.

## Coverage audit (`npm run audit:coverage`, `docs/reports/matching-audit/coverage.json`)
**Method:**
- 400 random valid journeys per length;
- then a targeted walk for each species not yet reached (2 sessions each);
- every witness replayed independently through the real source and the full engine.

| | 30 | 60 | 90 |
| --- | --- | --- | --- |
| Reached as Soul Match | 507 | 548 | 540 |
| …through random journeys / targeted | 244 / 263 | 257 / 291 | 254 / 286 |
| Proven unreachable (fewer than 3 traits with evidence) | 204 | 204 | 204 |
| Not yet found (not a claim of impossibility) | 314 | 273 | 281 |

- **Reached in at least one journey:** 617 of 1,025 species.
- **Replay failures:** 0.
- **Concentration:** the most frequent species in random journeys appears 6–7 times in 400.

**Not covered:**
- full-Pokédex reachability (the long-term goal);
- the 204 species with thin evidence, which need editorial profiles to compete.

## Engineering checks
See the final summary in the session report for the QA results (typecheck, lint, build, unit, E2E, browsers).
