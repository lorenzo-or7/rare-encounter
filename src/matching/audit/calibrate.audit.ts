import { mkdirSync, writeFileSync } from 'node:fs';
import { MODE_IDS } from '../../domain/modes';
import { BANK_SOURCE } from '../../content/questions/bank';
import catalogJson from '../../content/pokedex/pokedex.v1.json';
import { toProfiles, type Catalog } from '../../content/pokedex/catalog';
import { REGISTRY_VERSION, TRAIT_REGISTRY } from '../../content/traits';
import { answerFingerprint, personSignals, rank, runExperimentalEngine, scoreSpecies, type Scored } from '../engine';
import { ENGINE_PARAMS, ENGINE_VERSION, type EngineParams } from '../params';
import { answeredQuestions } from '../../content/results/compute';
import { randomSession } from './simulate';

/**
 * Calibration (run with `npm run audit:calibrate`; not part of the unit suite).
 *
 * Rule v2 (v1 was revised after its first run, see the calibration report: v1 ranked by
 * "most distinct Soul Matches", which picked band 0, i.e. no equivalence band at all, and
 * its fidelity ratio was undefined when every eligible species sat below neutral):
 *  1. every journey must yield a Soul Match;
 *  2. at most 1% of Soul Matches may sit at or below neutral (score ≤ 0.5);
 *  3. the Soul Match keeps, on average, ≥ 99% of the best eligible lift above neutral
 *     (journeys where the best eligible lift is positive);
 *  4. among the configurations that pass: the widest band (it exists to treat near-ties
 *     as ties), then the stricter gate.
 * Chosen on calibration seeds (0–199 per journey), then measured on validation seeds
 * (1000–1199) with the full engine.
 */
const catalog = catalogJson as unknown as Catalog;
const profiles = toProfiles(catalog);
const OUT = 'docs/reports/matching-audit';

const BANDS = [0, 0.01, 0.02, 0.05, 0.1];
const GATES: [number, number][] = [
  [1, 3],
  [2, 3],
  [2, 4],
  [3, 4],
];

it('calibrates the band and the gate', { timeout: 3_600_000 }, () => {
  // Score every calibration journey once; band and gate only re-rank those scores.
  const journeys = MODE_IDS.flatMap((mode) =>
    Array.from({ length: 200 }, (_, seed) => {
      const answered = answeredQuestions(randomSession(BANK_SOURCE, mode, seed), BANK_SOURCE);
      const signals = personSignals(answered, TRAIT_REGISTRY);
      return { mode, fp: answerFingerprint(answered), scored: profiles.map((p) => scoreSpecies(signals, p, ENGINE_PARAMS)) };
    }),
  );

  const rows = [];
  for (const band of BANDS) {
    for (const [partial, well] of GATES) {
      const params: EngineParams = { ...ENGINE_PARAMS, equivalenceBand: band, gate: { wellSupported: well, partiallySupported: partial } };
      const souls = new Map<string, number>();
      let missing = 0;
      let fidelity = 0;
      let fidelityRuns = 0;
      let belowNeutral = 0;
      let wellShare = 0;
      let neutral = 0;
      for (const j of journeys) {
        const regated: Scored[] = j.scored.map((s) => {
          const salient = s.contributions.filter((c) => Math.abs(c.person) >= params.salience).length;
          const gate = salient >= well ? 'well-supported' : salient >= partial ? 'partially-supported' : 'insufficient-evidence';
          return { ...s, gate };
        });
        const ranking = rank(regated, params, j.fp);
        const eligible = ranking.filter((r) => r.gate !== 'insufficient-evidence');
        const soul = eligible[0];
        if (!soul) {
          missing++;
          continue;
        }
        const best = Math.max(...eligible.map((r) => r.score));
        if (soul.score <= 0.5) belowNeutral++;
        if (best > 0.5) {
          fidelity += (soul.score - 0.5) / (best - 0.5);
          fidelityRuns++;
        }
        if (soul.gate === 'well-supported') wellShare++;
        if (ranking[0]?.tieBreak === 'neutral-key') neutral++;
        souls.set(soul.speciesId, (souls.get(soul.speciesId) ?? 0) + 1);
      }
      const n = journeys.length - missing;
      rows.push({
        band,
        gate: `${String(partial)}/${String(well)}`,
        missing,
        belowNeutral: n ? belowNeutral / n : 0,
        fidelity: fidelityRuns ? fidelity / fidelityRuns : 0,
        wellSupported: n ? wellShare / n : 0,
        neutralKey: neutral / journeys.length,
        distinct: souls.size,
        maxShare: Math.max(0, ...souls.values()) / journeys.length,
        params,
      });
    }
  }
  const passing = rows.filter((r) => r.missing === 0 && r.belowNeutral <= 0.01 && r.fidelity >= 0.99);
  passing.sort(
    (a, b) =>
      b.band - a.band ||
      b.params.gate.partiallySupported - a.params.gate.partiallySupported ||
      b.params.gate.wellSupported - a.params.gate.wellSupported,
  );
  const chosen = passing[0];
  if (!chosen) throw new Error('no configuration passes the calibration rule');

  // Validation: full engine (three roles) on unseen seeds with the chosen parameters.
  const validation = MODE_IDS.map((mode) => {
    const souls = new Map<string, number>();
    let complete = 0;
    let distinctRoles = 0;
    let weakAlternative = 0;
    for (let seed = 1000; seed < 1200; seed++) {
      const out = runExperimentalEngine({
        answered: answeredQuestions(randomSession(BANK_SOURCE, mode, seed), BANK_SOURCE),
        profiles,
        registry: TRAIT_REGISTRY,
        params: chosen.params,
        versions: { questionBank: BANK_SOURCE.bankVersion, traitRegistry: REGISTRY_VERSION, speciesProfiles: catalog.version, engine: ENGINE_VERSION },
      });
      if (out.soul && out.hidden && out.alternative) {
        complete++;
        if (new Set([out.soul.speciesId, out.hidden.speciesId, out.alternative.speciesId]).size === 3) distinctRoles++;
        if (out.alternative.differentiation === 'weak') weakAlternative++;
        souls.set(out.soul.speciesId, (souls.get(out.soul.speciesId) ?? 0) + 1);
      }
    }
    return { mode, runs: 200, complete, distinctRoles, weakAlternative, distinctSouls: souls.size, maxShare: Math.max(0, ...souls.values()) / 200 };
  });

  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    `${OUT}/calibration.json`,
    JSON.stringify({ rule: 'v2, see calibrate.audit.ts', grid: rows, chosen: { band: chosen.band, gate: chosen.gate }, validation }, (k, v: unknown) => (k === 'params' ? undefined : v), 2),
  );
  expect(chosen).toBeDefined();
});
