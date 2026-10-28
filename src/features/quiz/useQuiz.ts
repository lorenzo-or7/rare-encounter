import { useCallback, useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import type { AnswerId, QuestionId } from '../../domain/questions';
import type { QuizSession } from '../../domain/session';
import type { EncounterStore } from '../../storage/encounter-store';
import { currentQuestionId, initialQuizState, quizReducer, type QuizState } from './flow';

/** Feedback window between choosing and advancing (approved range 250–350 ms). */
export const FEEDBACK_MS = 300;

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export interface QuizControls {
  readonly state: QuizState;
  readonly select: (questionId: QuestionId, answerId: AnswerId) => void;
  readonly retry: () => void;
  readonly back: () => void;
  readonly forward: () => void;
}

/**
 * Connects the flow reducer to the store. An answer advances only when the IndexedDB
 * transaction has committed and the feedback window has passed; a failed save keeps the
 * question and the chosen answer on screen. A synchronous lock blocks a second save that
 * arrives before React re-renders (double clicks, key repeat).
 */
export function useQuiz(store: EncounterStore, session: QuizSession): QuizControls {
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

  const save = useCallback(
    (questionId: QuestionId, answerId: AnswerId, index: number) => {
      saving.current = true;
      const record = store.recordAnswer(
        stateRef.current.session.id,
        { questionId, answerId, answeredAt: new Date().toISOString() },
        index + 1,
      );
      Promise.all([record, wait(FEEDBACK_MS)])
        .then(([stored]) => {
          if (mounted.current) dispatch({ type: 'saved', session: stored });
        })
        .catch(() => {
          if (mounted.current) dispatch({ type: 'save-failed' });
        })
        .finally(() => {
          saving.current = false;
        });
    },
    [store],
  );

  const select = useCallback(
    (questionId: QuestionId, answerId: AnswerId) => {
      const current = stateRef.current;
      const accepting = current.status === 'answering' || current.status === 'save-error';
      if (saving.current || !accepting || questionId !== currentQuestionId(current)) return;
      dispatch({ type: 'select', questionId, answerId });
      save(questionId, answerId, current.index);
    },
    [save],
  );

  const retry = useCallback(() => {
    const current = stateRef.current;
    const questionId = currentQuestionId(current);
    if (saving.current || current.status !== 'save-error' || !current.pending || !questionId) return;
    dispatch({ type: 'retry' });
    save(questionId, current.pending, current.index);
  }, [save]);

  const back = useCallback(() => {
    dispatch({ type: 'back' });
  }, []);
  const forward = useCallback(() => {
    dispatch({ type: 'forward' });
  }, []);

  return { state, select, retry, back, forward };
}
