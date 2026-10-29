import type { TraitId } from '../domain/traits';
import type {
  EditorialState,
  EvidenceKind,
  EvidenceRecord,
  FormContext,
  FormKind,
  ProfileDataset,
  ProfileReview,
  SourceKind,
  SourceRecord,
  SpeciesProfile,
  SupportLevel,
  TraitMapping,
} from './profile';

/**
 * Loads a profile dataset from untrusted JSON. Shapes are checked field by field and the
 * result is rebuilt from known fields only; nothing in the input is evaluated or spread.
 */
export type LoadResult =
  | { readonly ok: true; readonly dataset: ProfileDataset }
  | { readonly ok: false; readonly errors: readonly string[] };

class ShapeError extends Error {}

type Obj = Record<string, unknown>;
const fail = (path: string, what: string): never => {
  throw new ShapeError(`${path}: expected ${what}`);
};
const obj = (v: unknown, path: string): Obj =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Obj) : fail(path, 'an object');
const str = (v: unknown, path: string): string => (typeof v === 'string' ? v : fail(path, 'a string'));
const strOrNull = (v: unknown, path: string): string | null => (v === null ? null : str(v, path));
const num = (v: unknown, path: string): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fail(path, 'a finite number');
const arr = <T>(v: unknown, path: string, item: (x: unknown, p: string) => T): T[] =>
  Array.isArray(v) ? v.map((x, i) => item(x, `${path}[${String(i)}]`)) : fail(path, 'an array');
const oneOf = <T extends string>(v: unknown, path: string, allowed: readonly T[]): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : fail(path, allowed.join(' | '));

const SOURCE_KINDS: readonly SourceKind[] = ['game-data', 'official', 'editorial-review'];
const EVIDENCE_KINDS: readonly EvidenceKind[] = [
  'canonical-fact',
  'direct-observation',
  'editorial-interpretation',
];
const SUPPORT: readonly SupportLevel[] = [
  'well-supported',
  'partially-supported',
  'insufficient-evidence',
];
const FORM_KINDS: readonly FormKind[] = ['regional', 'mega', 'gigantamax', 'battle', 'cosmetic', 'other'];
const STATES: readonly EditorialState[] = [
  'draft',
  'evidence-reviewed',
  'pilot-approved',
  'recalibration-required',
];

function source(v: unknown, p: string): SourceRecord {
  const o = obj(v, p);
  return {
    id: str(o['id'], `${p}.id`),
    kind: oneOf(o['kind'], `${p}.kind`, SOURCE_KINDS),
    title: str(o['title'], `${p}.title`),
    url: strOrNull(o['url'], `${p}.url`),
    retrievedAt: strOrNull(o['retrievedAt'], `${p}.retrievedAt`),
  };
}

function evidence(v: unknown, p: string): EvidenceRecord {
  const o = obj(v, p);
  return {
    id: str(o['id'], `${p}.id`),
    kind: oneOf(o['kind'], `${p}.kind`, EVIDENCE_KINDS),
    statement: str(o['statement'], `${p}.statement`),
    sourceIds: arr(o['sourceIds'], `${p}.sourceIds`, str),
    scope: str(o['scope'], `${p}.scope`),
    basedOn: arr(o['basedOn'], `${p}.basedOn`, str),
  };
}

function mapping(v: unknown, p: string): TraitMapping {
  const o = obj(v, p);
  return {
    traitId: str(o['traitId'], `${p}.traitId`) as TraitId,
    affinity: num(o['affinity'], `${p}.affinity`),
    evidenceIds: arr(o['evidenceIds'], `${p}.evidenceIds`, str),
    support: oneOf(o['support'], `${p}.support`, SUPPORT),
  };
}

function form(v: unknown, p: string): FormContext {
  const o = obj(v, p);
  return {
    formId: str(o['formId'], `${p}.formId`),
    kind: oneOf(o['kind'], `${p}.kind`, FORM_KINDS),
    evidenceIds: arr(o['evidenceIds'], `${p}.evidenceIds`, str),
  };
}

function review(v: unknown, p: string): ProfileReview | null {
  if (v === null) return null;
  const o = obj(v, p);
  return {
    reviewer: str(o['reviewer'], `${p}.reviewer`),
    reviewedAt: str(o['reviewedAt'], `${p}.reviewedAt`),
    notes: strOrNull(o['notes'], `${p}.notes`),
  };
}

function profile(v: unknown, p: string): SpeciesProfile {
  const o = obj(v, p);
  return {
    speciesId: str(o['speciesId'], `${p}.speciesId`),
    nationalDex: num(o['nationalDex'], `${p}.nationalDex`),
    profileVersion: str(o['profileVersion'], `${p}.profileVersion`),
    editorialState: oneOf(o['editorialState'], `${p}.editorialState`, STATES),
    evidence: arr(o['evidence'], `${p}.evidence`, evidence),
    traitMappings: arr(o['traitMappings'], `${p}.traitMappings`, mapping),
    evidenceBoundaries: arr(o['evidenceBoundaries'], `${p}.evidenceBoundaries`, str),
    forms: arr(o['forms'], `${p}.forms`, form),
    review: review(o['review'], `${p}.review`),
  };
}

export function loadProfileDataset(input: unknown): LoadResult {
  try {
    const o = obj(input, '$');
    return {
      ok: true,
      dataset: {
        version: str(o['version'], '$.version'),
        registryVersion: str(o['registryVersion'], '$.registryVersion'),
        sources: arr(o['sources'], '$.sources', source),
        profiles: arr(o['profiles'], '$.profiles', profile),
      },
    };
  } catch (e) {
    if (e instanceof ShapeError) return { ok: false, errors: [e.message] };
    throw e;
  }
}
