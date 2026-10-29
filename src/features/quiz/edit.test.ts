import type { QuestionSource } from '../../domain/question-source';
import type { AnswerId, QuestionId } from '../../domain/questions';
import type { QuizSession } from '../../domain/session';
import { ADAPTIVE_FIXTURE } from '../../test/fixtures/adaptive-source';
import { applyEdit, firstUnansweredIndex } from './edit';
import { answeredCount, createSession } from './flow';
import { PREVIEW_SOURCE } from './preview/preview-bank';

const AT = '2026-10-28T12:00:00.000Z';
const q = (s: string) => s as QuestionId;
const a = (s: string) => s as AnswerId;

/** Answers questions in order with the given answers ('a' unless listed). */
function answered(source: QuestionSource, count: number, choices: Record<string, string> = {}) {
  let s: QuizSession = createSession(30, source, 's1', AT);
  for (let i = 0; i < count; i++) {
    const id = s.questionIds[i] as QuestionId;
    const answerId = a(choices[id] ?? 'a');
    const next = applyEdit(s, id, answerId, AT, source).session;
    s = next;
  }
  return s;
}

describe('applyEdit', () => {
  it('without adaptive picks, only the answer changes', () => {
    const s = answered(PREVIEW_SOURCE, 5);
    const target = s.questionIds[1] as QuestionId;
    const out = applyEdit(s, target, a('other'), AT, PREVIEW_SOURCE);
    expect(out.invalidated).toEqual([]);
    expect(out.sequenceChanged).toBe(false);
    expect(out.session.questionIds).toEqual(s.questionIds);
    expect(out.session.answers[target]?.answerId).toBe('other');
    expect(answeredCount(out.session)).toBe(5);
  });

  it('clears only the answers that depended on the edited one and keeps the rest', () => {
    // f01…f06 and xa1, xa2 (f02 = "a"), then f07, f08.
    const s = answered(ADAPTIVE_FIXTURE, 10);
    expect(s.questionIds.slice(6, 8)).toEqual([q('xa1'), q('xa2')]);

    const out = applyEdit(s, q('f02'), a('b'), AT, ADAPTIVE_FIXTURE);
    expect(out.invalidated).toEqual([q('xa1'), q('xa2')]);
    expect(out.sequenceChanged).toBe(true);
    expect(out.session.questionIds.slice(6, 8)).toEqual([q('xb1'), q('xb2')]);
    // Still valid: everything else that was answered, f07 and f08 included.
    for (const kept of ['f01', 'f03', 'f04', 'f05', 'f06', 'f07', 'f08']) {
      expect(out.session.answers[kept]).toBeDefined();
    }
    expect(out.session.answers['f02']?.answerId).toBe('b');
    expect(out.session.answers['xa1']).toBeUndefined();
    // Progress, answers and sequence agree: 8 of 10 answers remain, next stop is xb1.
    expect(answeredCount(out.session)).toBe(8);
    expect(out.session.cursor).toBe(6);
    expect(firstUnansweredIndex(out.session)).toBe(6);
  });

  it('changes later unanswered picks without clearing anything', () => {
    const s = answered(ADAPTIVE_FIXTURE, 5);
    const out = applyEdit(s, q('f04'), a('b'), AT, ADAPTIVE_FIXTURE);
    expect(out.invalidated).toEqual([]);
    expect(out.sequenceChanged).toBe(true);
    expect(out.session.questionIds.slice(22, 24)).toEqual([q('yb1'), q('yb2')]);
    expect(answeredCount(out.session)).toBe(5);
  });

  it('re-choosing the same answer changes nothing in the sequence', () => {
    const s = answered(ADAPTIVE_FIXTURE, 10);
    const out = applyEdit(s, q('f02'), a('a'), AT, ADAPTIVE_FIXTURE);
    expect(out.invalidated).toEqual([]);
    expect(out.sequenceChanged).toBe(false);
  });

  it('refuses a source that breaks the contract, so nothing inconsistent is stored', () => {
    const s = answered(ADAPTIVE_FIXTURE, 3);
    const broken = (ids: (seq: readonly QuestionId[]) => QuestionId[]): QuestionSource => ({
      ...ADAPTIVE_FIXTURE,
      reconcile: (session) => ids(session.questionIds),
    });
    const edit = (src: QuestionSource) => () => applyEdit(s, q('f02'), a('b'), AT, src);
    expect(edit(broken((seq) => seq.slice(1)))).toThrow(/length/);
    expect(edit(broken((seq) => [...seq.slice(0, 29), q('f01')]))).toThrow(/repeated/);
    expect(edit(broken((seq) => [q('zz'), ...seq.slice(1)]))).toThrow(/before the edit/);
  });
});
