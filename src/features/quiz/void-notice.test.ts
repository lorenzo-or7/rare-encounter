import { VOID_ANSWER, type AnswerId, type QuestionId } from '../../domain/questions';
import type { QuizSession } from '../../domain/session';
import { markNoticeShown, readShownNotices, voidRunBefore } from './void-notice';

const ids = Array.from({ length: 10 }, (_, i) => `q${String(i)}` as QuestionId);
const session = (answers: readonly (string | null)[]): QuizSession => ({
  id: 's-void',
  mode: 30,
  status: 'in-progress',
  startedAt: 'x',
  updatedAt: 'x',
  catalogVersion: 'c' as QuizSession['catalogVersion'],
  bankVersion: 'b' as QuizSession['bankVersion'],
  questionIds: ids,
  answers: Object.fromEntries(
    answers.flatMap((a, i) => {
      const id = ids[i];
      return a && id ? [[id, { questionId: id, answerId: a as AnswerId, answeredAt: 'x' }]] : [];
    }),
  ),
  cursor: answers.length,
  revision: 0,
});
const V = VOID_ANSWER;

describe('void notice: three passes in a row', () => {
  it('stays quiet for one or two passes', () => {
    expect(voidRunBefore(session([V]), 1)).toBeNull();
    expect(voidRunBefore(session(['a', V, V]), 3)).toBeNull();
  });

  it('comes up at three, and keeps the same identity at four or more', () => {
    expect(voidRunBefore(session([V, V, V]), 3)).toBe('q0');
    expect(voidRunBefore(session([V, V, V, V, V]), 5)).toBe('q0');
  });

  it('a real answer ends the run; a new run of three is a new notice', () => {
    expect(voidRunBefore(session([V, V, V, 'a']), 4)).toBeNull();
    expect(voidRunBefore(session([V, V, V, 'a', V, V, V]), 7)).toBe('q4');
  });

  it('follows edits: changing a pass back to an answer breaks the run', () => {
    expect(voidRunBefore(session(['a', V, 'b', V]), 4)).toBeNull();
    expect(voidRunBefore(session(['a', V, V, V]), 4)).toBe('q1');
  });

  it('remembers shown notices per session, across reloads', () => {
    localStorage.clear();
    expect(readShownNotices('s-void').size).toBe(0);
    markNoticeShown('s-void', 'q0');
    markNoticeShown('s-void', 'q0');
    expect([...readShownNotices('s-void')]).toEqual(['q0']);
    expect(readShownNotices('other').size).toBe(0);
  });
});
