import type { CatalogVersion } from '../../domain/catalog';
import type { QuestionSource } from '../../domain/question-source';
import type {
  AnswerId,
  Question,
  QuestionBankVersion,
  QuestionId,
} from '../../domain/questions';
import type { QuizSession } from '../../domain/session';

/**
 * TEST FIXTURE, not product content and not an algorithm: a 30-question source with two
 * dependent pairs, to exercise the edit/reconcile contract.
 *
 *   f01 … f06, [X1 X2], f07 … f20, [Y1 Y2], f21 … f26
 *
 * X1/X2 follow f02 (answer "b" → xb*, otherwise xa*); Y1/Y2 follow f04 the same way.
 */
const id = (s: string) => s as QuestionId;
const fixed = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => id(`f${String(from + i).padStart(2, '0')}`));

function sequence(answers: QuizSession['answers']): QuestionId[] {
  const pick = (driver: string, prefix: string) =>
    answers[driver]?.answerId === ('b' as AnswerId)
      ? [id(`${prefix}b1`), id(`${prefix}b2`)]
      : [id(`${prefix}a1`), id(`${prefix}a2`)];
  return [...fixed(1, 6), ...pick('f02', 'x'), ...fixed(7, 20), ...pick('f04', 'y'), ...fixed(21, 26)];
}

const L = (text: string) => ({ en: text, 'pt-BR': text, es: text });

export const ADAPTIVE_FIXTURE: QuestionSource = {
  bankVersion: 'fixture-1' as QuestionBankVersion,
  catalogVersion: 'none' as CatalogVersion,
  preview: true,
  start: () => sequence({}),
  question: (qid): Question => ({
    id: qid,
    revision: 1,
    category: 'personality',
    role: qid.startsWith('f') ? 'fundamental' : 'adaptive',
    format: 'text',
    prompt: L(`Fixture question ${qid}`),
    options: [
      { id: 'a' as AnswerId, label: L('Answer a'), effects: {} },
      { id: 'b' as AnswerId, label: L('Answer b'), effects: {} },
    ],
  }),
  reconcile: (session) => sequence(session.answers),
};
