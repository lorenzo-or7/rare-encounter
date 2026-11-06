import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { IDBFactory } from 'fake-indexeddb';
import { MotionGlobalConfig } from 'motion/react';
import { PreferencesProvider } from '../../app/PreferencesProvider';
import type { AnswerId, QuestionId } from '../../domain/questions';
import type { QuizSession } from '../../domain/session';
import { openEncounterStore, type EncounterStore } from '../../storage/encounter-store';
import { ADAPTIVE_FIXTURE } from '../../test/fixtures/adaptive-source';
import { createSession } from './flow';
import { QuizScreen } from './QuizScreen';

/**
 * Editing with dependencies, through the real screen and the real IndexedDB store, using
 * the test-only adaptive fixture (X1/X2 follow f02). The preview questions have no
 * dependencies, so this path is covered here rather than in the browser suite.
 */
const NOW = '2026-10-28T10:00:00.000Z';
const BEFORE_EDIT = ['f01', 'f02', 'f03', 'f04', 'f05', 'f06', 'xa1', 'xa2', 'f07'];

function answeredSession(): QuizSession {
  const base = createSession(30, ADAPTIVE_FIXTURE, 's1', NOW);
  const answers: Record<string, QuizSession['answers'][string]> = {};
  for (const id of BEFORE_EDIT) {
    answers[id] = { questionId: id as QuestionId, answerId: 'a' as AnswerId, answeredAt: NOW };
  }
  return { ...base, answers, cursor: BEFORE_EDIT.length };
}

describe('QuizScreen: editing an answer that later questions depend on', () => {
  let store: EncounterStore;

  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  beforeEach(async () => {
    store = await openEncounterStore(new IDBFactory());
    await store.putSession(answeredSession());
  });
  afterEach(() => {
    store.close();
  });

  async function openAtF02() {
    render(
      <PreferencesProvider>
        <QuizScreen
          store={store}
          source={ADAPTIVE_FIXTURE}
          session={answeredSession()}
          onLeave={vi.fn()}
          onRestart={vi.fn()}
        />
      </PreferencesProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Fixture question f08' })).toBeVisible();
    });
    // Back to f02 (index 1), one question at a time.
    for (let i = 0; i < 8; i++)
      fireEvent.click(screen.getByRole('button', { name: 'Previous question' }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Fixture question f02' })).toBeVisible();
    });
  }

  it('asks first, says how many answers will be cleared, and can keep the old answer', async () => {
    await openAtF02();
    fireEvent.click(screen.getByRole('button', { name: 'Answer b' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change this answer?' });
    expect(dialog).toHaveTextContent('2 later answers will be cleared');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Keep previous answer' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Change this answer?' })).toBeNull();
    });
    // Nothing was written.
    const stored = await store.getUnfinishedSession();
    expect(stored).toMatchObject({ status: 'current', value: { revision: 0 } });
    expect(screen.getByRole('button', { name: 'Answer a' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('on confirmation clears only the dependent answers and keeps progress consistent', async () => {
    await openAtF02();
    fireEvent.click(screen.getByRole('button', { name: 'Answer b' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change this answer?' });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Change answer' }));
      await new Promise((r) => setTimeout(r, 400));
    });

    const outcome = await store.getUnfinishedSession();
    if (outcome?.status !== 'current') throw new Error('expected a readable session');
    const s = outcome.value;
    expect(s.revision).toBe(1);
    expect(s.answers['f02']?.answerId).toBe('b');
    expect(s.answers['xa1']).toBeUndefined();
    expect(s.answers['xa2']).toBeUndefined();
    expect(s.answers['f07']).toBeDefined();
    expect(s.questionIds.slice(6, 8)).toEqual(['xb1', 'xb2']);
    // 9 answered before, 2 cleared: the header agrees with the store.
    expect(screen.getByRole('progressbar', { name: 'Progress' })).toHaveAttribute(
      'aria-valuenow',
      '7',
    );
    // The flow moves on to f03, the question after the edited one.
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Fixture question f03' })).toBeVisible();
    });
  });
});

describe('QuizScreen: answering forward updates adaptive picks', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  it('stores the new sequence with the answer that changes it, clearing nothing', async () => {
    const store = await openEncounterStore(new IDBFactory());
    const fresh = createSession(30, ADAPTIVE_FIXTURE, 's2', NOW);
    await store.putSession(fresh);
    render(
      <PreferencesProvider>
        <QuizScreen store={store} source={ADAPTIVE_FIXTURE} session={fresh} onLeave={vi.fn()} onRestart={vi.fn()} />
      </PreferencesProvider>,
    );
    // f01 → a, then f02 → b: the pair after f06 must become xb1/xb2.
    for (const [name, next] of [
      ['Answer a', 'Fixture question f02'],
      ['Answer b', 'Fixture question f03'],
    ] as const) {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name }));
        await new Promise((r) => setTimeout(r, 400));
      });
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: next })).toBeVisible();
      });
    }
    const outcome = await store.getUnfinishedSession();
    if (outcome?.status !== 'current') throw new Error('expected a readable session');
    expect(outcome.value.questionIds.slice(6, 8)).toEqual(['xb1', 'xb2']);
    expect(Object.keys(outcome.value.answers).sort()).toEqual(['f01', 'f02']);
    expect(outcome.value.revision).toBe(2);
    store.close();
  });
});
