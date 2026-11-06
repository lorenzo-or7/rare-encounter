import type { CatalogVersion } from './catalog';
import type { ModeId } from './modes';
import type { Question, QuestionBankVersion, QuestionId } from './questions';
import type { QuizSession } from './session';

/**
 * Where a session's questions come from. Phase 02 runs on a clearly labelled preview
 * source; the Phase 04 bank and adaptive engine implement the same contract (adding
 * adaptive selection). No real selection rules are defined here.
 */
export interface QuestionSource {
  readonly bankVersion: QuestionBankVersion;
  readonly catalogVersion: CatalogVersion;
  /** Temporary content: the UI must present it as a preview, never as the question bank. */
  readonly preview: boolean;
  /**
   * Question ids for a new session of this length, in presentation order. `seed` is the
   * session id: sources that vary the selection per session must use it, so `reconcile`
   * (which sees the session) rebuilds the same sequence.
   */
  start(mode: ModeId, seed?: string): readonly QuestionId[];
  question(id: QuestionId): Question | undefined;
  /**
   * After an answer changes, returns the sequence that is valid for the answers given so
   * far: every question that is still valid keeps its place, and only picks that depended on
   * the changed answer are replaced. Sources without adaptive picks omit it (nothing changes).
   * Contract: same length, no repeats, and every question up to the edited one unchanged.
   */
  reconcile?(session: QuizSession): readonly QuestionId[];
}
