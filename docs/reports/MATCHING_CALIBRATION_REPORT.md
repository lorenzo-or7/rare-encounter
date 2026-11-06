# Matching Calibration Report (Engine v1)

Reproduce with `npm run audit:calibrate` (code: `src/matching/audit/calibrate.audit.ts`; raw output: `docs/reports/matching-audit/calibration.json`). Data: question bank `bank-1.0-candidate`, catalog `pokedex-1.0` (1,025 species), registry `registry-1.0-candidate`.

## What was calibrated
- **Equivalence band** (relative): scores within this fraction of the leader's lift above neutral (score − 0.5) count as tied, and the evidence-based tie-break decides among them.
- **Confidence gate:** how many of the person's clear leanings (|lean| ≥ 0.2) a species must have evidence for to be eligible (partially supported) or well supported.

Grid: band ∈ {0, 0.01, 0.02, 0.05, 0.10} × gate (partial/well) ∈ {1/3, 2/3, 2/4, 3/4}.

## Data separation
- **Calibration:** 200 random valid journeys per length (seeds 0–199; 600 in total).
- **Validation:** 200 other journeys per length (seeds 1000–1199), run through the full engine with the three roles. These were never used to choose.

## The rule, and its one revision
- **Rule v1** (set before the first run): every journey has a Soul Match; average fidelity ≥ 98%; then the most distinct Soul Matches.
  - **What went wrong:** it picked band 0, which switches the equivalence band off. Its fidelity ratio was also undefined when every eligible species sat below neutral.
  - It was replaced. That is recorded here and in the code.
- **Rule v2:**
  1. every journey has a Soul Match;
  2. at most 1% of Soul Matches at or below neutral;
  3. average fidelity ≥ 99%;
  4. then the widest band, then the stricter gate.

## Results (calibration seeds, 600 journeys, final catalog)
Each cell gives the average fidelity, then the share of Soul Matches at or below neutral. ✗ marks a configuration that fails the rule.

| Band | Gate 1/3 | Gate 2/3 | Gate 2/4 | Gate 3/4 |
| --- | --- | --- | --- | --- |
| 0 | 1.0000, 0% | 1.0000, 0.2% | 1.0000, 0.2% | 1.0000, 0.5% |
| 0.01 | 0.9997, 0% | 0.9998, 0.2% | 0.9998, 0.2% | 0.9999, 0.5% |
| 0.02 | 0.9993, 0% | 0.9993, 0.2% | 0.9993, 0.2% | 0.9996, 0.5% |
| 0.05 | 0.9946, 0% | 0.9952, 0.2% | 0.9952, 0.2% | **0.9965, 0.5% (chosen)** |
| 0.10 | 0.9804 ✗ | 0.9826 ✗ | 0.9826 ✗ | 0.9874 ✗ |

- **Distinct Soul Matches** stayed between 287 and 326 of 600 in every configuration.
- **The most frequent species** never exceeded 1.7% of the journeys.

**Chosen: band 0.05, gate 3 (partial) / 4 (well).**

## Validation (unseen seeds, full engine)
| Journey | Complete trios | Three different species | Distinct Soul Matches | Most frequent Soul Match |
| --- | --- | --- | --- | --- |
| 30 | 200/200 | 200/200 | 148 | 2.5% |
| 60 | 200/200 | 200/200 | 158 | 2.0% |
| 90 | 200/200 | 200/200 | 148 | 2.5% |

## Fixes the measurements forced, before choosing
- **Preference signals:** answers are read as leanings against the options offered, not as raw counts. Signed effects were first mishandled, capping a full lean at 1/3, and this was corrected.
- **Relative band:** the scores sit close together (lifts of about 0.01), so an absolute band of 0.002 grouped dozens of species and let tie-breaks override clear winners.
- **Hidden Match:** complementary leanings are quiet by design, so 10 of 200 journeys of 60 had no Hidden Match under the strict gate.
  - It may now rest on one observed positive complementary leaning, never on a trait that was not shown.
  - The engine records when it does.
- **Catalog keywords:** ambiguous words ("leaves", "fields", "waves", "stones", "home", "master") produced false traits. They were removed and the catalog re-derived before the final runs.

## Limits
- A random journey is not a real person. The weights of the six categories are the approved ones and were not tuned.
- No popularity, rarity, legendary or Pokédex-order bonus exists anywhere. The final neutral tie-break is a hash of the answers and the species id.
