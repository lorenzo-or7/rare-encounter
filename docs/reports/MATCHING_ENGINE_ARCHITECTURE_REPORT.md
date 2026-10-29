# Matching Engine Architecture Report (ME-01, ME-03)

Branch `integration/approved-features-v1`. Status: **structural foundation implemented and tested; production scoring not implemented; the experimental engine is isolated and never used by the app.**

## What exists and what it rests on
The architecture is the approved Architecture Freeze v1 (Conditional). The repository holds **no approved trait vocabulary, no question bank with trait effects and no reviewed species profile.**
- The prompt mentions 12 pilot questions and their 48 Layered Traits, but they are not in the repository or in the companion pack. The pack's README confirms this.
- The 300-question drafts (`rare_encounter_300_perguntas_*`) and `rare_encounter_cobertura_especies.md` are absent.

So everything below is a set of contracts, validators and isolated research code, tested on fixtures that are clearly labelled **synthetic**.

## Modules (`src/matching/`, React-independent)
| Module | Contents |
| --- | --- |
| `versions.ts` | `VersionStamp` (question bank, trait registry, species profiles, engine), carried by every output and witness. |
| `registry.ts` | The **Trait Registry** schema (below). `validateTraitRegistry` checks stable namespaced ids, the dimension prefix, relation targets, mirrored oppositions, completeness of approved traits and duplicate signals. `checkQuestionsAgainstRegistry` checks that every answer effect names a registered trait in [-1, 1] and that every declared signal has a matching effect. `EMPTY_REGISTRY` (`registry-0`) is the shipped registry: a contract with no vocabulary. |
| `profile.ts` | The **Species Profile** schema (below) and `validateDataset`. |
| `dataset.ts` | `loadProfileDataset(unknown)`: loads untrusted JSON field by field, rebuilds the result from known fields only and evaluates nothing. Errors report the first bad path. |
| `data/` | The pilot candidates, the canonical snapshot and the Draft pilot dataset (see the pilot report). |
| `experimental/` | The ME-03 research engine and its uncalibrated parameters. |
| `audit/` | The ME-04 coverage audit (see the coverage report). |
| `fixtures/synthetic.ts` | The synthetic test registry, question source and profiles. These are neither content nor a vocabulary proposal. |

**Dimensions.** The six approved categories, using the ids already in the code (`personality`, `aesthetics`, `values`, `environments`, `behavior`, `instinct`). "Environment" in the prompt is the existing `environments`; it was not renamed.

**Trait record.** Each record has:
- a stable id (`<dimension>.<name>`) and its dimension;
- a localized label and definition;
- primary and secondary signals (question/answer pairs);
- relations: `overlaps`, `opposes` or `refines`;
- an evidence boundary (what the trait must never be used to claim);
- ambiguities, the registry version it was introduced in, and an editorial status.

**Species profile.** Each profile has:
- the species slug and its National Pokédex number;
- a profile version and an editorial state (Draft, Evidence Reviewed, Pilot Approved, Recalibration Required);
- evidence of three kinds that are kept apart: `canonical-fact`, `direct-observation` and `editorial-interpretation`;
- trait mappings: a signed affinity, the cited evidence and a support level;
- evidence boundaries, form contexts and a review record.

**Integrity rules enforced by `validateDataset`:**
- One candidate per species and per Pokédex number.
- Every piece of evidence has a known source.
- An interpretation must rest on facts or observations, never on nothing or on another interpretation.
- A mapping needs evidence and an affinity in [-1, 1].
- **A species-level mapping cannot rest only on form-specific evidence** (Species First, Forms Aware).
- Pilot Approved requires a recorded review and at least one mapping.
- An absent mapping means *unknown*. Nothing in the schema can express "incompatible because undocumented".

**Existing domain kept.** `src/domain` (`TraitVector`, `TRAIT_COUNT = 48`, `results.ts`) was not changed. The blueprint describes "48 editorial attributes per species", while the prompt describes "48 Layered Traits for 12 pilot questions". The two are not obviously the same thing, and the source material isn't available to settle it. **This is an open decision** (see the status report).

