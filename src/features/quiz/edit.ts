import type { QuestionSource } from '../../domain/question-source';
import type { AnswerId, QuestionId } from '../../domain/questions';
import type { AnswerRecord, QuizSession } from '../../domain/session';

export interface EditOutcome {
  /** The session to store: new answer, reconciled sequence, cleared dependants, cursor. */
  readonly session: QuizSession;
  /** Answered questions whose answers the edit clears (they no longer belong to the path). */
  readonly invalidated: readonly QuestionId[];
  /** True when the question sequence itself changed. */
  readonly sequenceChanged: boolean;
}

/** Index of the first unanswered question, or the length when every question is answered. */
export function firstUnansweredIndex(session: QuizSession): number {
  const i = session.questionIds.findIndex((id) => !(id in session.answers));
  return i === -1 ? session.questionIds.length : i;
}

/**
 * Changes one answer and keeps the session consistent. The source decides which later
 * questions are still valid (its `reconcile`); everything still valid keeps its answer,
 * and only answers to questions that left the sequence are cleared. React-independent.
 *
 * Throws when the source breaks the contract, so an inconsistent session is never stored.
 */
export function applyEdit(
  session: QuizSession,
  questionId: QuestionId,
  answerId: AnswerId,
  at: string,
  source: QuestionSource,
): EditOutcome {
  const index = session.questionIds.indexOf(questionId);
  if (index === -1) throw new Error(`Question ${questionId} is not part of session ${session.id}`);

  const record: AnswerRecord = { questionId, answerId, answeredAt: at };
  const draft: QuizSession = { ...session, answers: { ...session.answers, [questionId]: record } };
  const ids = source.reconcile ? [...source.reconcile(draft)] : [...session.questionIds];
  assertSequence(session.questionIds, ids, index);

  const kept = new Set(ids);
  const removed = session.questionIds.filter((id) => !kept.has(id));
  const answers: Record<string, AnswerRecord> = {};
  for (const [id, answer] of Object.entries(draft.answers)) {
    if (kept.has(id as QuestionId)) answers[id] = answer;
  }

  const next: QuizSession = {
    ...draft,
    status: 'in-progress',
    questionIds: ids,
    answers,
    updatedAt: at,
  };
  return {
    session: { ...next, cursor: firstUnansweredIndex(next) },
    invalidated: removed.filter((id) => id in session.answers),
    sequenceChanged: ids.some((id, i) => id !== session.questionIds[i]),
  };
}

function assertSequence(before: readonly QuestionId[], after: readonly QuestionId[], edited: number) {
  if (after.length !== before.length) throw new Error('reconcile changed the session length');
  if (new Set(after).size !== after.length) throw new Error('reconcile repeated a question');
  for (let i = 0; i <= edited; i++) {
    if (after[i] !== before[i]) throw new Error('reconcile changed questions before the edit');
  }
}
