import { IDBFactory } from 'fake-indexeddb';
import type { CatalogVersion } from '../domain/catalog';
import type { AnswerId, QuestionBankVersion, QuestionId } from '../domain/questions';
import type { EncounterResult, Match } from '../domain/results';
import type { QuizSession } from '../domain/session';
import type { SpeciesId } from '../domain/catalog';
import { openEncounterStore, SessionConflictError, type EncounterStore } from './encounter-store';

const session = (overrides: Partial<QuizSession> = {}): QuizSession => ({
  id: 's1',
  mode: 30,
  status: 'in-progress',
  startedAt: '2026-10-28T10:00:00.000Z',
  updatedAt: '2026-10-28T10:00:00.000Z',
  catalogVersion: 'c1' as CatalogVersion,
  bankVersion: 'b1' as QuestionBankVersion,
  questionIds: ['q1', 'q2'] as QuestionId[],
  answers: {},
  cursor: 0,
  revision: 0,
  ...overrides,
});

const match = (kind: Match['kind']): Match => ({
  kind,
  speciesId: 'placeholder' as SpeciesId,
  affinity: 0.5,
  explanation: { drivers: ['personality'] },
});

const result = (sessionId: string): EncounterResult => ({
  sessionId,
  mode: 30,
  completedAt: '2026-10-28T11:00:00.000Z',
  catalogVersion: 'c1' as CatalogVersion,
  bankVersion: 'b1' as QuestionBankVersion,
  engineVersion: 'e0',
  soul: match('soul'),
  hidden: match('hidden'),
  alternatives: [match('alternative')],
});

