import { CATEGORY_IDS, type CategoryId } from '../domain/categories';
import type { LocalizedText } from '../domain/localized';
import type { AnswerId, Question, QuestionId } from '../domain/questions';
import type { TraitId } from '../domain/traits';

/**
 * Trait Registry (ME-01). The vocabulary every question effect and species mapping must use.
 *
 * The six dimensions are the approved categories (CATEGORY_IDS, where "Environment" is
 * `environments`). No trait vocabulary is approved yet: the registry is a contract, and the
 * only registries in the repository are empty or clearly marked test fixtures.
 */
export type Dimension = CategoryId;
export const DIMENSIONS: readonly Dimension[] = CATEGORY_IDS;

export type EditorialStatus = 'draft' | 'approved';

/** Overlaps: shares meaning (must not be counted twice). Opposes: mutually exclusive poles. */
export type TraitRelationKind = 'overlaps' | 'opposes' | 'refines';

export interface TraitRelation {
  readonly kind: TraitRelationKind;
  readonly target: TraitId;
}

/** An answer that signals the trait: primary (direct) or secondary (supporting). */
export interface TraitSignal {
  readonly questionId: QuestionId;
  readonly answerId: AnswerId;
  readonly strength: 'primary' | 'secondary';
}

export interface TraitRecord {
  /** Stable, namespaced and lowercase, e.g. `values.loyalty`; never reused for another meaning. */
  readonly id: TraitId;
  readonly dimension: Dimension;
  readonly label: LocalizedText | null;
  readonly definition: LocalizedText | null;
  readonly signals: readonly TraitSignal[];
  readonly relations: readonly TraitRelation[];
  /** What this trait must never be used to claim about a person or a species. */
  readonly evidenceBoundary: string | null;
  readonly ambiguities: readonly string[];
  /** Registry version in which the trait first appeared. */
  readonly introducedIn: string;
  readonly status: EditorialStatus;
}

export interface TraitRegistry {
  readonly version: string;
  readonly status: EditorialStatus;
  readonly traits: readonly TraitRecord[];
}

export type RegistryIssue =
  | { readonly kind: 'duplicate-id'; readonly trait: string }
  | { readonly kind: 'bad-id'; readonly trait: string }
  | { readonly kind: 'id-dimension-mismatch'; readonly trait: string }
  | { readonly kind: 'unknown-relation-target'; readonly trait: string; readonly target: string }
  | { readonly kind: 'self-relation'; readonly trait: string }
  | { readonly kind: 'unmirrored-opposition'; readonly trait: string; readonly target: string }
  | { readonly kind: 'incomplete-approved-trait'; readonly trait: string }
  | { readonly kind: 'draft-trait-in-approved-registry'; readonly trait: string }
  | { readonly kind: 'duplicate-signal'; readonly trait: string };

const ID_PATTERN = /^[a-z]+\.[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateTraitRegistry(registry: TraitRegistry): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const byId = new Map<string, TraitRecord>();
  for (const t of registry.traits) {
    if (byId.has(t.id)) issues.push({ kind: 'duplicate-id', trait: t.id });
    byId.set(t.id, t);
  }
  for (const t of registry.traits) {
    if (!ID_PATTERN.test(t.id)) issues.push({ kind: 'bad-id', trait: t.id });
    else if (t.id.split('.')[0] !== t.dimension) {
      issues.push({ kind: 'id-dimension-mismatch', trait: t.id });
    }
    for (const r of t.relations) {
      if (r.target === t.id) {
        issues.push({ kind: 'self-relation', trait: t.id });
        continue;
      }
      const target = byId.get(r.target);
      if (!target) {
        issues.push({ kind: 'unknown-relation-target', trait: t.id, target: r.target });
      } else if (
        r.kind === 'opposes' &&
        !target.relations.some((b) => b.kind === 'opposes' && b.target === t.id)
      ) {
        issues.push({ kind: 'unmirrored-opposition', trait: t.id, target: r.target });
      }
    }
    if (t.status === 'approved' && (!t.label || !t.definition || !t.evidenceBoundary)) {
      issues.push({ kind: 'incomplete-approved-trait', trait: t.id });
    }
    if (registry.status === 'approved' && t.status !== 'approved') {
      issues.push({ kind: 'draft-trait-in-approved-registry', trait: t.id });
    }
    const keys = t.signals.map((s) => `${s.questionId}/${s.answerId}`);
    if (new Set(keys).size !== keys.length) issues.push({ kind: 'duplicate-signal', trait: t.id });
  }
  return issues;
}

export type BankRegistryIssue =
  | { readonly kind: 'unknown-trait-in-effect'; readonly question: string; readonly trait: string }
  | { readonly kind: 'effect-out-of-range'; readonly question: string; readonly trait: string }
  | { readonly kind: 'signal-without-answer'; readonly trait: string; readonly signal: string }
  | { readonly kind: 'signal-without-effect'; readonly trait: string; readonly signal: string };

/**
 * Cross-checks question effects against the registry: every effect names a registered trait
 * with a value in [-1, 1], and every declared signal points at an answer that carries an
 * effect on that trait.
 */
export function checkQuestionsAgainstRegistry(
  questions: readonly Question[],
  registry: TraitRegistry,
): BankRegistryIssue[] {
  const issues: BankRegistryIssue[] = [];
  const known = new Set<string>(registry.traits.map((t) => t.id));
  const answers = new Map<string, Readonly<Partial<Record<TraitId, number>>>>();
  for (const q of questions) {
    for (const o of q.options) {
      answers.set(`${q.id}/${o.id}`, o.effects);
      for (const [trait, value] of Object.entries(o.effects) as [string, number][]) {
        if (!known.has(trait)) issues.push({ kind: 'unknown-trait-in-effect', question: q.id, trait });
        if (!Number.isFinite(value) || value < -1 || value > 1) {
          issues.push({ kind: 'effect-out-of-range', question: q.id, trait });
        }
      }
    }
  }
  for (const t of registry.traits) {
    for (const s of t.signals) {
      const key = `${s.questionId}/${s.answerId}`;
      const effects = answers.get(key);
      if (!effects) issues.push({ kind: 'signal-without-answer', trait: t.id, signal: key });
      else if (effects[t.id] === undefined) {
        issues.push({ kind: 'signal-without-effect', trait: t.id, signal: key });
      }
    }
  }
  return issues;
}

/** The registry shipped today: a contract with no approved vocabulary in it. */
export const EMPTY_REGISTRY: TraitRegistry = { version: 'registry-0', status: 'draft', traits: [] };
