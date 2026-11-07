import { isVoided } from '../../domain/questions';
import type { QuizSession } from '../../domain/session';

/** Consecutive voided questions that bring up the notice. */
export const VOID_NOTICE_RUN = 3;

/**
 * The run of voided questions that ends right before `index`, in the session's current
 * order. Returns the id of the run's first question (the run's identity: the same run never
 * brings the notice twice, a new run after a real answer can), or null under the threshold.
 * Being derived from the stored order, it follows edits and adaptive changes on its own.
 */
export function voidRunBefore(session: QuizSession, index: number): string | null {
  let start = -1;
  for (let i = index - 1; i >= 0; i--) {
    const id = session.questionIds[i];
    if (!id || !isVoided(session.answers[id]?.answerId)) break;
    start = i;
  }
  if (start < 0 || index - start < VOID_NOTICE_RUN) return null;
  return session.questionIds[start] ?? null;
}

const KEY = (sessionId: string) => `rare-encounter:void-notices:${sessionId}`;

/** Runs whose notice was already shown in this session (survives a reload). */
export function readShownNotices(sessionId: string): ReadonlySet<string> {
  try {
    const raw = localStorage.getItem(KEY(sessionId));
    const list: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function markNoticeShown(sessionId: string, run: string): void {
  try {
    const shown = new Set(readShownNotices(sessionId));
    shown.add(run);
    localStorage.setItem(KEY(sessionId), JSON.stringify([...shown]));
  } catch {
    // Without storage the notice may show again after a reload; nothing else depends on it.
  }
}
