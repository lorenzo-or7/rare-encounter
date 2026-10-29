import type { QuestionArt } from './answer-art';
import type { Brand } from './brand';
import type { CategoryId } from './categories';
import type { LocalizedText } from './localized';
import type { TraitId } from './traits';

/** Stable, versioned IDs. Answers reference IDs, never display text. */
export type QuestionId = Brand<string, 'QuestionId'>;
export type AnswerId = Brand<string, 'AnswerId'>;
export type QuestionBankVersion = Brand<string, 'QuestionBankVersion'>;

export type QuestionRole = 'fundamental' | 'adaptive';
export type QuestionFormat = 'text' | 'photo' | 'icon-text';

export interface MediaRef {
  readonly src: string;
  readonly alt: LocalizedText;
}

export interface AnswerOption {
  readonly id: AnswerId;
  readonly label: LocalizedText;
  readonly media?: MediaRef;
  /** Signed contributions toward trait dimensions; magnitude rules are defined in Phase 04. */
  readonly effects: Readonly<Partial<Record<TraitId, number>>>;
}

export interface Question {
  readonly id: QuestionId;
  readonly revision: number;
  readonly category: CategoryId;
  readonly role: QuestionRole;
  readonly format: QuestionFormat;
  /** Image questions only: the shared ratio and comparison style of the four images. */
  readonly art?: QuestionArt;
  readonly prompt: LocalizedText;
  readonly options: readonly AnswerOption[];
}

export interface QuestionBank {
  readonly version: QuestionBankVersion;
  readonly questions: readonly Question[];
}
