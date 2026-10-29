import { isModeId } from '../domain/modes';
import type { EncounterResult } from '../domain/results';
import type { AnswerRecord, QuizSession } from '../domain/session';
import { migrateRecord, type MigrationOutcome, type MigrationPlan } from './migrations';

/**
 * IndexedDB persistence for sessions, answers, adaptive selection and the last result.
 *
 * Every write resolves only after its transaction commits, so the UI can await
 * a durable save before advancing. Records are wrapped in a versioned envelope
 * and pass through `migrateRecord` on read; unrecoverable records are reported,
 * never deleted.
 */

export const DB_NAME = 'rare-encounter';
export const DB_VERSION = 1;
/** v2 (Phase 02, CP03) adds `revision`; v1 sessions migrate with revision 0. */
export const SESSION_SCHEMA_VERSION = 2;
export const RESULT_SCHEMA_VERSION = 1;

const SESSIONS = 'sessions';
const RESULTS = 'results';
const LATEST_RESULT_KEY = 'latest';

interface Envelope<T> {
  readonly schemaVersion: number;
  readonly data: T;
}

interface SessionRow extends Envelope<QuizSession> {
  readonly id: string;
}

interface ResultRow extends Envelope<EncounterResult> {
  readonly slot: typeof LATEST_RESULT_KEY;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function isQuizSession(v: unknown): v is QuizSession {
  return (
    isRecord(v) &&
    typeof v['id'] === 'string' &&
    isModeId(v['mode']) &&
    (v['status'] === 'in-progress' || v['status'] === 'paused' || v['status'] === 'completed') &&
    typeof v['startedAt'] === 'string' &&
    typeof v['updatedAt'] === 'string' &&
    typeof v['catalogVersion'] === 'string' &&
    typeof v['bankVersion'] === 'string' &&
    Array.isArray(v['questionIds']) &&
    isRecord(v['answers']) &&
    Number.isInteger(v['cursor']) &&
    Number.isInteger(v['revision']) &&
    (v['revision'] as number) >= 0
  );
}

export function isEncounterResult(v: unknown): v is EncounterResult {
  return (
    isRecord(v) &&
    typeof v['sessionId'] === 'string' &&
    isModeId(v['mode']) &&
    typeof v['completedAt'] === 'string' &&
    typeof v['engineVersion'] === 'string' &&
    isRecord(v['soul']) &&
    isRecord(v['hidden']) &&
    Array.isArray(v['alternatives'])
  );
}

const sessionPlan: MigrationPlan<QuizSession> = {
  currentVersion: SESSION_SCHEMA_VERSION,
  steps: {
    // v1 → v2: sessions saved before the write counter existed start counting from 0.
    1: (data) => (isRecord(data) && !('revision' in data) ? { ...data, revision: 0 } : data),
  },
  validate: isQuizSession,
};

const resultPlan: MigrationPlan<EncounterResult> = {
  currentVersion: RESULT_SCHEMA_VERSION,
  steps: {},
  validate: isEncounterResult,
};

export type Recovered<T> = MigrationOutcome<T>;

/**
 * A conditional write found the session changed (another tab answered, paused or started
 * over) or gone. Nothing was written; the caller reloads the stored session.
 */
export class SessionConflictError extends Error {
  readonly sessionId: string;
  readonly reason: 'changed' | 'missing';

  constructor(sessionId: string, reason: 'changed' | 'missing') {
    super(`Session ${sessionId} was ${reason === 'missing' ? 'removed' : 'changed'} elsewhere`);
    this.name = 'SessionConflictError';
    this.sessionId = sessionId;
    this.reason = reason;
  }
}

export interface EncounterStore {
  /** Most recently updated unfinished session, if any. */
  getUnfinishedSession(): Promise<Recovered<QuizSession> | null>;
  putSession(session: QuizSession): Promise<void>;
  /**
   * Atomically records one answer, moves the cursor and increments the revision. With
   * `expectedRevision`, the write is refused (SessionConflictError) if the stored session
   * has moved on.
   */
  recordAnswer(
    sessionId: string,
    answer: AnswerRecord,
    cursor: number,
    expectedRevision?: number,
  ): Promise<QuizSession>;
  /** Replaces a session only if its stored revision is still `expectedRevision`. */
  updateSession(next: QuizSession, expectedRevision: number): Promise<QuizSession>;
  /** Explicit "start over" only, after user confirmation. */
  deleteSession(sessionId: string): Promise<void>;
  /** Marks the session completed and replaces the single retained result in one transaction. */
  completeSession(session: QuizSession, result: EncounterResult): Promise<void>;
  getLatestResult(): Promise<Recovered<EncounterResult> | null>;
  close(): void;
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => {
      reject(req.error ?? new Error('IndexedDB request failed'));
    };
  });
}

function committed(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => {
      reject(tx.error ?? new Error('IndexedDB transaction failed'));
    };
    tx.onabort = () => {
      reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    };
  });
}

