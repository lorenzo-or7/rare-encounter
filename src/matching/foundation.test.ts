import type { TraitId } from '../domain/traits';
import candidatesJson from './data/pilot-candidates.v1.json';
import canonicalJson from './data/pilot-canonical.v1.json';
import pilotJson from './data/pilot-profiles.v1.json';
import { loadProfileDataset } from './dataset';
import { FIXTURE_DATASET, FIXTURE_REGISTRY, FIXTURE_SOURCE, fixtureProfile } from './fixtures/synthetic';
import { validateDataset, type ProfileDataset, type SpeciesProfile } from './profile';
import {
  checkQuestionsAgainstRegistry,
  EMPTY_REGISTRY,
  validateTraitRegistry,
  type TraitRegistry,
} from './registry';

const t = (s: string) => s as TraitId;

describe('Trait Registry', () => {
  it('accepts the empty shipped registry and the synthetic fixture', () => {
    expect(validateTraitRegistry(EMPTY_REGISTRY)).toEqual([]);
    expect(validateTraitRegistry(FIXTURE_REGISTRY)).toEqual([]);
  });

  it('rejects duplicates, bad ids, dimension mismatches, dangling and one-sided relations', () => {
    const base = FIXTURE_REGISTRY.traits[0];
    if (!base) throw new Error('fixture');
    const reg: TraitRegistry = {
      version: 'r',
      status: 'draft',
      traits: [
        { ...base, id: t('personality.calm'), relations: [{ kind: 'opposes', target: t('personality.restless') }] },
        { ...base, id: t('personality.restless'), relations: [] },
        { ...base, id: t('personality.calm') },
        { ...base, id: t('Personality.Bad') },
        { ...base, id: t('values.misplaced') },
        { ...base, id: t('personality.dangling'), relations: [{ kind: 'overlaps', target: t('nope.x') }] },
      ],
    };
    const kinds = validateTraitRegistry(reg).map((i) => i.kind);
    expect(kinds).toEqual(
      expect.arrayContaining([
        'duplicate-id',
        'bad-id',
        'id-dimension-mismatch',
        'unknown-relation-target',
        'unmirrored-opposition',
      ]),
    );
  });

  it('an approved registry needs every trait approved and fully defined', () => {
    const base = FIXTURE_REGISTRY.traits[0];
    if (!base) throw new Error('fixture');
    const reg: TraitRegistry = {
      version: 'r',
      status: 'approved',
      traits: [{ ...base, status: 'approved', definition: null }],
    };
    expect(validateTraitRegistry(reg).map((i) => i.kind)).toEqual(['incomplete-approved-trait']);
  });

  it('checks question effects against the registry', () => {
    const q = FIXTURE_SOURCE.question(FIXTURE_SOURCE.start(30)[0] ?? ('' as never));
    if (!q) throw new Error('fixture');
    expect(checkQuestionsAgainstRegistry([q], FIXTURE_REGISTRY)).toEqual([]);
    expect(checkQuestionsAgainstRegistry([q], EMPTY_REGISTRY).map((i) => i.kind)).toContain(
      'unknown-trait-in-effect',
    );
  });
});

