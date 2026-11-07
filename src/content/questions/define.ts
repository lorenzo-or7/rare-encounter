import type { QuestionArt } from '../../domain/answer-art';
import type { CategoryId } from '../../domain/categories';
import type { LocalizedText } from '../../domain/localized';
import type { AnswerId, AnswerOption, Question, QuestionFormat, QuestionId } from '../../domain/questions';
import type { TraitId } from '../../domain/traits';

/**
 * Authoring helpers for the question bank. Content files stay compact and readable:
 *
 *   q('pe-001', 'f', ['pt-BR', 'en', 'es'], [
 *     ['curious', 'pt-BR', 'en', 'es'],
 *     ['serene', 'pt-BR', 'en', 'es', 'values.harmony'],   // optional secondary trait
 *     …four options…
 *   ])
 *
 * The first trait of an option is its primary trait (short key inside the question's
 * category); the optional fifth item is a secondary trait (full id, any category).
 * Primary effects weigh 1, secondary 0.5.
 */

export type T3 = readonly [ptBR: string, en: string, es: string];
export type OptionDef = readonly [primary: string, ptBR: string, en: string, es: string, secondary?: string];

/** Editorial state of the whole bank: written for this version, awaiting Or7 review. */
export type EditorialState = 'candidate' | 'reviewed' | 'approved';

export interface QuestionDef {
  readonly id: string;
  readonly role: 'f' | 'a';
  readonly prompt: T3;
  readonly options: readonly OptionDef[];
  readonly format?: QuestionFormat;
  /** Icon-text: one Hugeicons name per option (see option-icons.ts). Image: one URL each. */
  readonly media?: readonly string[];
  /** Image questions: alternative text for each image. */
  readonly alt?: readonly T3[];
  readonly art?: QuestionArt;
  /** Questions in the same group are never shown together in one journey. */
  readonly group?: string;
  /** Content revision: raised when the wording changes (same id, same traits per option). */
  readonly revision?: number;
}

export const q = (
  id: string,
  role: 'f' | 'a',
  prompt: T3,
  options: readonly OptionDef[],
  extra: Omit<QuestionDef, 'id' | 'role' | 'prompt' | 'options'> = {},
): QuestionDef => ({ id, role, prompt, options, ...extra });

const L = ([ptBR, en, es]: T3): LocalizedText => ({ 'pt-BR': ptBR, en, es });

export interface BankQuestion extends Question {
  readonly group: string | null;
  readonly editorial: EditorialState;
}

/** Turns authoring definitions into domain questions. */
export function build(category: CategoryId, defs: readonly QuestionDef[]): BankQuestion[] {
  return defs.map((d) => {
    const format: QuestionFormat = d.format ?? 'text';
    const options: AnswerOption[] = d.options.map(([primary, ptBR, en, es, secondary], i) => {
      const effects: Partial<Record<TraitId, number>> = { [`${category}.${primary}`]: 1 };
      if (secondary) effects[secondary as TraitId] = 0.5;
      const src = d.media?.[i];
      const alt = d.alt?.[i];
      return {
        id: `${d.id}-${'abcd'[i] ?? String(i)}` as AnswerId,
        label: L([ptBR, en, es]),
        ...(src
          ? { media: { src: format === 'icon-text' ? `icon:${src}` : src, alt: L(alt ?? [ptBR, en, es]) } }
          : {}),
        effects,
      };
    });
    return {
      id: d.id as QuestionId,
      revision: d.revision ?? 1,
      category,
      role: d.role === 'f' ? 'fundamental' : 'adaptive',
      format,
      prompt: L(d.prompt),
      options,
      ...(d.art ? { art: d.art } : {}),
      group: d.group ?? null,
      editorial: 'candidate',
    };
  });
}
