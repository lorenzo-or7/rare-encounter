import type { ModeId } from '../../domain/modes';
import type { QuestionSource } from '../../domain/question-source';
import type { AnswerId, QuestionId } from '../../domain/questions';
import type { QuizSession } from '../../domain/session';

/**
 * Quiz flow: a React-independent state machine.
 *
 *   answering --select--> saving --saved--> answering (next question) | complete
 *                            |
 *                            +--save-failed--> save-error --retry | select--> saving
 *
 * An answer only advances once its save has committed (`saved` carries the stored
 * session). While a save runs nothing else is accepted, and a selection that belongs to a
 * question no longer on screen (one still sliding away) is ignored.
 */

export type QuizStatus = 'answering' | 'saving' | 'save-error' | 'complete';
export type Direction = 1 | -1;

export interface QuizState {
  readonly session: QuizSession;
  /** Index into `session.questionIds` of the question on screen. */
  readonly index: number;
  readonly status: QuizStatus;
  /** The answer being saved, or the one whose save failed. */
  readonly pending: AnswerId | null;
  /** Horizontal Flow direction of the last move: forward 1, back -1. */
  readonly direction: Direction;
}

export type QuizEvent =
  | { readonly type: 'select'; readonly questionId: QuestionId; readonly answerId: AnswerId }
  | { readonly type: 'saved'; readonly session: QuizSession }
  | { readonly type: 'save-failed' }
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
    questionIds: source.start(mode),
    answers: {},
    cursor: 0,
  };
}

export const totalQuestions = (s: QuizSession): number => s.questionIds.length;
export const answeredCount = (s: QuizSession): number => Object.keys(s.answers).length;
export const isAnswered = (s: QuizSession, id: QuestionId): boolean => id in s.answers;

export function currentQuestionId(state: QuizState): QuestionId | undefined {
  return state.session.questionIds[state.index];
}

export function initialQuizState(session: QuizSession): QuizState {
  const total = totalQuestions(session);
  const index = Math.min(session.cursor, total);
  return {
    session,
    index,
    status: index >= total ? 'complete' : 'answering',
    pending: null,
    direction: 1,
  };
}

export function quizReducer(state: QuizState, event: QuizEvent): QuizState {
  switch (event.type) {
    case 'select': {
      const accepting = state.status === 'answering' || state.status === 'save-error';
      if (!accepting || event.questionId !== currentQuestionId(state)) return state;
      return { ...state, status: 'saving', pending: event.answerId };
    }
    case 'saved': {
      if (state.status !== 'saving') return state;
      const index = state.index + 1;
      return {
        session: event.session,
        index,
        status: index >= totalQuestions(event.session) ? 'complete' : 'answering',
        pending: null,
        direction: 1,
      };
    }
    case 'save-failed':
      return state.status === 'saving' ? { ...state, status: 'save-error' } : state;
    case 'retry':
      return state.status === 'save-error' && state.pending ? { ...state, status: 'saving' } : state;
    case 'back':
      if (state.status !== 'answering' || state.index === 0) return state;
      return { ...state, index: state.index - 1, direction: -1 };
    case 'forward': {
      const id = currentQuestionId(state);
      if (state.status !== 'answering' || !id || !isAnswered(state.session, id)) return state;
      const index = state.index + 1;
      return {
        ...state,
        index,
        status: index >= totalQuestions(state.session) ? 'complete' : 'answering',
        direction: 1,
      };
    }
  }
}