describe('Species Profile schema', () => {
  it('accepts the synthetic dataset', () => {
    expect(validateDataset(FIXTURE_DATASET, FIXTURE_REGISTRY)).toEqual([]);
  });

  const withProfile = (p: SpeciesProfile): ProfileDataset => ({
    ...FIXTURE_DATASET,
    profiles: [...FIXTURE_DATASET.profiles, p],
  });
  const problems = (d: ProfileDataset) => validateDataset(d, FIXTURE_REGISTRY).map((i) => i.problem);

  it('one candidate per species and per National Pokédex number', () => {
    const dup = fixtureProfile('fixture-north', 9001, {});
    expect(problems(withProfile(dup))).toEqual(
      expect.arrayContaining([
        'duplicate species: one candidate per species',
        'duplicate National Pokédex number',
      ]),
    );
  });

  it('a species mapping cannot rest only on form-specific evidence', () => {
    const p = fixtureProfile('fixture-formy', 9100, { 'personality.fixture-a': 1 });
    const formy: SpeciesProfile = {
      ...p,
      forms: [{ formId: 'fixture-formy-alt', kind: 'regional', evidenceIds: [] }],
      evidence: p.evidence.map((e) => ({ ...e, scope: 'fixture-formy-alt' })),
    };
    expect(problems(withProfile(formy))).toContain(
      'personality.fixture-a: species mapping rests only on form-specific evidence',
    );
  });

  it('interpretations must rest on facts or observations, and mappings need evidence', () => {
    const p = fixtureProfile('fixture-loose', 9101, {});
    const loose: SpeciesProfile = {
      ...p,
      evidence: [
        { id: 'i1', kind: 'editorial-interpretation', statement: 'x', sourceIds: ['fixture:synthetic'], scope: 'species', basedOn: [] },
      ],
      traitMappings: [{ traitId: t('personality.fixture-a'), affinity: 2, evidenceIds: [], support: 'well-supported' }],
    };
    expect(problems(withProfile(loose))).toEqual(
      expect.arrayContaining([
        'i1: interpretation rests on nothing',
        'personality.fixture-a: affinity out of [-1, 1]',
        'personality.fixture-a: mapping without evidence',
      ]),
    );
  });

  it('pilot approval requires a recorded review', () => {
    const p = { ...fixtureProfile('fixture-rushed', 9102, { 'values.fixture-a': 1 }), editorialState: 'pilot-approved' as const };
    expect(problems(withProfile(p))).toContain('pilot-approved without a recorded review');
  });

  it('loads untrusted JSON field by field and reports the first bad path', () => {
    expect(loadProfileDataset({ version: 1 })).toEqual({ ok: false, errors: ['$.version: expected a string'] });
    const ok = loadProfileDataset(JSON.parse(JSON.stringify(FIXTURE_DATASET)));
    expect(ok.ok && ok.dataset.profiles.length).toBe(FIXTURE_DATASET.profiles.length);
  });
});

describe('Editorial pilot dataset (ME-02)', () => {
  const loaded = loadProfileDataset(pilotJson);
  if (!loaded.ok) throw new Error(loaded.errors.join('; '));
  const pilot = loaded.dataset;

  it('has the 60 candidates, 40 Frozen Core and 20 Challenge Set, all distinct', () => {
    const sets = candidatesJson.candidates.map((c) => c.set);
    expect(candidatesJson.candidates).toHaveLength(60);
    expect(sets.filter((s) => s === 'frozen-core')).toHaveLength(40);
    expect(sets.filter((s) => s === 'challenge-set')).toHaveLength(20);
    expect(new Set(pilot.profiles.map((p) => p.nationalDex)).size).toBe(60);
    expect(pilot.profiles.map((p) => p.speciesId)).toEqual(
      candidatesJson.candidates.map((c) => c.name.toLowerCase()),
    );
  });

  it('matches the canonical snapshot, and Frozen Core generations match their group', () => {
    for (const c of candidatesJson.candidates) {
      const r = canonicalJson.records.find((x) => x.name === c.name);
      expect(r).toBeDefined();
      if (c.set === 'frozen-core') {
        expect(`generation-${(r?.generation ?? '').replace('generation-', '')}`).toBe(
          c.group.replace('generation-', 'generation-').toLowerCase(),
        );
      }
    }
  });

  it('is valid, Draft only, and claims nothing beyond sourced canonical facts', () => {
    expect(validateDataset(pilot, EMPTY_REGISTRY)).toEqual([]);
    for (const p of pilot.profiles) {
      expect(p.editorialState).toBe('draft');
      expect(p.review).toBeNull();
      expect(p.traitMappings).toEqual([]);
      expect(p.evidence.every((e) => e.kind === 'canonical-fact' && e.sourceIds.length > 0)).toBe(true);
    }
  });

  it('keeps forms as context on one species record', () => {
    const rotom = pilot.profiles.find((p) => p.speciesId === 'rotom');
    expect(rotom?.forms.length).toBeGreaterThan(0);
    expect(pilot.profiles.filter((p) => p.speciesId.startsWith('rotom'))).toHaveLength(1);
  });
});

describe('isolation', () => {
  it('the app never imports the experimental engine or the audit', () => {
    const files = import.meta.glob<string>(['/src/**/*.{ts,tsx}', '!/src/matching/**', '!/src/**/*.test.{ts,tsx}'], {
      query: '?raw',
      import: 'default',
      eager: true,
    });
    expect(Object.keys(files).length).toBeGreaterThan(50);
    const offenders = Object.entries(files)
      .filter(([, code]) => /matching\/(experimental|audit)/.test(code))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
