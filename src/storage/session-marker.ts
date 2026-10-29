import { isModeId, type ModeId } from '../domain/modes';
import { migrateRecord, type MigrationPlan } from './migrations';

/**
 * A light pointer to the unfinished session, kept in localStorage next to the preferences.
 * IndexedDB stays the source of truth: the marker only says "there may be something to
 * resume" without opening the database, and its `storage` events tell other tabs that the
 * session moved on. It is written only after IndexedDB has committed.
 */
export const SESSION_MARKER_KEY = 'rare-encounter:active-session';
export const SESSION_MARKER_VERSION = 1;

export interface SessionMarker {
  readonly sessionId: string;
  readonly mode: ModeId;
  readonly answered: number;
  readonly total: number;
  readonly revision: number;
  readonly updatedAt: string;
}

const isMarker = (v: unknown): v is SessionMarker => {
  if (typeof v !== 'object' || v === null) return false;
  const m = v as Record<string, unknown>;
  return (
    typeof m['sessionId'] === 'string' &&
    isModeId(m['mode']) &&
    Number.isInteger(m['answered']) &&
    Number.isInteger(m['total']) &&
    Number.isInteger(m['revision']) &&
    typeof m['updatedAt'] === 'string'
  );
};

const plan: MigrationPlan<SessionMarker> = {
  currentVersion: SESSION_MARKER_VERSION,
  steps: {},
  validate: isMarker,
};

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** The marker, or null when absent, unreadable or malformed (malformed data is left as is). */
export function readSessionMarker(): SessionMarker | null {
  try {
    const raw = storage()?.getItem(SESSION_MARKER_KEY);
    if (!raw) return null;
    const outcome = migrateRecord(JSON.parse(raw), plan);
    return outcome.status === 'needs-restart' ? null : outcome.value;
  } catch {
    return null;
  }
}

/** Best effort: the marker is a convenience, so a failed write never blocks the quiz. */
export function writeSessionMarker(marker: SessionMarker): void {
  try {
    storage()?.setItem(
      SESSION_MARKER_KEY,
      JSON.stringify({ schemaVersion: SESSION_MARKER_VERSION, data: marker }),
    );
  } catch {
    // Quota or blocked storage: IndexedDB still holds the session.
  }
}

export function clearSessionMarker(): void {
  try {
    storage()?.removeItem(SESSION_MARKER_KEY);
  } catch {
    // Nothing to do: a stale marker is verified against IndexedDB before use.
  }
}

/** Calls back when another tab writes or clears the marker. */
export function onSessionMarkerChange(listener: (marker: SessionMarker | null) => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === SESSION_MARKER_KEY || e.key === null) listener(readSessionMarker());
  };
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('storage', onStorage);
  };
}
