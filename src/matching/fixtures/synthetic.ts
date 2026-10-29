import type { CatalogVersion } from '../../domain/catalog';
import { CATEGORY_IDS, type CategoryId } from '../../domain/categories';
import { MODES, type ModeId } from '../../domain/modes';
import type { QuestionSource } from '../../domain/question-source';
import type {
  AnswerId,
  AnswerOption,
  Question,
  QuestionBankVersion,
  QuestionId,
} from '../../domain/questions';
import type { QuizSession } from '../../domain/session';
import type { TraitId } from '../../domain/traits';
import type { ProfileDataset, SpeciesProfile, SupportLevel } from '../profile';
import type { TraitRecord, TraitRegistry } from '../registry';

/**
 * SYNTHETIC TEST FIXTURE. Not editorial content, not real species, not a proposal for the
 * trait vocabulary. Trait ids are `<dimension>.fixture-a|b`, species are `fixture-*`, and the
 * questions have no wording. It exists only to exercise the matching contracts, the
 * experimental engine and the coverage audit until the approved bank and profiles exist.
 */

const L = (text: string) => ({ en: text, 'pt-BR': text, es: text });
const trait = (dim: CategoryId, k: 'a' | 'b') => `${dim}.fixture-${k}` as TraitId;

const record = (dim: CategoryId, k: 'a' | 'b'): TraitRecord => ({
  id: trait(dim, k),
  dimension: dim,
  label: L(`fixture ${dim} ${k}`),
  definition: L('Synthetic test trait.'),
  signals: [],
  relations: [],
  evidenceBoundary: 'Synthetic: never shown, never applied to a real species.',
  ambiguities: [],
  introducedIn: 'registry-fixture-1',
  status: 'draft',
});

export const FIXTURE_REGISTRY: TraitRegistry = {
  version: 'registry-fixture-1',
  status: 'draft',
  traits: CATEGORY_IDS.flatMap((d) => [record(d, 'a'), record(d, 'b')]),
};

/** Each question moves one of its dimension's two traits toward a pole. */
function fixtureQuestion(id: string, dim: CategoryId, n: number): Question {
  const w = n % 2 === 0 ? 1 : 0.5;
  const opt = (k: string, t: 'a' | 'b', v: number): AnswerOption => ({
    id: k as AnswerId,
    label: L(k),
    effects: { [trait(dim, t)]: v },
  });
  return {
    id: id as QuestionId,
    revision: 1,
    category: dim,
    role: 'fundamental',
    format: 'text',
    prompt: L(id),
    options: [opt('a', 'a', w), opt('b', 'a', -w), opt('c', 'b', w), opt('d', 'b', -w)],
  };
}

const ADAPTIVE_DRIVER = 'fx-personality-1';

/**
 * Category quotas of the real modes, plus one adaptive slot: the last instinct question
 * depends on the answer to the first personality question.
 */
function sequence(mode: ModeId, answers: QuizSession['answers']): QuestionId[] {
  const ids: string[] = [];
  for (const dim of CATEGORY_IDS) {
    const quota = MODES[mode].quotas[dim];
    for (let n = 1; n <= quota; n++) {
      if (dim === 'instinct' && n === quota) {
        ids.push(answers[ADAPTIVE_DRIVER]?.answerId === ('a' as AnswerId) ? 'fx-instinct-adapt-x' : 'fx-instinct-adapt-y');
      } else ids.push(`fx-${dim}-${String(n)}`);
    }
  }
  return ids as QuestionId[];
}

export const FIXTURE_SOURCE: QuestionSource = {
  bankVersion: 'bank-fixture-1' as QuestionBankVersion,
  catalogVersion: 'catalog-fixture-1' as CatalogVersion,
  preview: true,
  start: (mode) => sequence(mode, {}),
  question(id) {
    const m = /^fx-([a-z]+)-(\d+|adapt-[xy])$/.exec(id);
    if (!m?.[1] || !m[2]) return undefined;
    const dim = m[1] as CategoryId;
    if (!CATEGORY_IDS.includes(dim)) return undefined;
    const n = m[2] === 'adapt-x' ? 100 : m[2] === 'adapt-y' ? 101 : Number(m[2]);
    return fixtureQuestion(id, dim, n);
  },
  reconcile: (session) => sequence(session.mode, session.answers),
};

const SOURCE_ID = 'fixture:synthetic';

/** A synthetic species with the given affinities; every mapping cites one synthetic fact. */
export function fixtureProfile(
  speciesId: string,
  nationalDex: number,
  affinities: Partial<Record<string, number>>,
  support: SupportLevel = 'well-supported',
): SpeciesProfile {
  const entries = Object.entries(affinities) as [string, number][];
  return {
    speciesId,
    nationalDex,
    profileVersion: 'profile-fixture-1',
    editorialState: 'draft',
    evidence: entries.map(([t]) => ({
      id: `${speciesId}.${t}`,
      kind: 'canonical-fact',
      statement: 'Synthetic fact.',
      sourceIds: [SOURCE_ID],
      scope: 'species',
      basedOn: [],
    })),
    traitMappings: entries.map(([t, v]) => ({
      traitId: t as TraitId,
      affinity: v,
      evidenceIds: [`${speciesId}.${t}`],
      support,
    })),
    evidenceBoundaries: [],
    forms: [],
    review: null,
  };
}

const all = (v: number) =>
  Object.fromEntries(FIXTURE_REGISTRY.traits.map((t) => [t.id, v])) as Record<string, number>;

/** Poles on every trait, two exact twins, a mixed profile and a barely documented one. */
export const FIXTURE_PROFILES: readonly SpeciesProfile[] = [
  fixtureProfile('fixture-north', 9001, all(1)),
  fixtureProfile('fixture-south', 9002, all(-1)),
  fixtureProfile('fixture-twin-a', 9003, { ...all(0.25), 'values.fixture-a': -0.5 }),
  fixtureProfile('fixture-twin-b', 9004, { ...all(0.25), 'values.fixture-a': -0.5 }),
  fixtureProfile(
    'fixture-mixed',
    9005,
    Object.fromEntries(FIXTURE_REGISTRY.traits.map((t, i) => [t.id, i % 2 === 0 ? 1 : -1])),
  ),
  fixtureProfile('fixture-sparse', 9006, { 'personality.fixture-a': 1 }),
];

export const FIXTURE_DATASET: ProfileDataset = {
  version: 'profiles-fixture-1',
  registryVersion: FIXTURE_REGISTRY.version,
  sources: [{ id: SOURCE_ID, kind: 'editorial-review', title: 'Synthetic test source', url: null, retrievedAt: null }],
  profiles: FIXTURE_PROFILES,
};
