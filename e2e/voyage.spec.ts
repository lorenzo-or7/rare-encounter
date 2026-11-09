import { expect, test } from '@playwright/test';
import { answer, answers, isDesktop, shot, startQuiz } from './helpers';

/**
 * The cinematic loading between the last answer and the results (Prompt 02). The video is
 * a local-only file (npm run media:setup), so these tests block it and check the static
 * fallback; the timing rules themselves are unit-tested in voyage.test.ts.
 */
test.describe('cinematic loading', () => {
  test.beforeEach(({ page }) => {
    test.skip(!isDesktop(page), 'One full journey per suite is enough; checked on desktop');
  });

  test('shows honest progress, survives a missing video, then hands over and is not replayed', async ({ page }) => {
    test.setTimeout(150_000);
    await page.route('**/media/encounter-loading.mp4', (route) => route.abort());
    await startQuiz(page);
    for (let i = 0; i < 29; i++) await answer(page, i % 4);
    const started = Date.now();
    await answers(page).nth(0).click();

    const voyage = page.locator('.voyage');
    await expect(voyage).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Preparing your encounter…' })).toBeFocused();
    // The video could not load: the static scene stands in, and nothing is broken.
    await expect(voyage).toHaveAttribute('data-video', 'off');
    await expect(page.locator('.voyage__card')).toHaveCount(3);
    const bar = page.getByRole('progressbar', { name: 'Preparing your encounter' });
    await expect(bar).toBeVisible();
    // Partway through, the bar is moving and is not complete.
    await page.waitForTimeout(2500);
    expect(Number(await bar.getAttribute('aria-valuenow'))).toBeLessThan(100);
    await page.screenshot({ path: shot('voyage-fallback') });

    await expect(page.getByRole('heading', { level: 1, name: 'Your three encounters' })).toBeVisible({ timeout: 30_000 });
    // The nominal minimum was respected.
    expect(Date.now() - started).toBeGreaterThanOrEqual(7000);
    await expect(voyage).toHaveCount(0);

    // A stored result opens directly after a reload, without the wait.
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Your three encounters' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.voyage')).toHaveCount(0);
  });
});
