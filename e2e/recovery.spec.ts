import { expect, test, type Page } from '@playwright/test';
import {
  allowSaveFailures,
  answer,
  answers,
  fullShot,
  isDesktop,
  progress,
  seedRow,
  setSaveFailures,
  shot,
  startQuiz,
  step,
  storedSessions,
} from './helpers';

test.use({ locale: 'en-US' });

// The banner loads after the landing's entry and WebGL fibers, which run in software in
// headless Chromium; measured 4–8 s on the emulated tablet with two tabs open.
const slowExpect = expect.configure({ timeout: 30_000 });

const pauseDialog = (page: Page) => page.getByRole('dialog', { name: 'Paused' });
const banner = (page: Page) => page.getByRole('complementary', { name: 'Saved encounter' });
const answerIds = async (page: Page) => {
  const row = (await storedSessions(page)).at(0);
  return Object.fromEntries(
    Object.entries(row?.data.answers ?? {}).map(([k, v]) => [k, v?.answerId]),
  );
};

async function saveAndLeave(page: Page) {
  await page.getByRole('button', { name: 'Pause' }).click();
  await pauseDialog(page).getByRole('button', { name: 'Save and leave' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('pause', () => {
  test('summary, Escape continues and focus returns to Pause', async ({ page }) => {
    await startQuiz(page);
    await answer(page, 0);
    await answer(page, 1);
    const pause = page.getByRole('button', { name: 'Pause' });
    await pause.click();
    const dialog = pauseDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('A Glimpse: 2 of 30 answered.');
    await expect(dialog).toContainText('Every answer so far is saved in this browser.');
    await page.waitForTimeout(450);
    await page.screenshot({ path: shot('pause') });

    // The page behind the modal is inert: tabbing reaches only the dialog's controls (the
    // native dialog may also hand focus to the browser's own UI, never to the page).
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const where = await dialog.evaluate((d) =>
        d.contains(document.activeElement)
          ? 'dialog'
          : document.activeElement === document.body
            ? 'browser'
            : 'page',
      );
      expect(where).not.toBe('page');
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(pause).toBeFocused();
    await expect(step(page)).toHaveText('Question 3 of 30');
  });

  test('Start over asks first, then deletes and returns to Preparation', async ({ page }) => {
    await startQuiz(page);
    await answer(page, 0);
    await answer(page, 2);
    await page.getByRole('button', { name: 'Pause' }).click();
    await pauseDialog(page).getByRole('button', { name: 'Start over' }).click();
    const keep = pauseDialog(page).getByRole('button', { name: 'Keep my answers' });
    await expect(keep).toBeFocused();
    await expect(pauseDialog(page)).toContainText(
      'This deletes your 2 answers from this browser. It cannot be undone.',
    );
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot('pause-restart') });

    await keep.click();
    await expect(pauseDialog(page).getByRole('button', { name: 'Start over' })).toBeFocused();
    expect((await storedSessions(page)).length).toBe(1);

    await pauseDialog(page).getByRole('button', { name: 'Start over' }).click();
    await pauseDialog(page).getByRole('button', { name: 'Delete and start over' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Choose your depth' })).toBeVisible();
    expect(await storedSessions(page)).toHaveLength(0);
    expect(
      await page.evaluate(() => localStorage.getItem('rare-encounter:active-session')),
    ).toBeNull();
  });
});

test('Save and leave, then continue from the landing banner', async ({ page }) => {
  await startQuiz(page, 1);
  await answer(page, 0);
  await answer(page, 3);
  await answer(page, 1);
  const before = await answerIds(page);
  await saveAndLeave(page);
  expect((await storedSessions(page)).at(0)?.data.status).toBe('paused');

  await slowExpect(banner(page)).toBeVisible();
  await slowExpect(banner(page)).toContainText('Your encounter is waiting');
  await slowExpect(banner(page)).toContainText('The Journey: 3 of 60 answered.');
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot('banner') });

  await banner(page).getByRole('button', { name: 'Continue the encounter' }).click();
  await expect(page).toHaveURL(/\/encounter$/);
  await expect(step(page)).toHaveText('Question 4 of 60');
  await expect(progress(page)).toHaveAttribute('aria-valuenow', '3');
  await expect(progress(page)).toHaveAttribute('aria-valuemax', '60');
  // Same depth, same answer ids.
  expect(await answerIds(page)).toEqual(before);
  await answer(page, 0);
  expect((await storedSessions(page)).at(0)?.data.status).toBe('in-progress');
});

test('a reload during the questions resumes at the same place', async ({ page }) => {
  await startQuiz(page);
  for (let i = 0; i < 4; i++) await answer(page, i % 4);
  await page.reload();
  await expect(step(page)).toHaveText('Question 5 of 30');
  await expect(progress(page)).toHaveAttribute('aria-valuenow', '4');
});

test('closing the banner keeps the encounter', async ({ page, context }) => {
  await startQuiz(page);
  await answer(page, 0);
  await saveAndLeave(page);
  await banner(page).getByRole('button', { name: 'Close notice' }).click();
  await slowExpect(banner(page)).toBeHidden();
  expect(Object.keys(await answerIds(page))).toHaveLength(1);
  // Closed for this tab only.
  await page.reload();
  await page.waitForTimeout(1200);
  await slowExpect(banner(page)).toHaveCount(0);
  const other = await context.newPage();
  await other.goto('/');
  await slowExpect(banner(other)).toBeVisible();
});

test('Begin with a saved encounter offers to continue it or start anew', async ({ page }) => {
  await startQuiz(page, 2);
  await answer(page, 0);
  await saveAndLeave(page);
  await page.locator('#begin').evaluate((el) => {
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await page.getByRole('button', { name: 'Begin your journey' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'An encounter is in progress' }),
  ).toBeVisible();
  await expect(page.getByText('Deep Connection: 1 of 90 answered.')).toBeVisible();
  await fullShot(page, 'resume-panel');

  await page.getByRole('button', { name: 'Start a new encounter' }).click();
  await expect(page.getByRole('button', { name: 'Keep my answers' })).toBeFocused();
  await page.getByRole('button', { name: 'Keep my answers' }).click();
  expect(await storedSessions(page)).toHaveLength(1);

  await page.getByRole('button', { name: 'Continue the encounter' }).click();
  await expect(step(page)).toHaveText('Question 2 of 90');
});

test('browser Back opens Pause once; a second Back leaves, keeping the session', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#begin').evaluate((el) => {
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await page.getByRole('button', { name: 'Begin your journey' }).click();
  await page.locator('.mode-option').nth(0).click();
  await page.getByRole('button', { name: 'Confirm depth' }).click();
  await answer(page, 0);

  await page.goBack();
  await expect(pauseDialog(page)).toBeVisible();
  await expect(page).toHaveURL(/\/encounter$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await slowExpect(banner(page)).toBeVisible();
  expect(Object.keys(await answerIds(page))).toHaveLength(1);
});

test('going back and changing an answer keeps the sequence and progress consistent', async ({
  page,
}) => {
  await startQuiz(page);
  await answer(page, 0);
  await answer(page, 0);
  await answer(page, 0);
  const before = (await storedSessions(page)).at(0);
  await page.getByRole('button', { name: 'Previous question' }).click();
  await page.getByRole('button', { name: 'Previous question' }).click();
  await expect(step(page)).toHaveText('Question 2 of 30');
  await expect(answers(page).nth(0)).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(400);
  await fullShot(page, 'edit-revisit');

  await answers(page).nth(2).click();
  await expect(step(page)).toHaveText('Question 3 of 30');
  await expect(progress(page)).toHaveAttribute('aria-valuenow', '3');
  const after = (await storedSessions(page)).at(0);
  const second = before?.data.questionIds[1] ?? '';
  expect(after?.data.answers[second]?.answerId).not.toBe(before?.data.answers[second]?.answerId);
  expect(after?.data.questionIds).toEqual(before?.data.questionIds);
  expect(Object.keys(after?.data.answers ?? {})).toHaveLength(3);
});

test('two tabs: a change in one stops the other until it reloads', async ({ page, context }) => {
  await startQuiz(page);
  await answer(page, 0);

  const other = await context.newPage();
  await other.goto('/encounter');
  await other.getByRole('button', { name: 'Continue the encounter' }).click();
  await expect(step(other)).toHaveText('Question 2 of 30');

  await answer(page, 1);
  const alert = other.getByRole('alert');
  await expect(alert).toContainText('This encounter changed in another tab.');
  await fullShot(other, 'two-tabs');
  // The stale tab cannot overwrite: its choice does nothing.
  await answers(other).nth(3).click();
  await other.waitForTimeout(600);
  await expect(step(other)).toHaveText('Question 2 of 30');
  expect(Object.keys(await answerIds(page))).toHaveLength(2);

  await alert.getByRole('button', { name: 'Reload' }).click();
  await expect(step(other)).toHaveText('Question 3 of 30');
  await expect(progress(other)).toHaveAttribute('aria-valuenow', '2');
});

test('a pause that cannot be stored says so and still lets you leave safely', async ({ page }) => {
  await allowSaveFailures(page);
  await startQuiz(page);
  await answer(page, 0);
  await setSaveFailures(page, true);
  await page.getByRole('button', { name: 'Pause' }).click();
  await pauseDialog(page).getByRole('button', { name: 'Save and leave' }).click();
  const alert = pauseDialog(page).getByRole('alert');
  await expect(alert).toContainText(
    'The pause could not be confirmed. Your 1 saved answers are still stored',
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot('pause-failed') });
  await setSaveFailures(page, false);
  await alert.getByRole('button', { name: 'Leave anyway' }).click();
  await expect(page).toHaveURL(/\/$/);
  await slowExpect(banner(page)).toContainText('A Glimpse: 1 of 30 answered.');
});

test('storage that cannot be opened is reported, not hidden', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'rare-encounter:active-session',
      JSON.stringify({
        schemaVersion: 1,
        data: { sessionId: 's1', mode: 30, answered: 4, total: 30, revision: 4, updatedAt: '' },
      }),
    );
    // Blocked storage blocks listing databases as well as opening them.
    indexedDB.open = () => {
      throw new DOMException('Simulated: storage blocked', 'SecurityError');
    };
    indexedDB.databases = () =>
      Promise.reject(new DOMException('Simulated: storage blocked', 'SecurityError'));
  });
  await page.goto('/');
  await slowExpect(banner(page)).toContainText('Your saved progress cannot be reached right now');
  await slowExpect(banner(page)).toContainText('Nothing has been deleted.');
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot('banner-unreachable') });
  // The marker is only a pointer; it is kept while storage cannot confirm anything.
  expect(
    await page.evaluate(() => localStorage.getItem('rare-encounter:active-session')),
  ).not.toBeNull();

  await page.goto('/encounter');
  await expect(page.getByRole('status').filter({ hasText: 'cannot be reached' })).toBeVisible();
});

