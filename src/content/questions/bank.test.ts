import { validateQuestionArt } from '../../domain/answer-art';
import { CATEGORY_IDS } from '../../domain/categories';
import { MODE_IDS, MODES } from '../../domain/modes';
import type { QuestionId } from '../../domain/questions';
import type { QuizSession } from '../../domain/session';
import { optionIcon } from '../../features/quiz/option-icons';
import { LOCALES } from '../../i18n/locales';
import { checkQuestionsAgainstRegistry, validateTraitRegistry } from '../../matching/registry';
import { TRAIT_REGISTRY, traitsOf } from '../traits';
import { adaptiveSplit, BANK, BANK_SOURCE } from './bank';

const EXPECTED = { personality: 75, aesthetics: 60, values: 60, environments: 45, behavior: 30, instinct: 30 };

/** Words that carry no meaning for similarity, in the pt-BR reference text. */
const STOP = new Set(
  'a o as os um uma uns umas de do da dos das em no na nos nas por para com sem que qual quais você seu sua seus suas mais mas e ou é se ao à como isso este esta esse essa destes destas desses dessas num numa me te lhe ele ela eles elas tem ter ser está estar fica faz vai'.split(' '),
);
const tokens = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
const jaccard = (a: Set<string>, b: Set<string>) => {
  const inter = [...a].filter((x) => b.has(x)).length;
  return inter / (a.size + b.size - inter || 1);
};

describe('question bank: content integrity', () => {
  it('has exactly 300 questions with the approved category totals and ~70/30 roles', () => {
    expect(BANK).toHaveLength(300);
    for (const c of CATEGORY_IDS) {
      const qs = BANK.filter((q) => q.category === c);
      expect(qs, c).toHaveLength(EXPECTED[c]);
      const adaptive = qs.filter((q) => q.role === 'adaptive').length;
      expect(adaptive / qs.length, c).toBeGreaterThan(0.27);
      expect(adaptive / qs.length, c).toBeLessThan(0.33);
    }
  });

  it('has unique question and option ids', () => {
    expect(new Set(BANK.map((q) => q.id)).size).toBe(300);
    const options = BANK.flatMap((q) => q.options.map((o) => o.id));
    expect(new Set(options).size).toBe(options.length);
  });

  it('every question has four options, each with a distinct primary trait of its category', () => {
    for (const q of BANK) {
      expect(q.options, q.id).toHaveLength(4);
      const category = traitsOf(q.category);
      const primaries = q.options.map(
        (o) => Object.entries(o.effects).find(([, w]) => w === 1)?.[0] ?? '',
      );
      expect(new Set(primaries).size, q.id).toBe(4);
      for (const p of primaries) expect(category as string[], `${q.id} ${p}`).toContain(p);
    }
  });

  it('is complete in pt-BR, en and es, with no repeated text', () => {
    for (const locale of LOCALES) {
      const prompts = new Set<string>();
      for (const q of BANK) {
        expect(q.prompt[locale].trim(), `${q.id} ${locale}`).not.toBe('');
        expect(prompts.has(q.prompt[locale]), `duplicate prompt ${q.id} ${locale}`).toBe(false);
        prompts.add(q.prompt[locale]);
        const labels = q.options.map((o) => o.label[locale].trim());
        for (const l of labels) expect(l, `${q.id} ${locale}`).not.toBe('');
        expect(new Set(labels).size, `${q.id} ${locale} repeated option`).toBe(4);
        for (const o of q.options) if (o.media) expect(o.media.alt[locale].trim()).not.toBe('');
      }
    }
  });

  it('maps every option to registered traits only, and uses every trait', () => {
    expect(validateTraitRegistry(TRAIT_REGISTRY)).toEqual([]);
    expect(checkQuestionsAgainstRegistry(BANK, TRAIT_REGISTRY)).toEqual([]);
    const used = new Map<string, number>();
    for (const q of BANK) for (const o of q.options) for (const t of Object.keys(o.effects)) used.set(t, (used.get(t) ?? 0) + 1);
    for (const t of TRAIT_REGISTRY.traits) expect(used.get(t.id) ?? 0, t.id).toBeGreaterThanOrEqual(20);
  });

  it('image and icon questions meet their format contracts', () => {
    for (const q of BANK) {
      expect(validateQuestionArt(q), q.id).toEqual([]);
      if (q.format === 'icon-text') {
        for (const o of q.options) expect(optionIcon(o.media?.src ?? ''), `${q.id} ${o.id}`).toBeDefined();
      }
    }
  });

  it('has no near-duplicate prompts (automatic screen; editorial review still required)', () => {
    const t = BANK.map((q) => ({ id: q.id, t: tokens(q.prompt['pt-BR']) }));
    const close: string[] = [];
    t.forEach((a, i) => {
      for (const b of t.slice(i + 1)) {
        const s = jaccard(a.t, b.t);
        if (s >= 0.6 && a.t.size >= 3) close.push(`${a.id}~${b.id} ${s.toFixed(2)}`);
      }
    });
    // Reviewed: share only “hora” and “dia”; they ask different things (pe-055 a wish, be-001 a rhythm).
    expect(close).toEqual(['pe-055~be-001 0.60']);
  });
});

