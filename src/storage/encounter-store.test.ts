import { IDBFactory } from 'fake-indexeddb';
import type { CatalogVersion } from '../domain/catalog';
import type { AnswerId, QuestionBankVersion, QuestionId } from '../domain/questions';
import type { EncounterResult, Match } from '../domain/results';
import type { QuizSession } from '../domain/session';
import type { SpeciesId } from '../domain/catalog';
import { openEncounterStore, type EncounterStore } from './encounter-store';

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
});
