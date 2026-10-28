import { expect, test, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

const shot = (name: string) => `test-results/screens/${test.info().project.name}-${name}.png`;
const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 900;
const options = (page: Page) => page.getByRole('radiogroup', { name: 'Choose your depth' });
const radio = (page: Page, name: RegExp) => options(page).getByRole('radio', { name });
const confirm = (page: Page) => page.getByRole('button', { name: 'Confirm depth' });
// Full-page captures start from the top, so fixed chrome is not stitched over the content.
const fullShot = async (page: Page, name: string) => {
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: shot(name), fullPage: true });
};
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('Liquid Flow carries the closing CTA into Preparation', async ({ page }) => {
  await page.goto('/');
  await page.locator('#begin').evaluate((el) => {
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Begin your journey' }).click();

  // Frame sequence of the transition (no video is committed).
  const layer = page.locator('.liquid-flow');
  await expect(layer).toHaveCount(1);
  for (let i = 1; i <= 4; i++) {
    await page.screenshot({ path: shot(`flow-${String(i)}`) });
    await page.waitForTimeout(220);
  }

  await expect(page).toHaveURL(/\/encounter$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Choose your depth' })).toBeFocused();
  await expect(layer).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page).toHaveTitle('Choose your depth | Rare Encounter');
  await page.screenshot({ path: shot('flow-5') });

  // Browser Back returns to the landing; the brand link does too.
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Somewhere out there');
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1, name: 'Choose your depth' })).toBeVisible();
  await page.getByRole('banner').getByRole('link', { name: 'Rare Encounter' }).first().click();
  await expect(page).toHaveURL(/\/$/);
});

test('three depths, nothing preselected, confirm unavailable until a choice', async ({ page }) => {
  await page.goto('/encounter');
  await expect(options(page).getByRole('radio')).toHaveCount(3);
  await expect(radio(page, /^A Glimpse 30 questions$/)).toHaveAccessibleDescription(
    '21 core questions and 9 that adapt to your answers',
  );
  await expect(radio(page, /^The Journey 60 questions$/)).toBeVisible();
  await expect(radio(page, /^Deep Connection 90 questions$/)).toBeVisible();
  for (const r of await options(page).getByRole('radio').all()) await expect(r).not.toBeChecked();

  const button = confirm(page);
  await expect(button).toHaveAttribute('aria-disabled', 'true');
  await expect(button).toHaveAccessibleDescription('Choose a depth to continue.');
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Choose a depth to continue.');
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  await fullShot(page, 'prep-idle');
});

test('keyboard: Tab into the group, arrows choose, focus ring is visible', async ({ page }) => {
  test.skip(!isDesktop(page), 'Keyboard path checked on the desktop layout');
  await page.goto('/encounter');
  await page.getByRole('heading', { level: 1 }).focus();
  // Brand link and settings sit before the main content; tab until the group is reached.
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    if (await radio(page, /A Glimpse/).evaluate((el) => el === document.activeElement)) break;
  }
  await expect(radio(page, /A Glimpse/)).toBeFocused();
  // Focus alone selects nothing.
  await expect(radio(page, /A Glimpse/)).not.toBeChecked();
  const glimpseCard = page.locator('.mode-option').nth(0).locator('.border-glow-card');
  await expect(glimpseCard).toHaveCSS('outline-style', 'solid');
  await page.screenshot({ path: shot('prep-focus') });

  await page.keyboard.press('ArrowRight');
  await expect(radio(page, /The Journey/)).toBeChecked();
  await expect(radio(page, /The Journey/)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(radio(page, /Deep Connection/)).toBeChecked();
  await page.screenshot({ path: shot('prep-keyboard-selected') });

  await page.keyboard.press('Tab');
  await expect(confirm(page)).toBeFocused();
  await expect(confirm(page)).toHaveAttribute('aria-disabled', 'false');
});

test('pointer selection, confirm, and choosing again', async ({ page }) => {
  await page.goto('/encounter');
  await page.locator('.mode-option').nth(1).click();
  await expect(radio(page, /The Journey/)).toBeChecked();
  await expect(page.locator('.mode-option').nth(1)).toHaveAttribute('data-checked', 'true');
  await expect(page.locator('.mode-option__mark').nth(1)).toHaveCSS('opacity', '1');
  await page.waitForTimeout(300);
  await fullShot(page, 'prep-selected');

  await confirm(page).click();
  await expect(page.getByRole('status')).toContainText('The Journey: confirmed, 60 questions.');
  await expect(page.getByRole('status')).toContainText(
    'Not available yet. Your questions will start here once they open.',
  );
  // Locked: no depth can change, and focus lands on the control that replaced Confirm.
  for (const r of await options(page).getByRole('radio').all()) await expect(r).toBeDisabled();
  const again = page.getByRole('button', { name: 'Choose another depth' });
  await expect(again).toBeFocused();
  await page.waitForTimeout(300);
  await fullShot(page, 'prep-confirmed');
  // Nothing was started or stored.
  expect(await page.evaluate(() => indexedDB.databases().then((dbs) => dbs.length))).toBe(0);

  await again.click();
  await expect(confirm(page)).toBeFocused();
  await expect(radio(page, /The Journey/)).toBeChecked();
  await expect(radio(page, /A Glimpse/)).toBeEnabled();
});

