import { expect, test, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

const shot = (name: string) => `test-results/screens/${test.info().project.name}-${name}.png`;
const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 900;
const step = (page: Page) => page.locator('.quiz__step');
const answers = (page: Page) => page.locator('.question .answer');
const progress = (page: Page) => page.getByRole('progressbar', { name: 'Progress' });
// The live question's prompt: while the previous view slides away it is inert, not gone.
const prompt = (page: Page) =>
  page.locator('.question:not([inert])').getByRole('heading', { level: 1 });

const fullShot = async (page: Page, name: string) => {
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot(name), fullPage: true });
};

async function startQuiz(page: Page, depth = 0) {
  await page.goto('/encounter');
  await page.locator('.mode-option').nth(depth).click();
  await page.getByRole('button', { name: 'Confirm depth' }).click();
  await expect(step(page)).toHaveText(/^Question 1 of /);
}

/** Chooses an answer and waits until the next question has fully arrived. */
async function answer(page: Page, option: number) {
  const before = (await step(page).textContent()) ?? '';
  await answers(page).nth(option).click();
  await expect(step(page)).not.toHaveText(before);
  await expect(page.locator('.question')).toHaveCount(1);
}

/** Answers saved in IndexedDB, read independently of the app. */
const storedAnswers = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open('rare-encounter');
        open.onerror = () => {
          reject(new Error('open failed'));
        };
        open.onsuccess = () => {
          const db = open.result;
          const all = db.transaction('sessions').objectStore('sessions').getAll();
          all.onsuccess = () => {
            const rows = all.result as { data: { answers: Record<string, unknown> } }[];
            resolve(rows.reduce((n, row) => n + Object.keys(row.data.answers).length, 0));
            db.close();
          };
        };
      }),
  );

test('header, preview notice and the three formats', async ({ page }) => {
  await startQuiz(page);
  await expect(page.getByText('Preview: sample questions, not the final question bank.')).toBeVisible();
  await expect(progress(page)).toHaveAttribute('aria-valuenow', '0');
  await expect(progress(page)).toHaveAttribute('aria-valuemax', '30');
  await expect(page.getByRole('button', { name: 'Pause' })).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(page.getByRole('button', { name: 'Previous question' })).toBeDisabled();
  await expect(prompt(page)).toBeFocused();

  await expect(page.locator('.question')).toHaveAttribute('data-format', 'text');
  await expect(page.getByRole('group', { name: 'Plans change at the last minute. What do you do?' })).toBeVisible();
  await fullShot(page, 'quiz-text');

  await answer(page, 0);
  await expect(page.locator('.question')).toHaveAttribute('data-format', 'photo');
  await expect(page.locator('.answer__image')).toHaveCount(4);
  await expect(progress(page)).toHaveAttribute('aria-valuenow', '1');
  await expect(page.locator('.quiz-header__count')).toHaveText('1/30');
  await page.waitForTimeout(400);
  await fullShot(page, 'quiz-photo');

  for (let i = 0; i < 4; i++) await answer(page, i % 4);
  await expect(page.locator('.question')).toHaveAttribute('data-format', 'icon-text');
  await expect(page.locator('.answer__icon svg')).toHaveCount(4);
  await expect(progress(page)).toHaveAttribute('aria-valuenow', '5');
  await page.waitForTimeout(400);
  await fullShot(page, 'quiz-icon');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(0);
});

test('selection feedback: Energy Pulse, Spring Press and the chosen state', async ({ page }) => {
  await startQuiz(page);
  const chosen = answers(page).nth(1);
  await chosen.click();
  // While the save and the feedback window run, the choice is shown and one pulse plays.
  await expect(chosen).toHaveAttribute('aria-pressed', 'true');
  await expect(chosen.locator('.answer__pulse')).toHaveCount(1);
  await page.screenshot({ path: shot('quiz-pressed') });
  await expect(step(page)).toHaveText(/^Question 2 of 30$/);

  // Back mirrors the flow and shows the saved answer.
  await page.getByRole('button', { name: 'Previous question' }).click();
  await expect(step(page)).toHaveText(/^Question 1 of 30$/);
  await expect(page.locator('.question').last()).toHaveAttribute('data-direction', '-1');
  await expect(page.locator('.question').last().locator('.answer').nth(1)).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.waitForTimeout(500);
  await fullShot(page, 'quiz-selected');

  await page.getByRole('button', { name: 'Next question' }).click();
  await expect(step(page)).toHaveText(/^Question 2 of 30$/);
  await expect(page.locator('.question').last()).toHaveAttribute('data-direction', '1');
});

test('auto-advance waits for a committed save; a failed save keeps the answer', async ({ page }) => {
  // Lets the test make IndexedDB writes fail on demand, as a full disk or a revoked
  // permission would.
  await page.addInitScript(() => {
    // Kept unbound on purpose: it is re-applied to each store with `put.apply(this, …)`.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<typeof put>) {
      if ((window as unknown as { failSaves?: boolean }).failSaves) {
        throw new DOMException('Simulated failure', 'QuotaExceededError');
      }
      return put.apply(this, args);
    };
  });
  await startQuiz(page);
  await page.evaluate(() => {
    (window as unknown as { failSaves: boolean }).failSaves = true;
  });

  await answers(page).nth(2).click();
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('This answer was not saved, so the quiz stayed here.');
  await expect(step(page)).toHaveText(/^Question 1 of 30$/);
  await expect(progress(page)).toHaveAttribute('aria-valuenow', '0');
  await expect(answers(page).nth(2)).toHaveAttribute('aria-pressed', 'true');
  expect(await storedAnswers(page)).toBe(0);
  await fullShot(page, 'quiz-save-error');

  await page.evaluate(() => {
    (window as unknown as { failSaves: boolean }).failSaves = false;
  });
  await alert.getByRole('button', { name: 'Try again' }).click();
  await expect(step(page)).toHaveText(/^Question 2 of 30$/);
  await expect(alert).toHaveCount(0);
  expect(await storedAnswers(page)).toBe(1);
});

