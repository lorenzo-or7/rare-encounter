import { expect, test, type Page } from '@playwright/test';

export const shot = (name: string) =>
  `test-results/screens/${test.info().project.name}-${name}.png`;
export const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 900;
export const step = (page: Page) => page.locator('.quiz__step');
export const answers = (page: Page) => page.locator('.question:not([inert]) .answer');
export const progress = (page: Page) => page.getByRole('progressbar', { name: 'Progress' });

export const fullShot = async (page: Page, name: string) => {
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: shot(name), fullPage: true });
};

/**
 * The question bank picks each session's questions from its id, so tests fix the id to get
 * a known journey on the real bank: for 30 questions, `e2e-session-391` opens with text
 * (pe-028), icon + text second (ae-041) and images fourth (en-002, a fundamental question
 * the adaptive picks never move).
 */
export const E2E_SESSION_ID = 'e2e-session-391';

export async function fixSessionId(page: Page, id = E2E_SESSION_ID) {
  await page.addInitScript((value) => {
    crypto.randomUUID = () => value as `${string}-${string}-${string}-${string}-${string}`;
  }, id);
}

export async function startQuiz(page: Page, depth = 0) {
  await fixSessionId(page);
  await page.goto('/encounter');
  await page.locator('.mode-option').nth(depth).click();
  await page.getByRole('button', { name: 'Confirm depth' }).click();
  await expect(step(page)).toHaveText(/^Question 1 of /);
}

/** Chooses an answer and waits until the next question has fully arrived. */
export async function answer(page: Page, option: number) {
  const before = (await step(page).textContent()) ?? '';
  await answers(page).nth(option).click();
  await expect(step(page)).not.toHaveText(before);
  await expect(page.locator('.question')).toHaveCount(1);
}

export interface StoredSession {
  readonly id: string;
  readonly schemaVersion: number;
  readonly data: {
    readonly status: string;
    readonly mode: number;
    readonly revision?: number;
    readonly questionIds: string[];
    readonly answers: Record<string, { answerId: string } | undefined>;
  };
}

/** Session rows in IndexedDB, read independently of the app. */
export const storedSessions = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<StoredSession[]>((resolve, reject) => {
        const open = indexedDB.open('rare-encounter');
        open.onerror = () => {
          reject(new Error('open failed'));
        };
        open.onupgradeneeded = () => {
          // The app has not created the database: there is nothing stored.
          open.transaction?.abort();
          resolve([]);
        };
        open.onsuccess = () => {
          const db = open.result;
          const all = db.transaction('sessions').objectStore('sessions').getAll();
          all.onsuccess = () => {
            resolve(all.result as StoredSession[]);
            db.close();
          };
        };
      }),
  );

/** Writes a raw row (old, foreign or malformed data) and the marker that points to it. */
export async function seedRow(page: Page, row: unknown) {
  await page.evaluate(
    (value) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('rare-encounter', 1);
        open.onupgradeneeded = () => {
          const sessions = open.result.createObjectStore('sessions', { keyPath: 'id' });
          sessions.createIndex('updatedAt', 'data.updatedAt');
          open.result.createObjectStore('results', { keyPath: 'slot' });
        };
        open.onerror = () => {
          reject(new Error('open failed'));
        };
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('sessions', 'readwrite');
          tx.objectStore('sessions').put(value);
          tx.oncomplete = () => {
            db.close();
            const id = (value as { id: string }).id;
            localStorage.setItem(
              'rare-encounter:active-session',
              JSON.stringify({
                schemaVersion: 1,
                data: { sessionId: id, mode: 30, answered: 0, total: 30, revision: 0, updatedAt: '' },
              }),
            );
            resolve();
          };
        };
      }),
    row,
  );
}

/** Lets a test make IndexedDB writes fail on demand (full disk, revoked permission). */
export async function allowSaveFailures(page: Page) {
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
}

export const setSaveFailures = (page: Page, on: boolean) =>
  page.evaluate((value) => {
    (window as unknown as { failSaves: boolean }).failSaves = value;
  }, on);
