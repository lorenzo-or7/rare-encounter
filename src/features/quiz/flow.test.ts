import type { AnswerId, QuestionId } from '../../domain/questions';
import type { QuizSession } from '../../domain/session';
import {
  answeredCount,
  createSession,
  initialQuizState,
  quizReducer,
  type QuizState,
} from './flow';
import { PREVIEW_SOURCE } from './preview/preview-bank';

const NOW = '2026-10-28T10:00:00.000Z';
const answer = 'plans-enjoy' as AnswerId;

const start = (): QuizState => initialQuizState(createSession(30, PREVIEW_SOURCE, 's1', NOW));
const at = (s: QuizState, i: number) => s.session.questionIds[i] as QuestionId;

/** What the store hands back after a committed save. */
function stored(state: QuizState, answerId: AnswerId): QuizSession {
  const questionId = at(state, state.index);
  return {
    ...state.session,
    answers: { ...state.session.answers, [questionId]: { questionId, answerId, answeredAt: NOW } },
    cursor: state.index + 1,
  };
}

describe('quiz flow', () => {
  it('starts a session with the mode length, nothing answered, nothing selected', () => {
    const s = start();
    expect(s.session.questionIds).toHaveLength(30);
    expect(s.status).toBe('answering');
    expect(s.index).toBe(0);
    expect(s.pending).toBeNull();
  });

  it('advances only after the save is confirmed', () => {
    let s = quizReducer(start(), { type: 'select', questionId: at(start(), 0), answerId: answer });
    expect(s.status).toBe('saving');
    expect(s.index).toBe(0);
    s = quizReducer(s, { type: 'saved', session: stored(s, answer) });
    expect(s.status).toBe('answering');
    expect(s.index).toBe(1);
    expect(s.direction).toBe(1);
    expect(answeredCount(s.session)).toBe(1);
  });

  it('ignores a second selection while saving (double tap)', () => {
    const first = quizReducer(start(), { type: 'select', questionId: at(start(), 0), answerId: answer });
    const second = quizReducer(first, {
      type: 'select',
      questionId: at(first, 0),
      answerId: 'plans-new' as AnswerId,
    });
    expect(second).toBe(first);
  });

  it('ignores a selection from a question that is no longer on screen', () => {
    const s = start();
    expect(quizReducer(s, { type: 'select', questionId: at(s, 1), answerId: answer })).toBe(s);
  });

  it('keeps the answer and the question when a save fails, then retries', () => {
    let s = quizReducer(start(), { type: 'select', questionId: at(start(), 0), answerId: answer });
    s = quizReducer(s, { type: 'save-failed' });
    expect(s.status).toBe('save-error');
    expect(s.index).toBe(0);
    expect(s.pending).toBe(answer);
    expect(quizReducer(s, { type: 'back' })).toBe(s);
    s = quizReducer(s, { type: 'retry' });
    expect(s.status).toBe('saving');
    expect(s.pending).toBe(answer);
  });

  it('a late "saved" after a failure is not applied', () => {
    let s = quizReducer(start(), { type: 'select', questionId: at(start(), 0), answerId: answer });
    s = quizReducer(s, { type: 'save-failed' });
    expect(quizReducer(s, { type: 'saved', session: stored(s, answer) })).toBe(s);
  });

  it('goes back with the reverse direction and forward only over answered questions', () => {
    let s = quizReducer(start(), { type: 'select', questionId: at(start(), 0), answerId: answer });
    s = quizReducer(s, { type: 'saved', session: stored(s, answer) });
    expect(quizReducer(s, { type: 'forward' })).toBe(s);
    s = quizReducer(s, { type: 'back' });
    expect(s.index).toBe(0);
    expect(s.direction).toBe(-1);
    expect(quizReducer(s, { type: 'back' })).toBe(s);
    s = quizReducer(s, { type: 'forward' });
    expect(s.index).toBe(1);
    expect(s.direction).toBe(1);
  });

  it('completes after the last answer is saved', () => {
    let s = start();
    for (let i = 0; i < 30; i++) {
      s = quizReducer(s, { type: 'select', questionId: at(s, s.index), answerId: answer });
      s = quizReducer(s, { type: 'saved', session: stored(s, answer) });
    }
    expect(s.status).toBe('complete');
    expect(answeredCount(s.session)).toBe(30);
  });
});
