import type { QuestionSource } from '../../domain/question-source';
import type { EncounterResult } from '../../domain/results';
import type { QuizSession } from '../../domain/session';
import type { EncounterStore, Recovered } from '../../storage/encounter-store';

/**
 * What the browser holds for the returning visitor, decided without React.
 * - `session`: an unfinished session that can continue with this source;
 * - `recovery`: something unfinished that cannot continue safely (unreadable, from a newer
 *   version, without a migration, or written for other questions). Nothing is deleted:
 *   the person chooses what happens to it;
 * - `unreachable`: storage could not be opened, so nothing can be confirmed either way.
 */
export type RecoveryReason = 'newer-schema' | 'no-migration-path' | 'invalid' | 'changed';

export type StoredState =
  | { readonly kind: 'none' }
  | { readonly kind: 'session'; readonly session: QuizSession }
  | {
      readonly kind: 'recovery';
      readonly reason: RecoveryReason;
      /** Row id, when the data still carries one (needed to delete it on request). */
      readonly sessionId: string | null;
      readonly answered: number | null;
    }
  | { readonly kind: 'unreachable' };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Checks a readable session against the questions this build can show. */
export function assessSession(
  outcome: Recovered<QuizSession> | null,
  source: QuestionSource,
): StoredState {
  if (!outcome) return { kind: 'none' };
  if (outcome.status === 'needs-restart') {
    const raw = outcome.raw;
    const data = isRecord(raw) ? raw['data'] : undefined;
    const answers = isRecord(data) ? data['answers'] : undefined;
    return {
      kind: 'recovery',
      reason: outcome.reason,
      sessionId: isRecord(raw) && typeof raw['id'] === 'string' ? raw['id'] : null,
      answered: isRecord(answers) ? Object.keys(answers).length : null,
    };
  }
  const session = outcome.value;
  const compatible =
    session.bankVersion === source.bankVersion &&
    session.questionIds.length === session.mode &&
    session.questionIds.every((id) => source.question(id) !== undefined);
  if (!compatible) {
    return {
      kind: 'recovery',
      reason: 'changed',
      sessionId: session.id,
      answered: Object.keys(session.answers).length,
    };
  }
  return { kind: 'session', session };
}

export interface Loaded {
  readonly state: StoredState;
  readonly store: EncounterStore | null;
}

export interface LoadOptions {
  /** Resolves false when there is certainly no database yet (so none is created by looking). */
  readonly exists?: () => Promise<boolean>;
  /** Storage that does not answer within this time is reported as unreachable. */
  readonly timeoutMs?: number;
}

/**
 * Opens the store and reads what can be resumed. A failed or stalled open is reported as
 * unreachable rather than hidden, and a first visit (no database) opens nothing.
 */
export async function loadStoredState(
  openStore: () => Promise<EncounterStore>,
  source: QuestionSource,
  { exists, timeoutMs = 5000 }: LoadOptions = {},
): Promise<Loaded> {
  const load = async (): Promise<Loaded> => {
    if (exists && !(await exists())) return { state: { kind: 'none' }, store: null };
    const store = await openStore();
    return { state: assessSession(await store.getUnfinishedSession(), source), store };
  };
  const stalled = new Promise<Loaded>((resolve) => {
    setTimeout(() => {
      resolve({ state: { kind: 'unreachable' }, store: null });
    }, timeoutMs);
  });
  try {
    return await Promise.race([load(), stalled]);
  } catch {
    return { state: { kind: 'unreachable' }, store: null };
  }
}

export type BannerKind = 'session' | 'recovery' | 'unreachable' | 'result';

/**
 * Landing banner priority (blueprint): an unfinished session comes before the last saved
 * result. Results arrive in Phase 05; until then the `result` case is never rendered.
 */
export function bannerFor(
  stored: StoredState,
  latestResult: Recovered<EncounterResult> | null,
): BannerKind | null {
  if (stored.kind === 'session') return 'session';
  if (stored.kind === 'recovery') return 'recovery';
  if (stored.kind === 'unreachable') return 'unreachable';
  return latestResult && latestResult.status !== 'needs-restart' ? 'result' : null;
}
