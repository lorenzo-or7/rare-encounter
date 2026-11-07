import type { Catalog } from '../pokedex/catalog';
import catalogJson from '../pokedex/pokedex.v1.json';
import { VOID_ANSWER, type AnswerId, type QuestionId } from '../../domain/questions';
import { isMatchesResult } from '../../domain/results';
import type { QuizSession } from '../../domain/session';
import { preferenceSignals } from '../../matching/signals';
import { BANK_SOURCE } from '../questions/bank';
import { TRAIT_REGISTRY } from '../traits';
import { answeredQuestions, computeResult, MYSTERY_SPECIES } from './compute';

const catalog = catalogJson as unknown as Catalog;

/** A finished journey through the real source: `pick(i)` is an option index, or 'void'. */
function finished(id: string, mode: 30 | 60 | 90, pick: (i: number) => number | 'void'): QuizSession {
  let s: QuizSession = {
    id,
    mode,
    status: 'in-progress',
    startedAt: 'x',
    updatedAt: 'x',
    catalogVersion: BANK_SOURCE.catalogVersion,
    bankVersion: BANK_SOURCE.bankVersion,
    questionIds: BANK_SOURCE.start(mode, id),
    answers: {},
    cursor: 0,
    revision: 0,
  };
  for (let i = 0; i < mode; i++) {
    const qid = s.questionIds[i] as QuestionId;
    const p = pick(i);
    const option = p === 'void' ? undefined : BANK_SOURCE.question(qid)?.options[p];
    const answerId = p === 'void' ? VOID_ANSWER : (option?.id as AnswerId);
    const answers = { ...s.answers, [qid]: { questionId: qid, answerId, answeredAt: 'x' } };
    s = { ...s, answers, questionIds: BANK_SOURCE.reconcile?.({ ...s, answers }) ?? s.questionIds };
  }
  return s;
}

describe('voided questions', () => {
  it('add no evidence at all: the signals equal those without the question', () => {
    const s = finished('void-evidence', 30, (i) => (i % 5 === 0 ? 'void' : i % 4));
    const all = answeredQuestions(s, BANK_SOURCE);
    const valid = all.filter((a) => a.answerId !== VOID_ANSWER);
    expect(all.length - valid.length).toBe(6);
    expect(preferenceSignals(all, TRAIT_REGISTRY)).toEqual(preferenceSignals(valid, TRAIT_REGISTRY));
  });

  it('are counted apart from answers in the result, which stays deterministic', () => {
    const s = finished('void-counts', 30, (i) => (i % 5 === 0 ? 'void' : i % 4));
    const r = computeResult(s, BANK_SOURCE, catalog, 'now');
    expect(r.counts).toEqual({ answered: 24, voided: 6 });
    expect(computeResult(s, BANK_SOURCE, catalog, 'now')).toEqual(r);
    if (!isMatchesResult(r)) throw new Error('expected three matches');
    const three = [r.soul.speciesId, r.alternatives[0]?.speciesId, r.hidden.speciesId];
    expect(new Set(three).size).toBe(3);
  });
});

describe('special outcomes', () => {
  it.each([30, 60, 90] as const)('every one of %i questions voided: the secret Unown, nothing computed', (mode) => {
    const r = computeResult(finished(`all-void-${String(mode)}`, mode, () => 'void'), BANK_SOURCE, catalog, 'now');
    expect(r).toMatchObject({ outcome: 'mystery', speciesId: MYSTERY_SPECIES, counts: { answered: 0, voided: mode } });
    expect(catalog.species.find((s) => s.slug === MYSTERY_SPECIES)?.id).toBe(201);
  });

  it('a single real answer is not a mystery, and too little evidence invents no species', () => {
    const r = computeResult(finished('one-answer', 30, (i) => (i === 0 ? 0 : 'void')), BANK_SOURCE, catalog, 'now');
    expect(r.outcome).not.toBe('mystery');
    expect(r).toMatchObject({ outcome: 'insufficient', counts: { answered: 1, voided: 29 } });
  });
});
