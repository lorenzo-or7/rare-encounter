import type { Question } from './questions';

/**
 * Visual Answer Art System, Design Locked v1 (approved by Or7).
 *
 * Adaptive Art Ratio: 4:3 for landscapes, climate and atmospheric scenes; 1:1 for shapes,
 * palettes and materials. One ratio per question, shared by its four images.
 */
export type ArtRatio = '4:3' | '1:1';

/**
 * Context-Aware Hybrid: Balanced Variety for distinctly different places or environments;
 * Controlled Comparison for palettes, climate, textures and related alternatives. It guides
 * how the four images are produced so no option gets a visual advantage; the interface
 * renders both the same way.
 */
export type ArtComparison = 'balanced-variety' | 'controlled-comparison';

export interface QuestionArt {
  readonly ratio: ArtRatio;
  readonly comparison: ArtComparison;
}

/** Image questions present exactly four options, in a 2×2 grid at every width. */
export const ART_OPTION_COUNT = 4;

export type QuestionArtIssue =
  | { readonly kind: 'missing-art' }
  | { readonly kind: 'option-count'; readonly expected: number; readonly actual: number }
  | { readonly kind: 'missing-media'; readonly option: string }
  | { readonly kind: 'unexpected-art' };

/**
 * Structural check of a question against the art system. An option whose file later fails
 * to load is a runtime state (neutral fallback), not a data issue; an option with no image
 * reference at all is a data issue.
 */
export function validateQuestionArt(question: Question): QuestionArtIssue[] {
  if (question.format !== 'photo') {
    return question.art ? [{ kind: 'unexpected-art' }] : [];
  }
  const issues: QuestionArtIssue[] = [];
  if (!question.art) issues.push({ kind: 'missing-art' });
  if (question.options.length !== ART_OPTION_COUNT) {
    issues.push({
      kind: 'option-count',
      expected: ART_OPTION_COUNT,
      actual: question.options.length,
    });
  }
  for (const option of question.options) {
    if (!option.media?.src) issues.push({ kind: 'missing-media', option: option.id });
  }
  return issues;
}
