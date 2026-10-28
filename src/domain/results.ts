import type { CatalogVersion, SpeciesId } from './catalog';
import type { CategoryId } from './categories';
import type { ModeId } from './modes';
import type { QuestionBankVersion } from './questions';

export type MatchKind = 'soul' | 'hidden' | 'alternative';

/** Weighted, normalized comparison of one species. */
export interface RankedSpecies {
  readonly speciesId: SpeciesId;
  /** Unrounded normalized score in [0, 1]; ties are broken on this before neutral criteria. */
  readonly score: number;
  readonly categoryScores: Readonly<Record<CategoryId, number>>;
  readonly rank: number;
}

export interface Ranking {
  readonly engineVersion: string;
  readonly entries: readonly RankedSpecies[];
}

export interface MatchExplanation {
  /** Categories that contributed most, strongest first. */
  readonly drivers: readonly CategoryId[];
}

/** Affinity is an explainable similarity, never a probability. */
export interface Match {
  readonly kind: MatchKind;
  readonly speciesId: SpeciesId;
  readonly affinity: number;
  readonly explanation: MatchExplanation;
}

export interface EncounterResult {
  readonly sessionId: string;
  readonly mode: ModeId;
  readonly completedAt: string;
  readonly catalogVersion: CatalogVersion;
  readonly bankVersion: QuestionBankVersion;
  readonly engineVersion: string;
  readonly soul: Match;
  readonly hidden: Match;
  readonly alternatives: readonly Match[];
}
