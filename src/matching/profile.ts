import type { TraitId } from '../domain/traits';
import type { TraitRegistry } from './registry';

/**
 * Species Profile schema (ME-01/ME-02): Canonical + Editorial Hybrid, Species First, Forms
 * Aware. Verified facts, direct observations and editorial readings are kept apart, and
 * every reading must say which facts or observations it rests on.
 */

export type SourceKind =
  /** Structured data from the games (a public mirror such as PokéAPI). */
  | 'game-data'
  /** Official publications: guides, sites, anime or other official media. */
  | 'official'
  /** A reviewer's documented observation of official material. */
  | 'editorial-review';

export interface SourceRecord {
  readonly id: string;
  readonly kind: SourceKind;
  readonly title: string;
  readonly url: string | null;
  readonly retrievedAt: string | null;
}

export type EvidenceKind =
  /** A verifiable fact (type, generation, a documented in-game behaviour). */
  | 'canonical-fact'
  /** Something directly visible in official art (colour, silhouette, material). */
  | 'direct-observation'
  /** An editorial reading; a hypothesis until reviewed, never a fact. */
  | 'editorial-interpretation';

export interface EvidenceRecord {
  readonly id: string;
  readonly kind: EvidenceKind;
  readonly statement: string;
  readonly sourceIds: readonly string[];
  /** `species` for all forms; a form id when it holds for that form only. */
  readonly scope: string;
  /** Interpretations name the facts or observations they rest on. */
  readonly basedOn: readonly string[];
}

/** Adaptive Confidence Gate states: how well a claim is supported, never how compatible. */
export type SupportLevel = 'well-supported' | 'partially-supported' | 'insufficient-evidence';

export interface TraitMapping {
  readonly traitId: TraitId;
  /** Signed affinity in [-1, 1]. An absent mapping means unknown, never incompatible. */
  readonly affinity: number;
  readonly evidenceIds: readonly string[];
  readonly support: SupportLevel;
}

export type FormKind = 'regional' | 'mega' | 'gigantamax' | 'battle' | 'cosmetic' | 'other';

/** Official forms are context on the species record; they are never extra candidates. */
export interface FormContext {
  readonly formId: string;
  readonly kind: FormKind;
  /** Only form-scoped evidence; it never becomes a species-level mapping on its own. */
  readonly evidenceIds: readonly string[];
}

export type EditorialState =
  | 'draft'
  | 'evidence-reviewed'
  | 'pilot-approved'
  | 'recalibration-required';

export interface ProfileReview {
  readonly reviewer: string;
  readonly reviewedAt: string;
  readonly notes: string | null;
}

export interface SpeciesProfile {
  /** Lowercase species slug (the PokéAPI species name). */
  readonly speciesId: string;
  readonly nationalDex: number;
  readonly profileVersion: string;
  readonly editorialState: EditorialState;
  readonly evidence: readonly EvidenceRecord[];
  readonly traitMappings: readonly TraitMapping[];
  /** What must never be said about this species from the evidence at hand. */
  readonly evidenceBoundaries: readonly string[];
  readonly forms: readonly FormContext[];
  readonly review: ProfileReview | null;
}

export interface ProfileDataset {
  readonly version: string;
  readonly registryVersion: string;
  readonly sources: readonly SourceRecord[];
  readonly profiles: readonly SpeciesProfile[];
}

export type ProfileIssue = { readonly species: string; readonly problem: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Structural and editorial-integrity checks; carries no scoring semantics. */
export function validateDataset(dataset: ProfileDataset, registry: TraitRegistry): ProfileIssue[] {
  const issues: ProfileIssue[] = [];
  const add = (species: string, problem: string) => issues.push({ species, problem });
  const sources = new Set(dataset.sources.map((s) => s.id));
  if (sources.size !== dataset.sources.length) add('*', 'duplicate source id');
  if (dataset.registryVersion !== registry.version) {
    add('*', `dataset expects registry ${dataset.registryVersion}, got ${registry.version}`);
  }
  const traits = new Set<string>(registry.traits.map((t) => t.id));
  const seenSpecies = new Set<string>();
  const seenDex = new Set<number>();

  for (const p of dataset.profiles) {
    const s = p.speciesId;
    if (!SLUG.test(s)) add(s, 'species id is not a lowercase slug');
    if (!Number.isInteger(p.nationalDex) || p.nationalDex < 1) add(s, 'invalid National Pokédex number');
    if (seenSpecies.has(s)) add(s, 'duplicate species: one candidate per species');
    if (seenDex.has(p.nationalDex)) add(s, 'duplicate National Pokédex number');
    seenSpecies.add(s);
    seenDex.add(p.nationalDex);

    const evidence = new Map(p.evidence.map((e) => [e.id, e]));
    if (evidence.size !== p.evidence.length) add(s, 'duplicate evidence id');
    const formIds = new Set(p.forms.map((f) => f.formId));
    for (const e of p.evidence) {
      if (e.sourceIds.length === 0) add(s, `${e.id}: evidence without a source`);
      for (const src of e.sourceIds) if (!sources.has(src)) add(s, `${e.id}: unknown source ${src}`);
      if (e.scope !== 'species' && !formIds.has(e.scope)) add(s, `${e.id}: unknown form scope`);
      if (e.kind === 'editorial-interpretation') {
        if (e.basedOn.length === 0) add(s, `${e.id}: interpretation rests on nothing`);
        for (const b of e.basedOn) {
          const base = evidence.get(b);
          if (!base) add(s, `${e.id}: rests on unknown evidence ${b}`);
          else if (base.kind === 'editorial-interpretation') {
            add(s, `${e.id}: rests on another interpretation, not on a fact or observation`);
          }
        }
      } else if (e.basedOn.length > 0) {
        add(s, `${e.id}: only interpretations rest on other evidence`);
      }
    }

    const mapped = new Set<string>();
    for (const m of p.traitMappings) {
      if (!traits.has(m.traitId)) add(s, `mapping to unknown trait ${m.traitId}`);
      if (mapped.has(m.traitId)) add(s, `duplicate mapping ${m.traitId}`);
      mapped.add(m.traitId);
      if (!Number.isFinite(m.affinity) || m.affinity < -1 || m.affinity > 1) {
        add(s, `${m.traitId}: affinity out of [-1, 1]`);
      }
      if (m.evidenceIds.length === 0) add(s, `${m.traitId}: mapping without evidence`);
      const cited = m.evidenceIds.map((id) => evidence.get(id));
      if (cited.some((e) => !e)) add(s, `${m.traitId}: cites unknown evidence`);
      // Species First, Forms Aware: a form-only fact cannot carry a species-wide mapping alone.
      if (cited.length > 0 && cited.every((e) => e && e.scope !== 'species')) {
        add(s, `${m.traitId}: species mapping rests only on form-specific evidence`);
      }
    }

    for (const f of p.forms) {
      for (const id of f.evidenceIds) {
        if (evidence.get(id)?.scope !== f.formId) add(s, `${f.formId}: cites evidence outside the form`);
      }
    }

    if (p.editorialState === 'pilot-approved' && !p.review) {
      add(s, 'pilot-approved without a recorded review');
    }
    if (p.editorialState === 'pilot-approved' && p.traitMappings.length === 0) {
      add(s, 'pilot-approved without any trait mapping');
    }
  }
  return issues;
}
