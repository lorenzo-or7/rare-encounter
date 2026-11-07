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
  /** Trait ids behind the match, strongest first; the explanation text is rebuilt from them. */
  readonly traits?: readonly string[];
}

/** Affinity is an explainable similarity, never a probability. */
export interface Match {
  readonly kind: MatchKind;
  readonly speciesId: SpeciesId;
  readonly affinity: number;
  readonly explanation: MatchExplanation;
}

/** How the journey was answered: valid answers count as evidence, voided ones do not. */
export interface AnswerCounts {
  readonly answered: number;
  readonly voided: number;
}

interface ResultBase {
  readonly sessionId: string;
  readonly mode: ModeId;
  readonly completedAt: string;
  readonly catalogVersion: CatalogVersion;
  readonly bankVersion: QuestionBankVersion;
  readonly engineVersion: string;
  /** Absent on results stored before voiding existed. */
  readonly counts?: AnswerCounts;
}

/** Three distinct species from the engine (results stored earlier have no `outcome`). */
export interface MatchesResult extends ResultBase {
  readonly outcome?: 'matches';
  readonly soul: Match;
  readonly hidden: Match;
  readonly alternatives: readonly Match[];
}

/**
 * Every question was voided: there is no evidence at all, so no affinity was computed.
 * Unown stands for the mystery as a secret discovery; it is not a Soul Match and says
 * nothing about Unown's own place in the normal ranking.
 */
export interface MysteryResult extends ResultBase {
  readonly outcome: 'mystery';
  readonly speciesId: SpeciesId;
}

/** Some answers, but not enough evidence for three defensible matches: none are invented. */
export interface InsufficientResult extends ResultBase {
  readonly outcome: 'insufficient';
}

export type EncounterResult = MatchesResult | MysteryResult | InsufficientResult;

export const isMatchesResult = (r: EncounterResult): r is MatchesResult =>
  r.outcome === undefined || r.outcome === 'matches';
