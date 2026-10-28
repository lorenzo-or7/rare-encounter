import type { Brand } from './brand';
import type { CategoryId } from './categories';

/**
 * Each eligible species carries exactly 48 editorial attributes.
 * The taxonomy itself is NOT approved yet, so trait IDs stay opaque;
 * nothing here names or invents individual traits.
 */
export const TRAIT_COUNT = 48;

export type TraitId = Brand<string, 'TraitId'>;

export interface TraitDefinition {
  readonly id: TraitId;
  readonly category: CategoryId;
}

/** Normalized trait intensities in [0, 1], keyed by trait ID. */
export type TraitVector = Readonly<Record<TraitId, number>>;

export type TraitVectorIssue =
  | { readonly kind: 'count'; readonly expected: number; readonly actual: number }
  | { readonly kind: 'range'; readonly trait: string; readonly value: number }
  | { readonly kind: 'unknown-trait'; readonly trait: string };

/** Structural validation only; carries no scoring semantics. */
export function validateTraitVector(
  vector: Readonly<Record<string, number>>,
  taxonomy: readonly TraitDefinition[],
): TraitVectorIssue[] {
  const issues: TraitVectorIssue[] = [];
  const known = new Set<string>(taxonomy.map((t) => t.id));
  const entries = Object.entries(vector);

  if (entries.length !== TRAIT_COUNT) {
    issues.push({ kind: 'count', expected: TRAIT_COUNT, actual: entries.length });
  }
  for (const [trait, value] of entries) {
    if (!known.has(trait)) issues.push({ kind: 'unknown-trait', trait });
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      issues.push({ kind: 'range', trait, value });
    }
  }
  return issues;
}
