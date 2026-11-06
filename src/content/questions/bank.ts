import type { CatalogVersion } from '../../domain/catalog';
import { CATEGORY_IDS, type CategoryId } from '../../domain/categories';
import { MODES, type ModeId } from '../../domain/modes';
import type { QuestionSource } from '../../domain/question-source';
import type { QuestionBankVersion, QuestionId } from '../../domain/questions';
import type { QuizSession } from '../../domain/session';
import { preferenceSignals, type AnsweredQuestion } from '../../matching/signals';
import { TRAIT_REGISTRY } from '../traits';
import { AESTHETICS } from './aesthetics';
import { BEHAVIOR } from './behavior';
import { build, type BankQuestion } from './define';
import { ENVIRONMENTS } from './environments';
import { INSTINCT } from './instinct';
import { PERSONALITY } from './personality';
import { VALUES } from './values';

/**
 * Question Bank v1: 300 candidate questions (Or7 editorial review pending), shared by the
 * three journeys. A journey never repeats a question, never shows two questions of the same
 * semantic group, and fills the approved per-category quotas with about 70% fundamental and
 * 30% adaptive questions.
 */
export const BANK_VERSION = 'bank-1.0-candidate' as QuestionBankVersion;
/** Species catalog the results are computed against (see content/pokedex). */
export const CATALOG_VERSION = 'pokedex-1.0' as CatalogVersion;

export const BANK: readonly BankQuestion[] = [
  ...build('personality', PERSONALITY),
  ...build('aesthetics', AESTHETICS),
  ...build('values', VALUES),
  ...build('environments', ENVIRONMENTS),
  ...build('behavior', BEHAVIOR),
  ...build('instinct', INSTINCT),
];

const BY_ID = new Map(BANK.map((q) => [q.id as string, q]));
const POOL = new Map(
  CATEGORY_IDS.map((c) => [
    c,
    {
      fundamental: BANK.filter((q) => q.category === c && q.role === 'fundamental'),
      adaptive: BANK.filter((q) => q.category === c && q.role === 'adaptive'),
    },
  ]),
);

/** FNV-1a, 32-bit. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Adaptive slots per category: the mode's adaptive total split by quota (largest remainder). */
export function adaptiveSplit(mode: ModeId): Record<CategoryId, number> {
  const spec = MODES[mode];
  const exact = CATEGORY_IDS.map((c) => ({ c, v: (spec.quotas[c] * spec.adaptive) / spec.id }));
  const out = Object.fromEntries(exact.map(({ c, v }) => [c, Math.floor(v)])) as Record<CategoryId, number>;
  let left = spec.adaptive - Object.values(out).reduce((a, b) => a + b, 0);
  for (const { c } of [...exact].sort((a, b) => b.v - Math.floor(b.v) - (a.v - Math.floor(a.v)) || (a.c < b.c ? -1 : 1))) {
    if (left-- <= 0) break;
    out[c] += 1;
  }
  return out;
}

type Slot = { readonly category: CategoryId; readonly adaptive: boolean; readonly id: string | null };

/** Fundamental picks and the slot layout depend only on the seed and the mode. */
function layout(mode: ModeId, seed: string): Slot[] {
  const split = adaptiveSplit(mode);
  const usedGroups = new Set<string>();
  const perCategory = new Map<CategoryId, Slot[]>();
  for (const c of CATEGORY_IDS) {
    const pool = POOL.get(c)?.fundamental ?? [];
    const order = [...pool].sort((a, b) => hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`) || (a.id < b.id ? -1 : 1));
    const need = MODES[mode].quotas[c] - split[c];
    const picks: Slot[] = [];
    for (const q of order) {
      if (picks.length >= need) break;
      if (q.group && usedGroups.has(q.group)) continue;
      if (q.group) usedGroups.add(q.group);
      picks.push({ category: c, adaptive: false, id: q.id });
    }
    for (let i = 0; i < split[c]; i++) picks.push({ category: c, adaptive: true, id: null });
    perCategory.set(c, picks);
  }
  // Round-robin, one question per category per round: every category appears early, and
  // each category's adaptive slots come after its fundamentals.
  const out: Slot[] = [];
  for (let round = 0; out.length < mode; round++) {
    for (const c of CATEGORY_IDS) {
      const slot = perCategory.get(c)?.[round];
      if (slot) out.push(slot);
    }
  }
  return out;
}

/**
 * Resolves the adaptive slots in order. Each pick looks only at answers given before its
 * position, so everything up to an answered question stays put (the reconcile contract).
 * The pick favours questions whose options include the traits the person is leaning
 * toward in that category (to deepen them), plus traits seen least so far (to fill gaps).
 * It never looks at species, so it cannot steer toward a particular Pokémon.
 */
function resolve(mode: ModeId, seed: string, answers: QuizSession['answers']): QuestionId[] {
  const slots = layout(mode, seed);
  const used = new Set(slots.flatMap((s) => (s.id ? [s.id] : [])));
  const usedGroups = new Set(
    slots.flatMap((s) => {
      const g = s.id ? BY_ID.get(s.id)?.group : null;
      return g ? [g] : [];
    }),
  );
  const ids: string[] = [];
  for (const slot of slots) {
    if (!slot.adaptive && slot.id) {
      ids.push(slot.id);
      continue;
    }
    const before: AnsweredQuestion[] = ids.flatMap((id) => {
      const question = BY_ID.get(id);
      const a = answers[id];
      return question && a ? [{ question, answerId: a.answerId }] : [];
    });
    const signals = new Map(preferenceSignals(before, TRAIT_REGISTRY).map((s) => [s.traitId as string, s]));
    const candidates = (POOL.get(slot.category)?.adaptive ?? []).filter(
      (q) => !used.has(q.id) && !(q.group && usedGroups.has(q.group)),
    );
    let best: { id: string; score: number; key: number } | null = null;
    for (const q of candidates) {
      let score = 0;
      for (const o of q.options) {
        for (const t of Object.keys(o.effects)) {
          const s = signals.get(t);
          score += Math.max(0, s?.value ?? 0) + 0.3 / (1 + (s?.observations ?? 0));
        }
      }
      const key = hash(`${seed}:${q.id}`);
      if (!best || score > best.score + 1e-9 || (Math.abs(score - best.score) <= 1e-9 && key < best.key)) {
        best = { id: q.id, score, key };
      }
    }
    if (!best) throw new Error(`question bank: no adaptive question left for ${slot.category}`);
    used.add(best.id);
    const g = BY_ID.get(best.id)?.group;
    if (g) usedGroups.add(g);
    ids.push(best.id);
  }
  return ids as QuestionId[];
}

export const BANK_SOURCE: QuestionSource = {
  bankVersion: BANK_VERSION,
  catalogVersion: CATALOG_VERSION,
  preview: false,
  start: (mode, seed = 'default') => resolve(mode, seed, {}),
  question: (id) => BY_ID.get(id),
  reconcile: (session) => resolve(session.mode, session.id, session.answers),
};