function upgrade(db: IDBDatabase, oldVersion: number): void {
  if (oldVersion < 1) {
    const sessions = db.createObjectStore(SESSIONS, { keyPath: 'id' });
    sessions.createIndex('updatedAt', 'data.updatedAt');
    db.createObjectStore(RESULTS, { keyPath: 'slot' });
  }
}

/**
 * Whether the encounter database exists, without creating it (opening it would). Where the
 * browser cannot list databases, the answer is "maybe" (true), so nothing is ever missed.
 */
export async function encounterStoreExists(
  factory: IDBFactory = indexedDB,
  name: string = DB_NAME,
): Promise<boolean> {
  if (typeof factory.databases !== 'function') return true;
  try {
    return (await factory.databases()).some((db) => db.name === name);
  } catch {
    return true;
  }
}

export async function openEncounterStore(
  factory: IDBFactory = indexedDB,
  name: string = DB_NAME,
): Promise<EncounterStore> {
  const openReq = factory.open(name, DB_VERSION);
  openReq.onupgradeneeded = (event) => {
    upgrade(openReq.result, event.oldVersion);
  };
  const db = await request(openReq);

  const sessionRow = (session: QuizSession): SessionRow => ({
    id: session.id,
    schemaVersion: SESSION_SCHEMA_VERSION,
    data: session,
  });

  /**
   * Read-modify-write in one transaction: reads the stored session, checks the expected
   * revision, applies `change` and stores it with the revision incremented.
   */
  async function writeSession(
    sessionId: string,
    expectedRevision: number | undefined,
    change: (current: QuizSession) => QuizSession,
  ): Promise<QuizSession> {
    const tx = db.transaction(SESSIONS, 'readwrite');
    const store = tx.objectStore(SESSIONS);
    const done = committed(tx);
    const fail = async (error: Error): Promise<never> => {
      tx.abort();
      await done.catch(() => undefined);
      throw error;
    };
    const row: unknown = await request(store.get(sessionId));
    if (row === undefined) return fail(new SessionConflictError(sessionId, 'missing'));
    const outcome = migrateRecord(row, sessionPlan);
    if (outcome.status === 'needs-restart') {
      return fail(new Error(`Session ${sessionId} cannot be updated (${outcome.reason})`));
    }
    const current = outcome.value;
    if (expectedRevision !== undefined && current.revision !== expectedRevision) {
      return fail(new SessionConflictError(sessionId, 'changed'));
    }
    const next: QuizSession = { ...change(current), revision: current.revision + 1 };
    store.put(sessionRow(next));
    await done;
    return next;
  }

  return {
    async getUnfinishedSession() {
      const tx = db.transaction(SESSIONS, 'readonly');
      // Every row, not the updatedAt index: IndexedDB leaves rows without that field out of
      // the index, and malformed data must still surface for assisted recovery.
      const rows: unknown[] = await request(tx.objectStore(SESSIONS).getAll());
      const updated = (row: unknown): string => {
        const data = isRecord(row) ? row['data'] : undefined;
        return isRecord(data) && typeof data['updatedAt'] === 'string' ? data['updatedAt'] : '';
      };
      rows.sort((x, y) => updated(x).localeCompare(updated(y)));
      for (let i = rows.length - 1; i >= 0; i--) {
        const outcome = migrateRecord(rows[i], sessionPlan);
        if (outcome.status === 'needs-restart' || outcome.value.status !== 'completed') {
          return outcome;
        }
      }
      return null;
    },

    async putSession(session) {
      const tx = db.transaction(SESSIONS, 'readwrite');
      tx.objectStore(SESSIONS).put(sessionRow(session));
      await committed(tx);
    },

    async recordAnswer(sessionId, answer, cursor, expectedRevision) {
      return writeSession(sessionId, expectedRevision, (current) => ({
        ...current,
        status: 'in-progress',
        answers: { ...current.answers, [answer.questionId]: answer },
        cursor,
        updatedAt: answer.answeredAt,
      }));
    },

    async updateSession(next, expectedRevision) {
      return writeSession(next.id, expectedRevision, () => next);
    },

    async deleteSession(sessionId) {
      const tx = db.transaction(SESSIONS, 'readwrite');
      tx.objectStore(SESSIONS).delete(sessionId);
      await committed(tx);
    },

    async completeSession(session, result) {
      const tx = db.transaction([SESSIONS, RESULTS], 'readwrite');
      tx.objectStore(SESSIONS).put(sessionRow({ ...session, status: 'completed' }));
      const row: ResultRow = {
        slot: LATEST_RESULT_KEY,
        schemaVersion: RESULT_SCHEMA_VERSION,
        data: result,
      };
      tx.objectStore(RESULTS).put(row);
      await committed(tx);
    },

    async getLatestResult() {
      const tx = db.transaction(RESULTS, 'readonly');
      const row: unknown = await request(tx.objectStore(RESULTS).get(LATEST_RESULT_KEY));
      return row === undefined ? null : migrateRecord(row, resultPlan);
    },

    close() {
      db.close();
    },
  };
}