test.describe('assisted recovery', () => {
  const foreign = {
    id: 'old',
    schemaVersion: 2,
    data: {
      id: 'old',
      mode: 30,
      status: 'in-progress',
      startedAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:05:00.000Z',
      catalogVersion: 'none',
      bankVersion: 'bank-from-another-version',
      questionIds: Array.from({ length: 30 }, (_, i) => `q${String(i)}`),
      answers: { q0: { questionId: 'q0', answerId: 'a', answeredAt: '2026-10-01T10:05:00.000Z' } },
      cursor: 1,
      revision: 1,
    },
  };

  test('a session written for other questions is kept until you decide', async ({ page }) => {
    await page.goto('/');
    await seedRow(page, foreign);
    await page.reload();
    await slowExpect(banner(page)).toContainText('A saved encounter needs your attention');
    await page.waitForTimeout(500);
    await page.screenshot({ path: shot('banner-recovery') });

    await banner(page).getByRole('button', { name: 'Review it' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'This saved encounter cannot continue' }),
    ).toBeVisible();
    await expect(
      page.getByText('It was saved for questions that this version no longer shows.'),
    ).toBeVisible();
    await expect(page.getByText('Nothing has been deleted.')).toBeVisible();
    await fullShot(page, 'recovery');

    await page.getByRole('link', { name: 'Decide later' }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(await storedSessions(page)).toHaveLength(1);

    await page.goto('/encounter');
    await page.getByRole('button', { name: 'Delete it and start a new encounter' }).click();
    await expect(
      page.getByText('This deletes the saved encounter from this browser.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Delete it and start a new encounter' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Choose your depth' })).toBeVisible();
    expect(await storedSessions(page)).toHaveLength(0);
  });

  test('malformed and newer data go to recovery, never to the quiz', async ({ page }) => {
    await page.goto('/');
    await seedRow(page, { id: 'bad', schemaVersion: 2, data: { mode: 45, answers: 'nope' } });
    await page.goto('/encounter');
    await expect(page.getByText('Its saved data could not be read.')).toBeVisible();
    await fullShot(page, 'recovery-malformed');

    await seedRow(page, {
      id: 'bad',
      schemaVersion: 99,
      data: { updatedAt: '2026-11-01T00:00:00.000Z' },
    });
    await page.goto('/encounter');
    await expect(
      page.getByText('It was saved by a newer version of Rare Encounter.'),
    ).toBeVisible();
    expect(await storedSessions(page)).toHaveLength(1);
  });

  test('a session saved before revisions existed (v1) is migrated and resumes', async ({
    page,
  }) => {
    await startQuiz(page);
    await answer(page, 0);
    await answer(page, 3);
    const before = await answerIds(page);
    // Rewrite the stored row as an earlier build saved it: schema v1, no revision.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const open = indexedDB.open('rare-encounter');
          open.onsuccess = () => {
            const db = open.result;
            const tx = db.transaction('sessions', 'readwrite');
            const store = tx.objectStore('sessions');
            const all = store.getAll();
            all.onsuccess = () => {
              const row = (all.result as { id: string; data: Record<string, unknown> }[]).at(0);
              if (!row) return;
              const data = { ...row.data };
              delete data['revision'];
              store.put({ id: row.id, schemaVersion: 1, data });
            };
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
          };
        }),
    );
    await page.reload();
    await expect(step(page)).toHaveText('Question 3 of 30');
    expect(await answerIds(page)).toEqual(before);
    await answer(page, 0);
    const row = (await storedSessions(page)).at(0);
    expect(row?.schemaVersion).toBe(2);
    expect(row?.data.revision).toBe(1);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('pause and banner work without motion', async ({ page }) => {
    await startQuiz(page);
    await answer(page, 0);
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(pauseDialog(page)).toBeVisible();
    await page.screenshot({ path: shot('pause-reduced-motion') });
    await pauseDialog(page).getByRole('button', { name: 'Save and leave' }).click();
    await slowExpect(banner(page)).toBeVisible();
  });
});

test.describe('es', () => {
  test.use({ locale: 'es' });

  test('the resume banner and pause follow the language', async ({ page }) => {
    await page.goto('/encounter');
    await page.locator('.mode-option').nth(0).click();
    await page.getByRole('button', { name: 'Confirmar profundidad' }).click();
    await answer(page, 0);
    await page.getByRole('button', { name: 'Pausar' }).click();
    await expect(page.getByRole('dialog', { name: 'En pausa' })).toContainText(
      'Un Vistazo: 1 de 30 respondidas.',
    );
    await page.getByRole('button', { name: 'Guardar y salir' }).click();
    await expect(page.getByRole('complementary', { name: 'Encuentro guardado' })).toContainText(
      'Tu encuentro te espera',
    );
    test.skip(!isDesktop(page), 'One capture is enough');
    await page.waitForTimeout(500);
    await page.screenshot({ path: shot('banner-es') });
  });
});