describe('question bank: journeys', () => {
  const seeds = Array.from({ length: 200 }, (_, i) => `session-${String(i)}`);

  it.each(MODE_IDS)('mode %i: exact length and quotas, no repeats, ~30%% adaptive, no shared group', (mode) => {
    const split = adaptiveSplit(mode);
    expect(Object.values(split).reduce((a, b) => a + b, 0)).toBe(MODES[mode].adaptive);
    for (const seed of seeds) {
      const ids = BANK_SOURCE.start(mode, seed);
      expect(ids).toHaveLength(mode);
      expect(new Set(ids).size).toBe(mode);
      const qs = ids.map((id) => BANK_SOURCE.question(id));
      for (const c of CATEGORY_IDS) expect(qs.filter((q) => q?.category === c)).toHaveLength(MODES[mode].quotas[c]);
      expect(qs.filter((q) => q?.role === 'adaptive')).toHaveLength(MODES[mode].adaptive);
      const groups = qs.flatMap((q) => {
        const g = q ? BANK.find((b) => b.id === q.id)?.group : null;
        return g ? [g] : [];
      });
      expect(new Set(groups).size).toBe(groups.length);
    }
  });

  it('different sessions get different selections; the same session always the same one', () => {
    const a = BANK_SOURCE.start(30, 'alpha');
    expect(BANK_SOURCE.start(30, 'alpha')).toEqual(a);
    expect(BANK_SOURCE.start(30, 'beta')).not.toEqual(a);
  });

  it('adaptive picks follow the answers and respect the reconcile contract', () => {
    const base: QuizSession = {
      id: 'adaptive-check',
      mode: 60,
      status: 'in-progress',
      startedAt: 'x',
      updatedAt: 'x',
      catalogVersion: BANK_SOURCE.catalogVersion,
      bankVersion: BANK_SOURCE.bankVersion,
      questionIds: BANK_SOURCE.start(60, 'adaptive-check'),
      answers: {},
      cursor: 0,
      revision: 0,
    };
    const answerAll = (pick: number) => {
      let s = base;
      for (let i = 0; i < 60; i++) {
        const id = s.questionIds[i] as QuestionId;
        const q = BANK_SOURCE.question(id);
        const o = q?.options[pick % 4];
        if (!o) throw new Error('missing');
        const answers = { ...s.answers, [id]: { questionId: id, answerId: o.id, answeredAt: 'x' } };
        const next = BANK_SOURCE.reconcile?.({ ...s, answers }) ?? s.questionIds;
        for (let k = 0; k <= i; k++) expect(next[k]).toBe(s.questionIds[k]);
        s = { ...s, answers, questionIds: next };
      }
      return s.questionIds;
    };
    expect(answerAll(0)).not.toEqual(answerAll(2));
  });
});
