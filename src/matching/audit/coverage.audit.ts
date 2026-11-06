import { mkdirSync, writeFileSync } from 'node:fs';
import { MODE_IDS, type ModeId } from '../../domain/modes';
import { BANK_SOURCE } from '../../content/questions/bank';
import catalogJson from '../../content/pokedex/pokedex.v1.json';
import { toProfiles, type Catalog } from '../../content/pokedex/catalog';
import { answeredQuestions, runForSession } from '../../content/results/compute';
import { TRAIT_REGISTRY } from '../../content/traits';
import { answerFingerprint, personSignals, rank, scoreSpecies } from '../engine';
import { ENGINE_PARAMS } from '../params';
import { answerTrail, randomSession, replayTrail, simulateSession } from './simulate';

/**
 * Full-Pokédex coverage audit (run with `npm run audit:coverage`; not part of the unit suite).
 *
 * Statuses per species and journey length:
 * - reached: a witness exists (session id + answer trail) and was replayed independently
 *   through the real question source and the full engine, giving the same Soul Match;
 * - proven-unreachable: provably never a Soul Match with these parameters: the gate needs
 *   `partiallySupported` clear leanings the species has evidence for, and the species has
 *   fewer mapped traits than that;
 * - not-yet-found: neither. This is NOT a claim of impossibility.
 * Search: random journeys (uniform answers), then a targeted walk per species that was not
 * reached: at every question it picks the option whose traits the species carries most
 * strongly. Both go through the real adaptive selection; neither touches the scores.
 */
const catalog = catalogJson as unknown as Catalog;
const profiles = toProfiles(catalog);
const OUT = 'docs/reports/matching-audit';
const RANDOM = 400;
const TARGET_SEEDS = 2;

/** Soul Match only (same rule as the engine), for the search; witnesses use the full engine. */
function soulOf(session: Parameters<typeof answeredQuestions>[0]): string | null {
  const answered = answeredQuestions(session, BANK_SOURCE);
  const signals = personSignals(answered, TRAIT_REGISTRY);
  const ranking = rank(profiles.map((p) => scoreSpecies(signals, p, ENGINE_PARAMS)), ENGINE_PARAMS, answerFingerprint(answered));
  return ranking.find((r) => r.gate !== 'insufficient-evidence')?.speciesId ?? null;
}

it('measures Soul Match coverage over the full Pokédex', { timeout: 7_200_000 }, () => {
  const minTraits = ENGINE_PARAMS.gate.partiallySupported;
  const witnesses = new Map<string, { mode: ModeId; sessionId: string; trail: string; method: 'random' | 'targeted' }>();
  const key = (slug: string, mode: ModeId) => `${slug}@${String(mode)}`;
  const soulCounts = new Map<ModeId, Map<string, number>>();

  for (const mode of MODE_IDS) {
    const counts = new Map<string, number>();
    for (let seed = 0; seed < RANDOM; seed++) {
      const session = randomSession(BANK_SOURCE, mode, seed);
      const soul = soulOf(session);
      if (!soul) continue;
      counts.set(soul, (counts.get(soul) ?? 0) + 1);
      if (!witnesses.has(key(soul, mode))) {
        witnesses.set(key(soul, mode), { mode, sessionId: session.id, trail: answerTrail(session, BANK_SOURCE), method: 'random' });
      }
    }
    soulCounts.set(mode, counts);

    for (const species of catalog.species) {
      if (witnesses.has(key(species.slug, mode)) || species.traits.length < minTraits) continue;
      const strength = new Map(species.traits.map((t) => [t.t, t.v]));
      for (let s = 0; s < TARGET_SEEDS; s++) {
        const sessionId = `target-${species.slug}-${String(mode)}-${String(s)}`;
        const session = simulateSession(BANK_SOURCE, mode, sessionId, (id) => {
          const q = BANK_SOURCE.question(id);
          let best = 0;
          let bestScore = -Infinity;
          q?.options.forEach((o, i) => {
            const score = Object.entries(o.effects).reduce((sum, [t, w]) => sum + (strength.get(t) ?? 0) * (w ?? 0), 0);
            if (score > bestScore) {
              bestScore = score;
              best = i;
            }
          });
          return best;
        });
        if (soulOf(session) === species.slug) {
          witnesses.set(key(species.slug, mode), { mode, sessionId, trail: answerTrail(session, BANK_SOURCE), method: 'targeted' });
          break;
        }
      }
    }
  }

  // Independent replay of every witness with the full engine.
  let replayFailures = 0;
  for (const [k, w] of witnesses) {
    const out = runForSession(replayTrail(BANK_SOURCE, w.mode, w.sessionId, w.trail), BANK_SOURCE, catalog);
    if (out.soul?.speciesId !== k.split('@')[0]) {
      replayFailures++;
      witnesses.delete(k);
    }
  }

  const species = catalog.species.map((s) => ({
    id: s.id,
    slug: s.slug,
    traits: s.traits.length,
    byMode: Object.fromEntries(
      MODE_IDS.map((m) => [
        String(m),
        witnesses.has(key(s.slug, m)) ? 'reached' : s.traits.length < minTraits ? 'proven-unreachable' : 'not-yet-found',
      ]),
    ),
  }));
  const summary = MODE_IDS.map((m) => {
    const statuses = species.map((s) => s.byMode[String(m)]);
    const counts = soulCounts.get(m) ?? new Map<string, number>();
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
      mode: m,
      reached: statuses.filter((x) => x === 'reached').length,
      reachedRandom: [...witnesses.values()].filter((w) => w.mode === m && w.method === 'random').length,
      reachedTargeted: [...witnesses.values()].filter((w) => w.mode === m && w.method === 'targeted').length,
      provenUnreachable: statuses.filter((x) => x === 'proven-unreachable').length,
      notYetFound: statuses.filter((x) => x === 'not-yet-found').length,
      randomJourneys: RANDOM,
      distinctRandomSouls: counts.size,
      topRandomSouls: top,
    };
  });
  const anyMode = species.filter((s) => Object.values(s.byMode).includes('reached')).length;

  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    `${OUT}/coverage.json`,
    JSON.stringify(
      {
        versions: { bank: BANK_SOURCE.bankVersion, catalog: catalog.version, params: ENGINE_PARAMS },
        catalogSpecies: catalog.species.length,
        usableProfiles: catalog.species.filter((s) => s.traits.length >= minTraits).length,
        reachedInAnyJourney: anyMode,
        replayFailures,
        summary,
        species,
        witnesses: Object.fromEntries(witnesses),
      },
      null,
      1,
    ),
  );
  expect(replayFailures).toBe(0);
});
