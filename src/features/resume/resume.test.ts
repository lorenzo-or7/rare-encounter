import type { QuestionBankVersion, QuestionId } from '../../domain/questions';
import type { EncounterResult } from '../../domain/results';
import type { EncounterStore } from '../../storage/encounter-store';
import { createSession } from '../quiz/flow';
import { PREVIEW_SOURCE } from '../quiz/preview/preview-bank';
import { assessSession, bannerFor, loadStoredState } from './resume';

const NOW = '2026-10-28T10:00:00.000Z';
const session = createSession(60, PREVIEW_SOURCE, 's1', NOW);
const result = { status: 'current', value: {} as EncounterResult } as const;

describe('resume', () => {
  it('continues a readable session written for these questions', () => {
    expect(assessSession({ status: 'current', value: session }, PREVIEW_SOURCE)).toEqual({
      kind: 'session',
      session,
    });
    expect(assessSession({ status: 'migrated', value: session, from: 1 }, PREVIEW_SOURCE).kind).toBe(
      'session',
    );
    expect(assessSession(null, PREVIEW_SOURCE)).toEqual({ kind: 'none' });
  });

  it('sends unreadable or newer data to assisted recovery, keeping its id', () => {
    const raw = { id: 'x', schemaVersion: 9, data: { answers: { q1: {}, q2: {} } } };
    expect(
      assessSession({ status: 'needs-restart', reason: 'newer-schema', raw }, PREVIEW_SOURCE),
    ).toEqual({ kind: 'recovery', reason: 'newer-schema', sessionId: 'x', answered: 2 });
    expect(
      assessSession({ status: 'needs-restart', reason: 'invalid', raw: 'garbage' }, PREVIEW_SOURCE),
    ).toEqual({ kind: 'recovery', reason: 'invalid', sessionId: null, answered: null });
  });

  it('treats a session written for other questions as needing recovery', () => {
    const otherBank = { ...session, bankVersion: 'bank-2' as QuestionBankVersion };
    const unknownQuestion = {
      ...session,
      questionIds: [...session.questionIds.slice(1), 'gone' as QuestionId],
    };
    for (const value of [otherBank, unknownQuestion]) {
      expect(assessSession({ status: 'current', value }, PREVIEW_SOURCE)).toMatchObject({
        kind: 'recovery',
        reason: 'changed',
        sessionId: 's1',
      });
    }
  });

  it('puts an unfinished session ahead of the last result', () => {
    expect(bannerFor({ kind: 'session', session }, result)).toBe('session');
    expect(
      bannerFor({ kind: 'recovery', reason: 'invalid', sessionId: null, answered: null }, result),
    ).toBe('recovery');
    expect(bannerFor({ kind: 'none' }, result)).toBe('result');
    expect(bannerFor({ kind: 'none' }, null)).toBeNull();
    expect(bannerFor({ kind: 'unreachable' }, null)).toBe('unreachable');
  });

  it('reports storage that cannot be opened instead of pretending nothing is there', async () => {
    const failing = () => Promise.reject(new Error('blocked'));
    expect(await loadStoredState(failing, PREVIEW_SOURCE)).toEqual({
      state: { kind: 'unreachable' },
      store: null,
    });
    const store = {
      getUnfinishedSession: () => Promise.resolve({ status: 'current', value: session }),
    } as unknown as EncounterStore;
    expect((await loadStoredState(() => Promise.resolve(store), PREVIEW_SOURCE)).state.kind).toBe(
      'session',
    );
  });

  it('opens nothing on a first visit, when no database exists yet', async () => {
    const openStore = vi.fn(() => Promise.reject(new Error('should not open')));
    const loaded = await loadStoredState(openStore, PREVIEW_SOURCE, {
      exists: () => Promise.resolve(false),
    });
    expect(loaded.state).toEqual({ kind: 'none' });
    expect(openStore).not.toHaveBeenCalled();
  });

  it('reports storage that never answers as unreachable instead of waiting forever', async () => {
    const never = () => new Promise<EncounterStore>(() => undefined);
    const loaded = await loadStoredState(never, PREVIEW_SOURCE, { timeoutMs: 20 });
    expect(loaded.state).toEqual({ kind: 'unreachable' });
  });
});
