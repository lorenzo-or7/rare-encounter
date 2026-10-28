import { useCallback, useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import type { QuestionSource } from '../../domain/question-source';
import type { AnswerId, QuestionId } from '../../domain/questions';
import type { QuizSession } from '../../domain/session';
import { SessionConflictError, type EncounterStore } from '../../storage/encounter-store';
import {
  clearSessionMarker,
  onSessionMarkerChange,
  writeSessionMarker,
} from '../../storage/session-marker';
import { applyEdit } from './edit';
import {
  answeredCount,
  currentQuestionId,
  initialQuizState,
  isAnswered,
  quizReducer,
  totalQuestions,
  type QuizState,
} from './flow';

/** Feedback window between choosing and advancing (approved range 250–350 ms). */
export const FEEDBACK_MS = 300;

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** Records the committed session in the localStorage pointer (after IndexedDB, never before). */
export function markSession(session: QuizSession): void {
  writeSessionMarker({
    sessionId: session.id,
    mode: session.mode,
    answered: answeredCount(session),
    total: totalQuestions(session),
    revision: session.revision,
    updatedAt: session.updatedAt,
  });
}

export interface QuizControls {
  readonly state: QuizState;
  readonly select: (questionId: QuestionId, answerId: AnswerId) => void;
  readonly confirmEdit: () => void;
  readonly cancelEdit: () => void;
  readonly retry: () => void;
  readonly back: () => void;
  readonly forward: () => void;
  /** Marks the session paused. Resolves once stored; rejects if it could not be confirmed. */
  readonly pause: () => Promise<void>;
  /** Deletes the session after the person confirmed it. */
  readonly startOver: () => Promise<void>;
}

/**
 * Connects the flow reducer to the store.
 * - An answer advances only once its IndexedDB transaction has committed and the feedback
 *   window has passed; a failed save keeps the question and the chosen answer on screen.
 * - Every write names the revision it expects, so a change made in another tab is refused
 *   instead of overwritten; the marker's storage event reports such changes right away.
 * - Changing an earlier answer goes through `applyEdit`; if later answers would be cleared,
 *   the person confirms first.
 * - A synchronous lock blocks a second save that arrives before React re-renders.
 */
export function useQuiz(
  store: EncounterStore,
  source: QuestionSource,
  session: QuizSession,
): QuizControls {
  const [state, dispatch] = useReducer(quizReducer, session, initialQuizState);
  const stateRef = useRef(state);
  // Synced before paint, so a press on the new question never reads the previous state.
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);
  const saving = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Another tab moved this session on (answered, paused, started over or started anew).
  useEffect(
    () =>
      onSessionMarkerChange((marker) => {
        const current = stateRef.current.session;
        if (!marker || marker.sessionId !== current.id || marker.revision > current.revision) {
          dispatch({ type: 'conflict' });
        }
      }),
    [],
  );

  const run = useCallback((write: () => Promise<QuizSession>) => {
    saving.current = true;
    Promise.all([write(), wait(FEEDBACK_MS)])
      .then(([stored]) => {
        markSession(stored);
        if (mounted.current) dispatch({ type: 'saved', session: stored });
      })
      .catch((error: unknown) => {
        if (!mounted.current) return;
        dispatch({ type: error instanceof SessionConflictError ? 'conflict' : 'save-failed' });
      })
      .finally(() => {
        saving.current = false;
      });
  }, []);

  const record = useCallback(
    (questionId: QuestionId, answerId: AnswerId) => {
      const { session: current, index } = stateRef.current;
      const answer = { questionId, answerId, answeredAt: new Date().toISOString() };
      run(() => store.recordAnswer(current.id, answer, index + 1, current.revision));
    },
    [run, store],
  );

  const select = useCallback(
    (questionId: QuestionId, answerId: AnswerId) => {
      const current = stateRef.current;
      const accepting = current.status === 'answering' || current.status === 'save-error';
      if (saving.current || !accepting || questionId !== currentQuestionId(current)) return;

      const previous = current.session.answers[questionId]?.answerId;
      if (previous !== undefined && previous !== answerId) {
        const outcome = applyEdit(
          current.session,
          questionId,
          answerId,
          new Date().toISOString(),
          source,
        );
        if (outcome.invalidated.length > 0) {
          dispatch({
            type: 'edit-requested',
            questionId,
            edit: { answerId, next: outcome.session, invalidated: outcome.invalidated.length },
          });
          return;
        }
        if (outcome.sequenceChanged) {
          dispatch({ type: 'select', questionId, answerId });
          run(() => store.updateSession(outcome.session, current.session.revision));
          return;
        }
      }
      dispatch({ type: 'select', questionId, answerId });
      record(questionId, answerId);
    },
    [record, run, source, store],
  );

  const confirmEdit = useCallback(() => {
    const current = stateRef.current;
    if (saving.current || current.status !== 'confirm-edit' || !current.edit) return;
    const { next } = current.edit;
    dispatch({ type: 'edit-confirm' });
    run(() => store.updateSession(next, current.session.revision));
  }, [run, store]);

  const cancelEdit = useCallback(() => {
    dispatch({ type: 'edit-cancel' });
  }, []);

  const retry = useCallback(() => {
    const current = stateRef.current;
    const questionId = currentQuestionId(current);
    if (saving.current || current.status !== 'save-error' || !current.pending || !questionId) return;
    const { edit } = current;
    dispatch({ type: 'retry' });
    if (edit) run(() => store.updateSession(edit.next, current.session.revision));
    else record(questionId, current.pending);
  }, [record, run, store]);

  const back = useCallback(() => {
    dispatch({ type: 'back' });
  }, []);
  const forward = useCallback(() => {
    dispatch({ type: 'forward' });
  }, []);

  const pause = useCallback(async () => {
    const current = stateRef.current.session;
    const stored = await store.updateSession(
      { ...current, status: 'paused', updatedAt: new Date().toISOString() },
      current.revision,
    );
    markSession(stored);
  }, [store]);

  const startOver = useCallback(async () => {
    await store.deleteSession(stateRef.current.session.id);
    clearSessionMarker();
  }, [store]);

  return { state, select, confirmEdit, cancelEdit, retry, back, forward, pause, startOver };
}

/** True when the question on screen already has a saved answer (Next is offered). */
export const canMoveForward = (state: QuizState): boolean => {
  const id = currentQuestionId(state);
  return state.status === 'answering' && id !== undefined && isAnswered(state.session, id);
};
