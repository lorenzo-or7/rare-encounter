import type { AnswerId, QuestionId } from '../domain/questions';
import { walkJourney } from './audit/journey';
import {
  FIXTURE_PROFILES,
  FIXTURE_REGISTRY,
  FIXTURE_SOURCE,
  fixtureProfile,
} from './fixtures/synthetic';
import pilotJson from './data/pilot-profiles.v1.json';
import { loadProfileDataset } from './dataset';
import { EMPTY_REGISTRY } from './registry';
import type { VersionStamp } from './versions';
import {
  answerFingerprint,
  rank,
  runExperimentalEngine,
  scoreSpecies,
  personSignals,
  type AnsweredQuestion,
  type Scored,
} from './engine';
import { EXPERIMENTAL_ENGINE_VERSION, EXPERIMENTAL_PARAMS } from './params';

const VERSIONS: VersionStamp = {
  questionBank: 'bank-fixture-1',
  traitRegistry: FIXTURE_REGISTRY.version,
  speciesProfiles: 'profiles-fixture-1',
  engine: EXPERIMENTAL_ENGINE_VERSION,
};

/** A full 30-question journey answering every question with the same option. */
const always = (answer: string) =>
  walkJourney(FIXTURE_SOURCE, 30, () => answer as AnswerId).answers;

const engine = (answered: readonly AnsweredQuestion[], profiles = FIXTURE_PROFILES) =>
  runExperimentalEngine({
    answered,
    profiles,
    registry: FIXTURE_REGISTRY,
    params: EXPERIMENTAL_PARAMS,
    versions: VERSIONS,
  });

describe('experimental engine: components', () => {
  it('reads answers as leanings against the alternatives offered', () => {
    const signals = personSignals(always('a'), FIXTURE_REGISTRY);
    // "a" raises trait a every time: a clear lean toward it.
    for (const s of signals.filter((x) => x.traitId.endsWith('fixture-a'))) expect(s.value).toBeGreaterThan(0.7);
    // Trait b sat in options never picked, one raising it and one lowering it: no lean.
    for (const s of signals.filter((x) => x.traitId.endsWith('fixture-b'))) expect(Math.abs(s.value)).toBeLessThan(1e-9);
    // Always picking "b" (which lowers trait a) is a lean away from it.
    for (const s of personSignals(always('b'), FIXTURE_REGISTRY).filter((x) => x.traitId.endsWith('fixture-a'))) {
      expect(s.value).toBeLessThan(-0.7);
    }
  });

  it('missing evidence is unknown, not incompatible: it lowers coverage, never affinity', () => {
    const signals = personSignals(always('a'), FIXTURE_REGISTRY);
    const sparse = scoreSpecies(signals, fixtureProfile('s', 1, { 'personality.fixture-a': 1 }), EXPERIMENTAL_PARAMS);
    const opposed = scoreSpecies(signals, fixtureProfile('o', 2, { 'personality.fixture-a': -1 }), EXPERIMENTAL_PARAMS);
    expect(sparse.affinity).toBeGreaterThan(0.85);
    expect(sparse.coverage).toBeLessThan(0.3);
    expect(sparse.score).toBeGreaterThan(opposed.score);
    // Uncertainty is applied once: the score sits between neutral and the raw affinity.
    expect(sparse.score).toBeGreaterThan(0.5);
    expect(sparse.score).toBeLessThan(sparse.affinity);
  });

  it('the gate labels support from coverage', () => {
    const signals = personSignals(always('a'), FIXTURE_REGISTRY);
    const gate = (p: Parameters<typeof scoreSpecies>[1]) => scoreSpecies(signals, p, EXPERIMENTAL_PARAMS).gate;
    expect(gate(FIXTURE_PROFILES[0] ?? fixtureProfile('x', 1, {}))).toBe('well-supported');
    expect(gate(fixtureProfile('none', 3, {}))).toBe('insufficient-evidence');
  });

  it('breaks ties inside the equivalence band by evidence, then a stable neutral key', () => {
    const mk = (id: string, score: number, extra: Partial<Scored> = {}): Scored => ({
      speciesId: id, affinity: score, coverage: 1, score, gate: 'well-supported', contributions: [],
      reliability: 1, sourceCount: 1, consistency: 1, ...extra,
    });
    const r = rank([mk('a', 0.9), mk('b', 0.895, { sourceCount: 3 }), mk('c', 0.5)], EXPERIMENTAL_PARAMS, 'f');
    expect(r.map((x) => x.speciesId)).toEqual(['b', 'a', 'c']);
    expect(r[0]?.tieBreak).toBe('sources');
    expect(r[1]?.tieBreak).toBeNull();
    // Exact twins: the neutral key decides, the same way every time, and not by name order.
    const twins = [mk('zz', 0.8), mk('aa', 0.8)];
    const orders = new Set(
      ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'].map((f) => rank(twins, EXPERIMENTAL_PARAMS, f)[0]?.speciesId),
    );
    expect(orders.size).toBe(2);
    expect(rank(twins, EXPERIMENTAL_PARAMS, 'f1')).toEqual(rank([...twins].reverse(), EXPERIMENTAL_PARAMS, 'f1'));
  });

  it('the fingerprint ignores answer order', () => {
    const a = always('c');
    expect(answerFingerprint(a)).toBe(answerFingerprint([...a].reverse()));
  });
});

