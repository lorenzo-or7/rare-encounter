import { expect, test, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

const shot = (name: string) => `test-results/screens/${test.info().project.name}-${name}.png`;
const section = (page: Page, id: string) => page.locator(`#${id}`);
// Floating cards never hold still, so scroll the section itself rather than waiting on a card.
const scrollTo = (page: Page, id: string) =>
  section(page, id).evaluate((el) => {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 24, behavior: 'instant' });
  });
const capture = async (page: Page, id: string, name: string) => {
  // Evidence shows the whole section: grow the viewport height when it is taller.
  const vp = page.viewportSize();
  const height = await section(page, id).evaluate((el) => Math.ceil(el.getBoundingClientRect().height));
  if (vp && height + 48 > vp.height) await page.setViewportSize({ width: vp.width, height: height + 48 });
  // Scroll the section to just under the floating nav and capture the real viewport.
  await section(page, id).evaluate((el) => {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 24, behavior: 'instant' });
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: shot(name) });
};

test('the landing renders all five sections in order, without overflow', async ({ page }) => {
  await page.goto('/');
  const ids = await page
    .locator('main > section')
    .evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(['encounter', 'beyond', 'discovery', 'connection', 'begin']);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('Beyond the Obvious: statement and three principles', async ({ page }) => {
  await page.goto('/');
  const s = section(page, 'beyond');
  await expect(s.getByRole('heading', { level: 2, name: 'Beyond the Obvious' })).toBeVisible();
  await expect(s.getByRole('heading', { level: 3 })).toHaveCount(3);
  await expect(s).toContainText('Strength, rarity and fame play no part in the comparison.');
  await capture(page, 'beyond', 'beyond');
});

test('How Discovery Works: Stepper with exactly three steps, navigable', async ({ page }) => {
  await page.goto('/');
  const s = section(page, 'discovery');
  const indicators = s.getByRole('button', { name: /^Step \d: / });
  await expect(indicators).toHaveCount(3);
  await expect(s.getByRole('heading', { level: 3, name: 'Discover Yourself' })).toBeVisible();
  await capture(page, 'discovery', 'discovery-step1');

  await s.getByRole('button', { name: 'Step 2: Find Your Connection' }).click();
  await expect(s.getByRole('heading', { level: 3, name: 'Find Your Connection' })).toBeVisible();
  await s.getByRole('button', { name: 'Step 3: Reveal Your Encounter' }).click();
  await expect(s.getByRole('heading', { level: 3, name: 'Reveal Your Encounter' })).toBeVisible();
  await page.waitForTimeout(700);
  await page.screenshot({ path: shot('discovery-step3') });
});

test('Every Connection Is Different: three cards, real text, serif titles, reveal', async ({ page }) => {
  await page.goto('/');
  const s = section(page, 'connection');
  const cards = s.getByRole('article');
  await expect(cards).toHaveCount(3);
  for (const name of ['Ethereal', 'Instinctive', 'Radiant']) {
    await expect(s.getByRole('article', { name })).toBeVisible();
  }
  const titleFont = await s
    .locator('.archetype-card__title')
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily);
  expect(titleFont).toContain('DM Serif Display');
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('400 32px "DM Serif Display"');
  });
  expect(loaded).toBe(true);
  // Approved art-only images load at full quality, keep 2:3, and no baked text is needed.
  await s.scrollIntoViewIfNeeded();
  const arts = s.locator('.archetype-card__art img');
  await expect(arts).toHaveCount(3);
  for (const img of await arts.all()) {
    await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0)).toBe(true);
    const ratio = await img.evaluate((el) => (el as HTMLImageElement).naturalWidth / (el as HTMLImageElement).naturalHeight);
    expect(ratio).toBeCloseTo(2 / 3, 2);
  }
  await expect(s.locator('.archetype-card__number')).toHaveText(['01', '02', '03']);
  await capture(page, 'connection', 'connection');

  const radiant = s.getByRole('article', { name: 'Radiant' });
  // Pointing at a card pauses its float; force skips the stability wait for the hover itself.
  await radiant.hover({ force: true });
  await radiant.getByRole('button', { name: 'Tap to discover' }).click();
  await expect(radiant.getByText('You bring warmth wherever you go.')).toBeVisible();
  await page.waitForTimeout(600);
  await page.screenshot({ path: shot('connection-revealed') });
});

test('Begin Your Journey: start control is honest until Preparation exists', async ({ page }) => {
  await page.goto('/');
  const s = section(page, 'begin');
  await expect(s.getByRole('heading', { level: 2, name: 'Begin Your Journey' })).toBeVisible();
  await expect(s.locator('.begin__mode')).toHaveCount(3);
  const cta = s.getByRole('button', { name: 'Begin your journey' });
  await expect(cta).toBeDisabled();
  await expect(cta).toHaveAccessibleDescription('The encounter opens soon.');
  await expect(page.locator('.liquid-flow')).toHaveCount(0);
  await capture(page, 'begin', 'begin');
});

test('card reflection follows a mouse and fades when it leaves', async ({ page }) => {
  await page.goto('/');
  test.skip((page.viewportSize()?.width ?? 0) < 900, 'Fine-pointer behaviour checked on desktop');
  await scrollTo(page, 'connection');
  const card = section(page, 'connection').getByRole('article', { name: 'Ethereal' });
  const box = await card.boundingBox();
  if (!box) throw new Error('no card box');
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
  await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.32, { steps: 4 });
  const glare = card.locator('.archetype-card__glare');
  await expect.poll(() => glare.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.5);
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot('connection-hover') });
  await page.mouse.move(5, 5);
  await expect.poll(() => glare.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeLessThan(0.05);
});

test.describe('touch', () => {
  test.use({ hasTouch: true });

  test('tap reveals the phrase', async ({ page }) => {
    await page.goto('/');
    await scrollTo(page, 'connection');
    const card = section(page, 'connection').getByRole('article', { name: 'Instinctive' });
    await card.hover({ force: true });
    await card.getByRole('button', { name: 'Tap to discover' }).tap();
    await expect(card.getByText('Your intuition finds its own direction.')).toBeVisible();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('cards do not float', async ({ page }) => {
    await page.goto('/');
    const s = section(page, 'connection');
    await s.scrollIntoViewIfNeeded();
    const transforms = await s
      .locator('.connection__float')
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).transform));
    expect(transforms.every((t) => t === 'none')).toBe(true);
    await expect(s.locator('.archetype-card__glare')).toHaveCount(0);
  });
});

test.describe('Portuguese', () => {
  test.use({ locale: 'pt-BR' });

  test('sections are translated, step labels included', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 2, name: 'Além do óbvio' })).toBeVisible();
    await expect(section(page, 'discovery').getByText('Descubra-se').first()).toBeVisible();
    await expect(section(page, 'connection').getByRole('article', { name: 'Etéreo' })).toBeVisible();
    await expect(
      section(page, 'begin').getByRole('button', { name: 'Comece sua jornada' }),
    ).toBeDisabled();
  });
});
