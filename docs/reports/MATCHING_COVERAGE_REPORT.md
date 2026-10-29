# Matching Coverage Report (ME-04)

Branch `integration/approved-features-v1`. Status: **audit framework implemented and tested on synthetic data. Real coverage measured: none possible. Real Soul Match witnesses: 0.**

## Measured coverage (real data)
| Indicator | Pilot (60 species) | Full catalog |
| --- | --- | --- |
| Catalog coverage | 60 identities verified (PokéAPI snapshot) | not measured: no catalog dataset in the repository |
| Profile coverage | 60 Draft profiles, canonical facts only | 0 |
| Candidate inclusion (profiles with at least one trait mapping) | **0** | 0 |
| Reachability | **0 Reached; 180 of 180 species × journey pairs Proven Unreachable**, for one reason: no profile has a mapping, so its coverage is always 0 and the gate never admits it | not measured |

That is the honest state: a real reachability witness needs four things this repository doesn't have:
1. the approved question bank with trait effects;
2. the approved trait registry;
3. reviewed profiles with mappings;
4. a calibrated engine.

**The long-term goal (a Soul Match witness for every eligible species) is not met, and implementing the audit does not change that.** The pilot run used the synthetic question source; that's enough to show the zero-candidate result, and it says nothing about real journeys.

## What the framework does (`src/matching/audit/`)
- **Valid journeys** (`journey.ts`): a journey goes through the question source exactly as the quiz does.
  - Questions come in the source's order. After every answer, the source's own `reconcile` decides what follows (its adaptive picks).
  - The reconcile contract is enforced at each step: same length, no repeats, answered questions unchanged.
  - An answer that isn't an option is rejected, so a journey cannot bypass selection rules.
- **Random valid journeys** with a seeded PRNG (mulberry32): each journey can be replayed from its seed.
- **Targeted search** for species that random journeys didn't reach. It's greedy: at each question it picks the answer that most improves the target's margin over the best other species. Failing to find a journey proves nothing.
- **Witnesses** record:
  - the species and the journey duration;
  - the method, and the seed for random journeys;
  - the exact question sequence and answers;
  - the versions of the bank, registry, profiles and engine;
  - the three matches, the top five of the ranking with their gate states, and the tie-break reason when one decided.
- **Independent replay** (`replayWitness`): it rebuilds the journey from the source and re-runs the engine. A witness made with other versions is reported **stale**, never silently reused.
- **The three statuses:**
  - *Reached:* a witness exists.
  - *Not Yet Found:* no witness yet. This is never read as impossibility.
  - *Proven Unreachable:* only with a proof. The one proof implemented: a profile without mappings always has coverage 0, so the gate never admits it.
- **Determinism:** the same answers are re-run and compared byte for byte.
- **Forms fairness:** candidates are counted per species, and form records are counted separately and never become candidates.
- **Similarity stress:** reports profile pairs with identical mappings, which only the neutral key can separate.
- **Calibration and holdout split** (`splitCalibrationHoldout`): deterministic and disjoint, so tuning never sees the holdout species.

## Demonstration on synthetic data
These numbers come from a fixture, not real species. Setup:
- 7 synthetic profiles (`fixture-*`), the synthetic question source with one adaptive slot, and journeys of 30, 60 and 90;
- 40 random journeys per duration, seed 7;
- uncalibrated parameters.

| Species | Random only | Random + targeted |
| --- | --- | --- |
| fixture-north | Not Yet Found ×3 | Reached ×3 (targeted) |
| fixture-south | Not Yet Found ×3 | Reached ×3 (targeted) |
| fixture-twin-a | Reached ×3 (random) | Reached ×3 (random) |
| fixture-twin-b | Reached ×3 (random) | Reached ×3 (random) |
| fixture-mixed | Not Yet Found ×3 | Reached ×3 (targeted) |
| fixture-sparse (one mapped trait) | Not Yet Found ×3 | Reached ×3 (targeted) |
| fixture-unmapped (no mapping) | Proven Unreachable ×3 | Proven Unreachable ×3 |

- **Journeys run:** 120 random; 132 with targeted search.
- **Determinism:** 15 re-runs, 0 mismatches.
- **Indistinguishable pair reported:** `fixture-twin-a` / `fixture-twin-b`.
- **All witnesses replay to the same result** (tested).

**What this shows about the method, before any real data:**
1. **Random simulation alone is badly biased.** Random answers average out near the middle, so moderate profiles win nearly every random journey and the strong ones are never found. Running random journeys and stopping would have wrongly left 4 of 6 mapped profiles "not found". Calibration must use the targeted search and the holdout split, not raw simulation counts.
2. **A one-trait profile can still be reached.** Targeted search found a valid journey where `fixture-sparse` passes the gate as "partially supported". During development I had assumed it unreachable; the test proved otherwise. Whether thinly documented species should be able to win this way is a **calibration decision for Or7**, not something to fix with a hidden bonus or penalty.

## Tests
`src/matching/audit/coverage.test.ts`: 9 tests, all passing. They cover:
- valid journeys, including the adaptive pick;
- rejection of invalid answers;
- the three statuses;
- independent replay and stale witnesses;
- determinism, forms and twins;
- that the report itself is reproducible;
- the calibration/holdout split.

## Limits
- A simulation count is not a proof. Only the unmapped-profile proof is implemented.
- The greedy targeted search can miss witnesses that exist.
- **Pilot results say nothing about the full catalog:** reachability within 60 species isn't reachability among about 1,000.
- The full-catalog audit should run in a test or CI environment, not in the browser. The modules are already React-independent.
