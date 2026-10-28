import type { CategoryId } from './categories';

export const MODE_IDS = [30, 60, 90] as const;
export type ModeId = (typeof MODE_IDS)[number];

export interface ModeSpec {
  readonly id: ModeId;
  /** Questions per category; sums to the mode length. */
  readonly quotas: Readonly<Record<CategoryId, number>>;
  readonly fundamental: number;
  readonly adaptive: number;
}

const quotas = (
  personality: number,
  aesthetics: number,
  values: number,
  environments: number,
  behavior: number,
  instinct: number,
): Readonly<Record<CategoryId, number>> => ({
  personality,
  aesthetics,
  values,
  environments,
  behavior,
  instinct,
});

/** Approved mode quotas and fundamental/adaptive mix. */
export const MODES: Readonly<Record<ModeId, ModeSpec>> = {
  30: { id: 30, quotas: quotas(8, 6, 6, 4, 3, 3), fundamental: 21, adaptive: 9 },
  60: { id: 60, quotas: quotas(15, 12, 12, 9, 6, 6), fundamental: 42, adaptive: 18 },
  90: { id: 90, quotas: quotas(23, 18, 18, 13, 9, 9), fundamental: 63, adaptive: 27 },
};

export const isModeId = (value: unknown): value is ModeId =>
  typeof value === 'number' && (MODE_IDS as readonly number[]).includes(value);