describe('experimental engine: roles', () => {
  it('gives three distinct species with traceable drivers, deterministically', () => {
    // Answer c everywhere: positive on every b trait, where north (+1) and mixed (-1) differ.
    const out = engine(always('c'));
    expect(out.experimental).toBe(true);
    expect(out.calibrated).toBe(false);
    const ids = [out.soul?.speciesId, out.hidden?.speciesId, out.alternative?.speciesId];
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(3);
    expect(out.soul?.speciesId).toBe('fixture-north');
    for (const d of out.soul?.drivers ?? []) expect(d.evidenceIds.length).toBeGreaterThan(0);
    expect(JSON.stringify(engine(always('c')))).toBe(JSON.stringify(out));
  });

  it('the hidden match reads only non-dominant observed signals', () => {
    const out = engine(always('a'));
    const signals = personSignals(always('a'), FIXTURE_REGISTRY);
    const dominant = new Set(
      [...signals]
        .sort((x, y) => Math.abs(y.value) * y.observations - Math.abs(x.value) * x.observations || (x.traitId < y.traitId ? -1 : 1))
        .slice(0, Math.ceil(signals.length / 3))
        .map((s) => s.traitId),
    );
    for (const d of out.hidden?.drivers ?? []) expect(dominant.has(d.traitId)).toBe(false);
  });

  it('a species with almost no evidence is ranked, not excluded, but cannot be the Soul Match', () => {
    const out = engine(always('a'));
    expect(out.ranking.some((r) => r.speciesId === 'fixture-sparse')).toBe(true);
    expect(out.soul?.speciesId).not.toBe('fixture-sparse');
  });

  it('with the Draft pilot (no mappings) it returns no match and says why', () => {
    const pilot = loadProfileDataset(pilotJson);
    if (!pilot.ok) throw new Error('pilot');
    const q = FIXTURE_SOURCE.question('fx-personality-1' as QuestionId);
    if (!q) throw new Error('fixture');
    const out = runExperimentalEngine({
      answered: [{ question: q, answerId: 'a' as AnswerId }],
      profiles: pilot.dataset.profiles,
      registry: FIXTURE_REGISTRY,
      params: EXPERIMENTAL_PARAMS,
      versions: VERSIONS,
    });
    expect(out.soul).toBeNull();
    expect(out.notes).toContain('no species has enough evidence for the observed signal');
    // And with the shipped empty registry no answer carries any signal at all.
    const none = runExperimentalEngine({
      answered: [{ question: q, answerId: 'a' as AnswerId }],
      profiles: pilot.dataset.profiles,
      registry: EMPTY_REGISTRY,
      params: EXPERIMENTAL_PARAMS,
      versions: VERSIONS,
    });
    expect(none.notes).toEqual(['no trait signal in the answers']);
  });
});