describe('EncounterStore (IndexedDB)', () => {
  let factory: IDBFactory;
  let store: EncounterStore;

  beforeEach(async () => {
    factory = new IDBFactory();
    store = await openEncounterStore(factory);
  });

  afterEach(() => {
    store.close();
  });

  it('starts empty', async () => {
    expect(await store.getUnfinishedSession()).toBeNull();
    expect(await store.getLatestResult()).toBeNull();
  });

  it('persists each answer durably and survives reopening', async () => {
    await store.putSession(session());
    const next = await store.recordAnswer(
      's1',
      { questionId: 'q1' as QuestionId, answerId: 'a3' as AnswerId, answeredAt: '2026-10-28T10:01:00.000Z' },
      1,
    );
    expect(next.cursor).toBe(1);
    store.close();

    store = await openEncounterStore(factory);
    const recovered = await store.getUnfinishedSession();
    expect(recovered).toMatchObject({ status: 'current', value: { id: 's1', cursor: 1 } });
    expect(recovered?.status === 'current' && recovered.value.answers['q1']?.answerId).toBe('a3');
  });

  it('returns the most recently updated unfinished session', async () => {
    await store.putSession(session({ id: 'old', updatedAt: '2026-10-27T00:00:00.000Z' }));
    await store.putSession(session({ id: 'new', updatedAt: '2026-10-28T00:00:00.000Z' }));
    expect(await store.getUnfinishedSession()).toMatchObject({ value: { id: 'new' } });
  });

  it('keeps only the latest result, replaced on the next completion', async () => {
    await store.putSession(session({ id: 'a' }));
    await store.completeSession(session({ id: 'a' }), result('a'));
    expect(await store.getUnfinishedSession()).toBeNull();
    expect(await store.getLatestResult()).toMatchObject({ value: { sessionId: 'a' } });

    await store.completeSession(session({ id: 'b' }), result('b'));
    expect(await store.getLatestResult()).toMatchObject({ value: { sessionId: 'b' } });
  });

  it('deletes a session only when asked', async () => {
    await store.putSession(session());
    await store.deleteSession('s1');
    expect(await store.getUnfinishedSession()).toBeNull();
  });

  it('flags unreadable records for assisted restart without deleting them', async () => {
    const raw = { id: 'x', schemaVersion: 99, data: { updatedAt: '2026-10-29T00:00:00.000Z' } };
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = factory.open('rare-encounter', 1);
      req.onsuccess = () => { resolve(req.result); };
      req.onerror = () => { reject(new Error('open failed')); };
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction('sessions', 'readwrite');
      tx.objectStore('sessions').put(raw);
      tx.oncomplete = () => { resolve(); };
    });
    db.close();

    expect(await store.getUnfinishedSession()).toEqual({
      status: 'needs-restart',
      reason: 'newer-schema',
      raw,
    });
    await expect(
      store.recordAnswer('x', { questionId: 'q1' as QuestionId, answerId: 'a' as AnswerId, answeredAt: '' }, 1),
    ).rejects.toThrow(/cannot be updated/);
    expect(await store.getUnfinishedSession()).toMatchObject({ raw });
  });

  describe('revisions, conflicts and migration (CP03)', () => {
    const putRaw = async (row: unknown) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = factory.open('rare-encounter', 1);
        req.onsuccess = () => {
          resolve(req.result);
        };
        req.onerror = () => {
          reject(new Error('open failed'));
        };
      });
      await new Promise<void>((resolve) => {
        const tx = db.transaction('sessions', 'readwrite');
        tx.objectStore('sessions').put(row);
        tx.oncomplete = () => {
          resolve();
        };
      });
      db.close();
    };
    const a1 = { questionId: 'q1' as QuestionId, answerId: 'a' as AnswerId, answeredAt: '2026-10-28T10:01:00.000Z' };

    it('increments the revision on every write and refuses a stale one without writing', async () => {
      await store.putSession(session());
      const first = await store.recordAnswer('s1', a1, 1, 0);
      expect(first.revision).toBe(1);
      // Another tab still believes the revision is 0.
      await expect(store.recordAnswer('s1', { ...a1, answerId: 'b' as AnswerId }, 1, 0)).rejects.toBeInstanceOf(
        SessionConflictError,
      );
      const stored = await store.getUnfinishedSession();
      expect(stored).toMatchObject({ status: 'current', value: { revision: 1, answers: { q1: { answerId: 'a' } } } });
    });

    it('reports a session removed elsewhere as missing', async () => {
      await store.putSession(session());
      await store.deleteSession('s1');
      await expect(store.recordAnswer('s1', a1, 1, 0)).rejects.toMatchObject({ reason: 'missing' });
    });

    it('updates a whole session only at the expected revision', async () => {
      await store.putSession(session());
      const paused = await store.updateSession({ ...session(), status: 'paused' }, 0);
      expect(paused).toMatchObject({ status: 'paused', revision: 1 });
      await expect(store.updateSession({ ...session(), status: 'paused' }, 0)).rejects.toBeInstanceOf(
        SessionConflictError,
      );
      // Answering again resumes it.
      expect(await store.recordAnswer('s1', a1, 1, 1)).toMatchObject({ status: 'in-progress', revision: 2 });
    });

    it('migrates a v1 session (saved before revisions existed) instead of discarding it', async () => {
      const v1: Record<string, unknown> = { ...session({ answers: { q1: a1 }, cursor: 1 }) };
      delete v1['revision'];
      await putRaw({ id: 's1', schemaVersion: 1, data: v1 });
      const outcome = await store.getUnfinishedSession();
      expect(outcome).toMatchObject({ status: 'migrated', from: 1, value: { revision: 0, answers: { q1: a1 } } });
      // And it can be written to: the next write stores it as v2.
      expect((await store.recordAnswer('s1', { ...a1, questionId: 'q2' as QuestionId }, 2, 0)).revision).toBe(1);
      expect(await store.getUnfinishedSession()).toMatchObject({ status: 'current' });
    });

    it('flags malformed data for assisted recovery and never deletes it', async () => {
      const raw = { id: 'bad', schemaVersion: 2, data: { mode: 45, answers: 'nope' } };
      await putRaw(raw);
      expect(await store.getUnfinishedSession()).toEqual({ status: 'needs-restart', reason: 'invalid', raw });
      expect(await store.getUnfinishedSession()).toMatchObject({ raw });
    });
  });
});
