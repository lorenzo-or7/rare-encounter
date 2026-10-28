/** The six approved scoring categories, in blueprint order. */
export const CATEGORY_IDS = [
  'personality',
  'aesthetics',
  'values',
  'environments',
  'behavior',
  'instinct',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

/** Approved category weights (percent). Must sum to 100. */
export const CATEGORY_WEIGHTS: Readonly<Record<CategoryId, number>> = {
  personality: 25,
  aesthetics: 20,
  values: 20,
  environments: 15,
  behavior: 10,
  instinct: 10,
};

/** Proposed per-category distribution of the 300-question bank. */
export const QUESTION_BANK_DISTRIBUTION: Readonly<Record<CategoryId, number>> = {
  personality: 75,
  aesthetics: 60,
  values: 60,
  environments: 45,
  behavior: 30,
  instinct: 30,
};

export const QUESTION_BANK_SIZE = 300;
