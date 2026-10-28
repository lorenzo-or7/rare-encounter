import type { CatalogVersion } from './catalog';
import type { ModeId } from './modes';
import type { AnswerId, QuestionBankVersion, QuestionId } from './questions';

export type SessionStatus = 'in-progress' | 'paused' | 'completed';

export interface AnswerRecord {
  readonly questionId: QuestionId;
  readonly answerId: AnswerId;
  readonly answeredAt: string;
}

export interface QuizSession {
  readonly id: string;
  readonly mode: ModeId;
  readonly status: SessionStatus;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly catalogVersion: CatalogVersion;
  readonly bankVersion: QuestionBankVersion;
  /** Questions selected so far, in presentation order (adaptive picks are appended). */
  readonly questionIds: readonly QuestionId[];
  readonly answers: Readonly<Record<string, AnswerRecord>>;
  /** Index into questionIds of the question currently shown. */
  readonly cursor: number;
}
