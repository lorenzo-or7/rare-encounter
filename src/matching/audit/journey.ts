import type { ModeId } from '../../domain/modes';
import type { QuestionSource } from '../../domain/question-source';
import type { AnswerId, Question, QuestionId } from '../../domain/questions';
import type { AnswerRecord, QuizSession } from '../../domain/session';
import type { AnsweredQuestion } from '../experimental/engine';

/** Deterministic PRNG (mulberry32): the same seed always replays the same journey. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Journey {
  readonly mode: ModeId;
  readonly questionIds: readonly QuestionId[];
  readonly answers: readonly AnsweredQuestion[];
}

const AT = '1970-01-01T00:00:00.000Z';

/**
 * Walks a journey through the source exactly as a person would: questions in the order the
 * source gives them, and after every answer the source's own `reconcile` decides what follows
 * (adaptive picks). The reconcile contract is enforced at every step, so a journey cannot
 * bypass selection rules. `choose` sees the answers so far and picks one option.
 */
export function walkJourney(
  source: QuestionSource,
  mode: ModeId,
  choose: (question: Question, sofar: readonly AnsweredQuestion[]) => AnswerId,
): Journey {
  let ids = [...source.start(mode)];
  const records: Record<string, AnswerRecord> = {};
  const answers: AnsweredQuestion[] = [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const question = id ? source.question(id) : undefined;
    if (!id || !question) throw new Error(`journey: unknown question at ${String(i)}`);
    const answerId = choose(question, answers);
    if (!question.options.some((o) => o.id === answerId)) {
      throw new Error(`journey: ${answerId} is not an option of ${id}`);
    }
    answers.push({ question, answerId });
    records[id] = { questionId: id, answerId, answeredAt: AT };
    if (source.reconcile) {
      const session: QuizSession = {
        id: 'audit',
        mode,
        status: 'in-progress',
        startedAt: AT,
        updatedAt: AT,
        catalogVersion: source.catalogVersion,
        bankVersion: source.bankVersion,
        questionIds: ids,
        answers: records,
        cursor: i + 1,
        revision: i + 1,
      };
      const next = [...source.reconcile(session)];
      if (next.length !== ids.length || new Set(next).size !== next.length) {
        throw new Error('journey: reconcile broke the length or repeated a question');
      }
      for (let k = 0; k <= i; k++) {
        if (next[k] !== ids[k]) throw new Error('journey: reconcile changed an answered question');
      }
      ids = next;
    }
  }
  return { mode, questionIds: ids, answers };
}

/** Rebuilds the answered questions of a recorded journey from the source, for replay. */
export function replayAnswers(
  source: QuestionSource,
  mode: ModeId,
  recorded: readonly { readonly questionId: QuestionId; readonly answerId: AnswerId }[],
): Journey {
  const byId = new Map(recorded.map((r) => [r.questionId as string, r.answerId]));
  return walkJourney(source, mode, (q) => {
    const a = byId.get(q.id);
    if (!a) throw new Error(`replay: no recorded answer for ${q.id}`);
    return a;
  });
}
