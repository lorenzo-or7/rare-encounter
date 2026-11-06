import type { ModeId } from '../../domain/modes';
import type { QuestionSource } from '../../domain/question-source';
import type { QuestionId } from '../../domain/questions';
import type { QuizSession } from '../../domain/session';
import { seededRandom } from './journey';

/**
 * Builds a finished session through the source exactly as the quiz does: the sequence comes
 * from `start(mode, sessionId)`, and after every answer `reconcile` decides what follows.
 * `choose` returns the option index for each question.
 */
export function simulateSession(
  source: QuestionSource,
  mode: ModeId,
  sessionId: string,
  choose: (questionId: QuestionId, index: number) => number,
): QuizSession {
  let s: QuizSession = {
    id: sessionId,
    mode,
    status: 'in-progress',
    startedAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
    catalogVersion: source.catalogVersion,
    bankVersion: source.bankVersion,
    questionIds: source.start(mode, sessionId),
    answers: {},
    cursor: 0,
    revision: 0,
  };
  for (let i = 0; i < mode; i++) {
    const id = s.questionIds[i];
    const q = id ? source.question(id) : undefined;
    if (!id || !q) throw new Error(`simulate: missing question at ${String(i)}`);
    const o = q.options[choose(id, i)];
    if (!o) throw new Error(`simulate: bad option for ${id}`);
    const answers = { ...s.answers, [id]: { questionId: id, answerId: o.id, answeredAt: s.startedAt } };
    const next = source.reconcile ? [...source.reconcile({ ...s, answers })] : s.questionIds;
    for (let k = 0; k <= i; k++) if (next[k] !== s.questionIds[k]) throw new Error('simulate: reconcile broke the contract');
    s = { ...s, answers, questionIds: next, cursor: i + 1, revision: i + 1 };
  }
  return s;
}

/** A random person: every answer uniformly at random, reproducible from the seed. */
export function randomSession(source: QuestionSource, mode: ModeId, seed: number): QuizSession {
  const rnd = seededRandom(seed);
  return simulateSession(source, mode, `sim-${String(mode)}-${String(seed)}`, () => Math.floor(rnd() * 4));
}

/** The option index chosen for each question, in order: a compact, replayable witness. */
export const answerTrail = (session: QuizSession, source: QuestionSource): string =>
  session.questionIds
    .map((id) => {
      const q = source.question(id);
      const a = session.answers[id]?.answerId;
      return String(q?.options.findIndex((o) => o.id === a) ?? -1);
    })
    .join('');

/** Replays a trail: the same session id and the same option indices. */
export const replayTrail = (source: QuestionSource, mode: ModeId, sessionId: string, trail: string) =>
  simulateSession(source, mode, sessionId, (_, i) => Number(trail[i]));