test('a double click records one answer and moves one question', async ({ page }) => {
  await startQuiz(page);
  await answers(page).nth(0).dblclick();
  await expect(step(page)).toHaveText(/^Question 2 of 30$/);
  await page.waitForTimeout(700);
  await expect(step(page)).toHaveText(/^Question 2 of 30$/);
  await expect(progress(page)).toHaveAttribute('aria-valuenow', '1');
  expect(await storedAnswers(page)).toBe(1);
});

test('keyboard: Enter chooses, focus moves to the next prompt', async ({ page }) => {
  test.skip(!isDesktop(page), 'Keyboard path checked on the desktop layout');
  await startQuiz(page);
  // Start from where the screen puts focus: the first prompt.
  await expect(prompt(page)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(answers(page).nth(0)).toBeFocused();
  await expect(answers(page).nth(0)).toHaveCSS('outline-style', 'solid');
  await page.screenshot({ path: shot('quiz-focus') });
  await page.keyboard.press('Enter');
  await expect(step(page)).toHaveText(/^Question 2 of 30$/);
  await expect(prompt(page)).toBeFocused();
  await expect(prompt(page)).toHaveText('Which landscape draws you in?');
});

test('changing language mid-quiz keeps the answers', async ({ page }) => {
  await startQuiz(page);
  await answer(page, 0);
  await answer(page, 3);
  await page.getByRole('button', { name: 'Open settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await dialog.getByRole('radio', { name: 'Português (Brasil)' }).check();
  // The dialog itself is now in Portuguese.
  await page.getByRole('dialog', { name: 'Configurações' }).getByRole('button', { name: 'Fechar' }).click();
  await expect(prompt(page)).toHaveText('O que mais importa em uma amizade?');
  await expect(step(page)).toHaveText('Pergunta 3 de 30');
  await expect(page.getByText('Prévia: perguntas de exemplo, não o banco final.')).toBeVisible();
  await expect(progress(page)).toHaveAttribute('aria-valuenow', '2');
  expect(await storedAnswers(page)).toBe(2);
  await fullShot(page, 'quiz-pt-BR');
});

test('storage that cannot save stops the start, honestly', async ({ page }) => {
  await page.addInitScript(() => {
    indexedDB.open = () => {
      throw new DOMException('Simulated: storage blocked', 'SecurityError');
    };
  });
  await page.goto('/encounter');
  await page.locator('.mode-option').nth(1).click();
  await page.getByRole('button', { name: 'Confirm depth' }).click();
  await expect(page.getByRole('alert')).toContainText(
    "This browser can't save your progress right now, so the encounter can't start.",
  );
  await expect(page.locator('.question')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: /The Journey/ })).toBeChecked();
  await expect(page.getByRole('radio', { name: /The Journey/ })).toBeEnabled();
  await fullShot(page, 'quiz-storage-blocked');
});

test('a whole preview run ends without a result', async ({ page }) => {
  test.skip(!isDesktop(page), 'Long run checked once, on desktop');
  test.setTimeout(90_000);
  await startQuiz(page);
  for (let i = 0; i < 29; i++) await answer(page, i % 4);
  await answers(page).nth(0).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Your 30 answers are saved' })).toBeVisible();
  await expect(page.getByText('Sample questions never produce a result.')).toBeVisible();
  await expect(progress(page)).toHaveAttribute('aria-valuenow', '30');
  expect(await storedAnswers(page)).toBe(30);
  await fullShot(page, 'quiz-complete');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no pulse, no slide, no press scale; the chosen state still shows', async ({ page }) => {
    await startQuiz(page);
    const chosen = answers(page).nth(0);
    await chosen.click();
    await expect(chosen).toHaveAttribute('aria-pressed', 'true');
    const pulse = chosen.locator('.answer__pulse');
    if ((await pulse.count()) > 0) await expect(pulse).toBeHidden();
    await expect(step(page)).toHaveText(/^Question 2 of 30$/);
    await expect(page.locator('.question')).toHaveCount(1);
    const transform = await page.locator('.question').evaluate((el) => getComputedStyle(el).transform);
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
    await fullShot(page, 'quiz-reduced-motion');
  });
});

test.describe('narrow phones', () => {
  for (const width of [320, 360, 375]) {
    test(`questions fit at ${String(width)} px`, async ({ page }) => {
      test.skip(test.info().project.name !== 'mobile', 'Width sweep runs once, on the phone project');
      await page.setViewportSize({ width, height: 740 });
      await startQuiz(page);
      for (let i = 0; i < 6; i++) {
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `question ${String(i + 1)}`).toBeLessThanOrEqual(0);
        if (i === 1) await fullShot(page, `quiz-photo-${String(width)}`);
        if (i < 5) await answer(page, i % 4);
      }
      await fullShot(page, `quiz-icon-${String(width)}`);
    });
  }
});