test('desktop: the original Border Glow follows the pointer near an edge', async ({ page }) => {
  test.skip(!isDesktop(page), 'Fine-pointer behaviour checked on desktop');
  await page.goto('/encounter');
  const card = page.locator('.mode-option .border-glow-card').nth(2);
  const box = await card.boundingBox();
  if (!box) throw new Error('no card box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width - 6, box.y + 24, { steps: 6 });
  await expect
    .poll(() => card.evaluate((el) => Number(el.style.getPropertyValue('--edge-proximity'))))
    .toBeGreaterThan(60);
  await page.waitForTimeout(350);
  await page.screenshot({ path: shot('prep-hover-glow') });
});

test.describe('touch', () => {
  test.use({ hasTouch: true });

  test('a tap selects a depth', async ({ page }) => {
    await page.goto('/encounter');
    await page.locator('.mode-option').nth(0).tap();
    await expect(radio(page, /A Glimpse/)).toBeChecked();
    await expect(confirm(page)).toHaveAttribute('aria-disabled', 'false');
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the transition is a short fade and the glow stays dark', async ({ page }) => {
    await page.goto('/');
    await page.locator('#begin').evaluate((el) => {
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    await page.getByRole('button', { name: 'Begin your journey' }).click();
    // No growing circle: the layer only fades.
    const clip = await page
      .locator('.liquid-flow')
      .evaluate((el) => getComputedStyle(el).clipPath)
      .catch(() => 'none');
    expect(clip === 'none' || clip === '').toBe(true);
    await expect(page.getByRole('heading', { level: 1, name: 'Choose your depth' })).toBeFocused();

    const card = page.locator('.mode-option .border-glow-card').nth(0);
    const box = await card.boundingBox();
    if (!box) throw new Error('no card box');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width - 4, box.y + 16, { steps: 6 });
    await page.waitForTimeout(200);
    expect(await card.evaluate((el) => el.style.getPropertyValue('--edge-proximity'))).toBe('');

    await page.locator('.mode-option').nth(0).click();
    await expect(radio(page, /A Glimpse/)).toBeChecked();
    await fullShot(page, 'prep-reduced-motion');
  });
});

test.describe('narrow phones', () => {
  for (const width of [320, 360, 375]) {
    test(`no overflow or clipping at ${String(width)} px`, async ({ page }) => {
      test.skip(test.info().project.name !== 'mobile', 'Width sweep runs once, on the phone project');
      await page.setViewportSize({ width, height: 740 });
      await page.goto('/encounter');
      await page.locator('.mode-option').nth(2).click();
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      // Every text line stays inside its card.
      const clipped = await page.locator('.mode-option').evaluateAll((cards) =>
        cards.some((card) => {
          const outer = card.getBoundingClientRect();
          return Array.from(card.querySelectorAll('.mode-option__text > span')).some((el) => {
            const r = el.getBoundingClientRect();
            return r.right > outer.right - 8 || r.left < outer.left + 8;
          });
        }),
      );
      expect(clipped).toBe(false);
      await fullShot(page, `prep-${String(width)}`);
    });
  }
});

test('mobile: the top bar opens settings only', async ({ page }) => {
  test.skip(isDesktop(page), 'Top bar is the phone and tablet chrome');
  await page.goto('/encounter');
  await page.getByRole('banner').getByRole('button', { name: 'Open settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('navigation')).toHaveCount(0);
});

for (const [locale, title, journey, confirmLabel] of [
  ['pt-BR', 'Escolha a profundidade', /^A Jornada 60 perguntas$/, 'Confirmar profundidade'],
  ['es', 'Elige la profundidad', /^El Viaje 60 preguntas$/, 'Confirmar profundidad'],
] as const) {
  test.describe(locale, () => {
    test.use({ locale });

    test(`Preparation is fully translated (${locale})`, async ({ page }) => {
      await page.goto('/encounter');
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      const group = page.getByRole('radiogroup', { name: title });
      await expect(group.getByRole('radio', { name: journey })).toBeVisible();
      await expect(page.getByRole('button', { name: confirmLabel })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      await group.getByRole('radio', { name: journey }).check({ force: true });
      await page.getByRole('button', { name: confirmLabel }).click();
      await page.waitForTimeout(300);
      await fullShot(page, `prep-confirmed-${locale}`);
    });
  });
}