## Experimental core (ME-03)
`src/matching/experimental/engine.ts`, with `params.ts` (`calibrated: false`; every output carries `experimental: true`).

| Approved component | How it is built |
| --- | --- |
| Evidence-Aware Hybrid | Affinity: weighted mean closeness, `1 − |person − species| / 2`, over traits both sides have, normalized per dimension with the approved category weights. Coverage: the weighted share of the person's observed traits the species has evidence for. **Uncertainty is applied once:** `score = coverage × affinity + (1 − coverage) × 0.5`. Reliability and source diversity are never added to the score, so there is no double penalty and no repeated bonus. |
| Missing evidence ≠ incompatibility | Unmapped traits are left out of affinity; they only lower coverage. |
| Adaptive Confidence Gate | Well / partially supported / insufficient evidence, from coverage. An internal evidence label, never shown as a psychological category. A species with little evidence is still **ranked**, but cannot take a role. |
| Evidence Equivalence Band | Scores within `equivalenceBand` of a group's leader count as equivalent. |
| Evidence-Based Tie Break | Inside a band, in order: mapping reliability, independent source count, consistency (spread of closeness), then a **neutral key**, a hash of the answer fingerprint and the species id. Stable on refresh, independent of answer order, with no Pokédex-order, name-order or popularity bias. The deciding criterion is recorded. |
| Soul Match | The first species in the ranking that passes the gate. |
| Hidden Match | Re-ranked on the person's **non-dominant observed** signals only (the strongest third is set aside). Never justified by traits that were not observed. |
| Alternative Match | The next eligible species whose top drivers overlap the Soul Match's by at most `alternativeMaxOverlap` (Jaccard). If none qualifies, the next eligible species is used and marked `differentiation: weak`. |
| Shared rules | Three distinct species. Deterministic output, checked byte for byte. Every driver lists the evidence ids behind it. No percentages and no generated text. |

**Isolation.** A unit test scans every non-test source file outside `src/matching/` and fails if any imports `matching/experimental` or `matching/audit`. Today none does. The quiz and the landing are untouched by the engine.

## Parameters (uncalibrated)
`equivalenceBand 0.02`, gate `0.6 / 0.25`, `dominantShare 1/3`, `alternativeMaxOverlap 0.5`, `driverCount 3`. **None of these values is approved or measured.** They exist so the components can be tested, and calibration has to replace them using real profiles and a calibration/holdout split (`splitCalibrationHoldout` is in the audit module).

## Stop condition (applied)
With the shipped empty registry, answers carry no signal, and the engine returns no match with the note "no trait signal in the answers". With the Draft pilot (no mappings), every species is `insufficient-evidence` and the engine returns no match ("no species has enough evidence for the observed signal"). **The engine is not connected to the quiz or to any result screen. ME-05 was not executed.**

## Tests
`src/matching/foundation.test.ts`, `src/matching/experimental/engine.test.ts`, `src/matching/audit/coverage.test.ts`: **33 tests, all passing.** They cover:
- registry and profile validation;
- loading untrusted JSON;
- the pilot dataset's integrity;
- isolation from the app;
- signals, coverage vs. affinity and the gate;
- the band and the tie break (including exact twins);
- the three roles, determinism, the Hidden Match's use of non-dominant traits;
- behaviour with the Draft pilot and with the empty registry.

Two test expectations of mine were wrong during development and were corrected after investigation, not by loosening the code:
- **An exact tie:** with "a" on every answer, `fixture-mixed` equals `fixture-north` on the observed traits, so the neutral key correctly decides between them.
- **A claim of impossibility:** a sparse profile I had assumed could never be reached was reached by the targeted search. That's exactly why "Not Yet Found" is never treated as "unreachable".

## Technical limits
- Ranking scores every profile on every call. That's fine for the pilot (60), but the full catalog should run the audit outside the browser, as the brief allows.
- The targeted search is greedy, so it can miss witnesses that exist.
- Closeness is linear. Whether signed affinities are the right scale for the approved vocabulary depends on the editorial definitions.
