import type { AnswerId } from '../../domain/questions';
import { EXPERIMENTAL_ENGINE_VERSION, EXPERIMENTAL_PARAMS } from '../experimental/params';
import { FIXTURE_PROFILES, FIXTURE_REGISTRY, FIXTURE_SOURCE, fixtureProfile } from '../fixtures/synthetic';
import type { VersionStamp } from '../versions';
import { replayWitness, runCoverageAudit, splitCalibrationHoldout, type AuditConfig } from './coverage';
import { walkJourney } from './journey';

const VERSIONS: VersionStamp = {
  questionBank: 'bank-fixture-1',
  traitRegistry: FIXTURE_REGISTRY.version,
  speciesProfiles: 'profiles-fixture-1',
  engine: EXPERIMENTAL_ENGINE_VERSION,
};

const cfg: AuditConfig = {
  source: FIXTURE_SOURCE,
  modes: [30, 60],
  profiles: [...FIXTURE_PROFILES, fixtureProfile('fixture-unmapped', 9010, {})],
  registry: FIXTURE_REGISTRY,
  params: EXPERIMENTAL_PARAMS,
  versions: VERSIONS,
  randomJourneys: 40,
  seed: 7,
  targeted: true,
};

describe('valid journeys', () => {
  it('follow the source, including its adaptive pick', () => {
    const x = walkJourney(FIXTURE_SOURCE, 30, () => 'a' as AnswerId);
    const y = walkJourney(FIXTURE_SOURCE, 30, () => 'b' as AnswerId);
    expect(x.questionIds).toContain('fx-instinct-adapt-x');
    expect(y.questionIds).toContain('fx-instinct-adapt-y');
    expect(x.questionIds).toHaveLength(30);
  });

  it('reject an answer that is not an option', () => {
    expect(() => walkJourney(FIXTURE_SOURCE, 30, () => 'zz' as AnswerId)).toThrow(/not an option/);
  });
});

describe('coverage audit (synthetic fixture)', () => {
  const report = runCoverageAudit(cfg);
  const status = (id: string, mode: number) =>
    report.species.find((s) => s.speciesId === id)?.byMode[String(mode)];

  it('separates reached, not yet found and proven unreachable', () => {
    expect(status('fixture-north', 30)).toBe('reached');
    expect(status('fixture-unmapped', 30)).toBe('proven-unreachable');
    // One mapped trait: random journeys never let it pass the gate, but the targeted search
    // finds a valid journey where it does. Lack of random discovery proved nothing.
    expect(status('fixture-sparse', 30)).toBe('reached');
    expect(report.witnesses.find((w) => w.speciesId === 'fixture-sparse')?.method).toBe('targeted');
  });

  it('every witness replays independently to the same result', () => {
    expect(report.witnesses.length).toBeGreaterThan(0);
    for (const w of report.witnesses) {
      expect(replayWitness(cfg, w)).toEqual({ ok: true });
      expect(w.versions).toEqual(VERSIONS);
      expect(w.answers).toHaveLength(w.mode);
    }
  });

  it('a witness from other versions is reported stale, not silently reused', () => {
    const w = report.witnesses[0];
    if (!w) throw new Error('no witness');
    const moved = { ...cfg, versions: { ...VERSIONS, engine: 'engine-next' } };
    expect(replayWitness(moved, w)).toEqual({ ok: false, reason: 'stale-versions' });
  });

  it('is deterministic, one candidate per species, and flags indistinguishable twins', () => {
    expect(report.determinism.mismatches).toBe(0);
    expect(report.forms.candidates).toBe(report.forms.profiles);
    expect(report.indistinguishablePairs).toEqual([['fixture-twin-a', 'fixture-twin-b']]);
    expect(report.calibrated).toBe(false);
  });

  it('without the targeted search the sparse species is not yet found, never "unreachable"', () => {
    const randomOnly = runCoverageAudit({ ...cfg, targeted: false });
    const s = randomOnly.species.find((x) => x.speciesId === 'fixture-sparse');
    expect(s?.byMode['30']).toBe('not-yet-found');
  });

  it('the same config gives the same report', () => {
    expect(JSON.stringify(runCoverageAudit(cfg))).toBe(JSON.stringify(report));
  });
});

describe('calibration / holdout split', () => {
  it('is deterministic and disjoint', () => {
    const ids = Array.from({ length: 60 }, (_, i) => `s${String(i)}`);
    const a = splitCalibrationHoldout(ids, 0.25, 3);
    expect(a).toEqual(splitCalibrationHoldout([...ids].reverse(), 0.25, 3));
    expect(a.holdout).toHaveLength(15);
    expect(a.holdout.filter((x) => a.calibration.includes(x))).toEqual([]);
  });
});
