import {
  CATEGORY_IDS,
  CATEGORY_WEIGHTS,
  MODE_IDS,
  MODES,
  QUESTION_BANK_DISTRIBUTION,
  QUESTION_BANK_SIZE,
  TRAIT_COUNT,
  validateTraitVector,
  type TraitDefinition,
  type TraitId,
} from '.';

const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);

describe('approved scoring configuration', () => {
  it('category weights sum to 100', () => {
    expect(sum(CATEGORY_IDS.map((c) => CATEGORY_WEIGHTS[c]))).toBe(100);
  });

  it.each(MODE_IDS)('mode %i quotas and fundamental/adaptive mix add up', (mode) => {
    const spec = MODES[mode];
    expect(sum(CATEGORY_IDS.map((c) => spec.quotas[c]))).toBe(mode);
    expect(spec.fundamental + spec.adaptive).toBe(mode);
  });

  it('matches the blueprint quotas exactly', () => {
    const asArray = (mode: 30 | 60 | 90) => CATEGORY_IDS.map((c) => MODES[mode].quotas[c]);
    expect(asArray(30)).toEqual([8, 6, 6, 4, 3, 3]);
    expect(asArray(60)).toEqual([15, 12, 12, 9, 6, 6]);
    expect(asArray(90)).toEqual([23, 18, 18, 13, 9, 9]);
  });

  it('question bank distribution sums to the bank size and covers the largest mode', () => {
    expect(sum(CATEGORY_IDS.map((c) => QUESTION_BANK_DISTRIBUTION[c]))).toBe(QUESTION_BANK_SIZE);
    for (const c of CATEGORY_IDS) {
      expect(QUESTION_BANK_DISTRIBUTION[c]).toBeGreaterThanOrEqual(MODES[90].quotas[c]);
    }
  });
});

describe('validateTraitVector', () => {
  // Opaque placeholder IDs: the real taxonomy is not approved.
  const taxonomy: TraitDefinition[] = Array.from({ length: TRAIT_COUNT }, (_, i) => ({
    id: `t${String(i)}` as TraitId,
    category: CATEGORY_IDS[i % CATEGORY_IDS.length] ?? 'personality',
  }));
  const full = Object.fromEntries(taxonomy.map((t) => [t.id, 0.5]));

  it('accepts a complete in-range vector', () => {
    expect(validateTraitVector(full, taxonomy)).toEqual([]);
  });

  it('reports missing, unknown and out-of-range traits', () => {
    const partial = Object.fromEntries(Object.entries(full).slice(1));
    const issues = validateTraitVector({ ...partial, rogue: 2 }, taxonomy);
    expect(issues).toContainEqual({ kind: 'unknown-trait', trait: 'rogue' });
    expect(issues).toContainEqual({ kind: 'range', trait: 'rogue', value: 2 });
    expect(validateTraitVector(partial, taxonomy)).toContainEqual({
      kind: 'count',
      expected: 48,
      actual: 47,
    });
  });
});
