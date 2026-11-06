import type { AnswerId, Question } from '../domain/questions';
import type { TraitId } from '../domain/traits';
import type { Dimension, TraitRegistry } from './registry';

export interface AnsweredQuestion {
  readonly question: Question;
  readonly answerId: AnswerId;
}

export interface PersonSignal {
  readonly traitId: TraitId;
  readonly dimension: Dimension;
  /**
   * Preference in [-1, 1]: how much more (or less) often this trait was chosen than chance
   * would pick it, among the questions that offered it. 0 = no lean either way.
   */
  readonly value: number;
  /** How many times the trait was offered; small counts are shrunk toward 0. */
  readonly observations: number;
}

/**
 * Reads answers as preferences, not as raw counts: choosing a trait only says something
 * relative to the alternatives it competed with. A question with four options offers each
 * trait at a 1-in-4 chance; picking it more often than that is a lean toward it, picking it
 * less often is a lean away. Signed effects (fixtures) work the same way.
 */
export function preferenceSignals(
  answered: readonly AnsweredQuestion[],
  registry: TraitRegistry,
): PersonSignal[] {
  const dims = new Map(registry.traits.map((t) => [t.id as string, t.dimension]));
  // Per trait, summed over the questions that offered it: what was chosen, what a random
  // pick would give on average, and the highest and lowest values the options allowed.
  const acc = new Map<string, { chosen: number; mean: number; max: number; min: number; seen: number }>();
  for (const { question, answerId } of answered) {
    const traits = new Set(
      question.options.flatMap((o) => Object.keys(o.effects).filter((t) => dims.has(t))),
    );
    for (const trait of traits) {
      const values = question.options.map(
        (o) => (o.effects as Readonly<Record<string, number | undefined>>)[trait] ?? 0,
      );
      const chosen = question.options.findIndex((o) => o.id === answerId);
      const a = acc.get(trait) ?? { chosen: 0, mean: 0, max: 0, min: 0, seen: 0 };
      a.chosen += chosen >= 0 ? (values[chosen] ?? 0) : 0;
      a.mean += values.reduce((s, v) => s + v, 0) / (values.length || 1);
      a.max += Math.max(...values);
      a.min += Math.min(...values);
      a.seen += 1;
      acc.set(trait, a);
    }
  }
  return [...acc.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([trait, { chosen, mean, max, min, seen }]) => {
      const raw =
        chosen >= mean
          ? (chosen - mean) / Math.max(max - mean, 1e-9)
          : (chosen - mean) / Math.max(mean - min, 1e-9);
      const shrink = seen / (seen + 1);
      return {
        traitId: trait as TraitId,
        dimension: dims.get(trait) as Dimension,
        value: Math.max(-1, Math.min(1, raw)) * shrink,
        observations: seen,
      };
    });
}
