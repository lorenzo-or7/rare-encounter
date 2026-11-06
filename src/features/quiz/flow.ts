import type { ModeId } from '../../domain/modes';
import type { QuestionSource } from '../../domain/question-source';
import type { AnswerId, QuestionId } from '../../domain/questions';
import type { QuizSession } from '../../domain/session';
import { firstUnansweredIndex } from './edit';

/**
 * Quiz flow: a React-independent state machine.
 *
 *   answering --select--> saving --saved--> answering (next question) | complete
 *       |                    +--save-failed--> save-error --retry | select--> saving
 *       +--edit-requested--> confirm-edit --edit-confirm--> saving | --edit-cancel--> answering
 *   any --conflict--> conflict (another tab changed or removed the session: reload)
 *
 * An answer only advances once its save has committed (`saved` carries the stored
 * session). While a save runs nothing else is accepted, and a selection that belongs to a
 * question no longer on screen (one still sliding away) is ignored.
 */

export type QuizStatus =
  | 'answering'
  | 'saving'
  | 'save-error'
  | 'confirm-edit'
  | 'conflict'
  | 'complete';
export type Direction = 1 | -1;

/** An edit that clears later answers waits for the person to confirm it. */
export interface PendingEdit {
  readonly answerId: AnswerId;
  readonly next: QuizSession;
  readonly invalidated: number;
}

export interface QuizState {
  readonly session: QuizSession;
  /** Index into `session.questionIds` of the question on screen. */
  readonly index: number;
  readonly status: QuizStatus;
  /** The answer being saved, or the one whose save failed. */
  readonly pending: AnswerId | null;
  /** Set while an edit that clears answers is being confirmed or saved. */
  readonly edit: PendingEdit | null;
  /** Horizontal Flow direction of the last move: forward 1, back -1. */
  readonly direction: Direction;
}

export type QuizEvent =
  | { readonly type: 'select'; readonly questionId: QuestionId; readonly answerId: AnswerId }
  | {
      readonly type: 'edit-requested';
      readonly questionId: QuestionId;
      readonly edit: PendingEdit;
    }
  | { readonly type: 'edit-confirm' }
  | { readonly type: 'edit-cancel' }
  | { readonly type: 'saved'; readonly session: QuizSession }
  | { readonly type: 'save-failed' }
  | { readonly type: 'conflict' }
  | { readonly type: 'retry' }
  | { readonly type: 'back' }
  | { readonly type: 'forward' };

export function createSession(
  mode: ModeId,
  source: QuestionSource,
  id: string,
  now: string,
): QuizSession {
  return {
    id,
    mode,
    status: 'in-progress',
    startedAt: now,
    updatedAt: now,
    catalogVersion: source.catalogVersion,
    bankVersion: source.bankVersion,
    questionIds: source.start(mode, id),
    answers: {},
    cursor: 0,
    revision: 0,
  };
}

export const totalQuestions = (s: QuizSession): number => s.questionIds.length;
/** Answers that belong to the current sequence (the only ones that count as progress). */
export const answeredCount = (s: QuizSession): number =>
  s.questionIds.filter((id) => id in s.answers).length;
export const isAnswered = (s: QuizSession, id: QuestionId): boolean => id in s.answers;

export function currentQuestionId(state: QuizState): QuestionId | undefined {
  return state.session.questionIds[state.index];
}

/** A new or resumed session opens at its first unanswered question. */
export function initialQuizState(session: QuizSession): QuizState {
  const index = firstUnansweredIndex(session);
  return {
    session,
    index,
    status: index >= totalQuestions(session) ? 'complete' : 'answering',
    pending: null,
    edit: null,
    direction: 1,
  };
}

/** After a save: the next question in order, or the first gap an edit opened, or the end. */
function afterSave(session: QuizSession, index: number): Pick<QuizState, 'index' | 'status'> {
  const total = totalQuestions(session);
  if (index + 1 < total) return { index: index + 1, status: 'answering' };
  const gap = firstUnansweredIndex(session);
  return gap < total ? { index: gap, status: 'answering' } : { index: total, status: 'complete' };
}

const accepting = (s: QuizState) => s.status === 'answering' || s.status === 'save-error';

export function quizReducer(state: QuizState, event: QuizEvent): QuizState {
  switch (event.type) {
    case 'select':
      if (!accepting(state) || event.questionId !== currentQuestionId(state)) return state;
      return { ...state, status: 'saving', pending: event.answerId, edit: null };
    case 'edit-requested':
      if (!accepting(state) || event.questionId !== currentQuestionId(state)) return state;
      return { ...state, status: 'confirm-edit', pending: event.edit.answerId, edit: event.edit };
    case 'edit-confirm':
      return state.status === 'confirm-edit' ? { ...state, status: 'saving' } : state;
    case 'edit-cancel':
      return state.status === 'confirm-edit'
        ? { ...state, status: 'answering', pending: null, edit: null }
        : state;
    case 'saved':
      if (state.status !== 'saving') return state;
      return {
        session: event.session,
        ...afterSave(event.session, state.index),
        pending: null,
        edit: null,
        direction: 1,
      };
    case 'save-failed':
      return state.status === 'saving' ? { ...state, status: 'save-error' } : state;
    case 'conflict':
      return state.status === 'complete' ? state : { ...state, status: 'conflict' };
    case 'retry':
      return state.status === 'save-error' && state.pending ? { ...state, status: 'saving' } : state;
    case 'back':
      if (state.status !== 'answering' || state.index === 0) return state;
      return { ...state, index: state.index - 1, direction: -1 };
    case 'forward': {
      const id = currentQuestionId(state);
      if (state.status !== 'answering' || !id || !isAnswered(state.session, id)) return state;
      return { ...state, ...afterSave(state.session, state.index), direction: 1 };
    }
  }
}
