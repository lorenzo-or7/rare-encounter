import { expect, test, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

const HEADLINE = "Somewhere out there, there's your Pokémon.";
const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 900;
const sheetTrigger = (page: Page) =>
  page
    .getByRole('banner')
    .getByRole('button', { name: isDesktop(page) ? 'Open settings' : 'Open menu' });
const shot = (name: string) => `test-results/screens/${test.info().project.name}-${name}.png`;
const settle = async (page: Page) => {
  // Hero entry (~2.2s) and the fibers' built-in intro (2.6s) both finish before capture.
  await page.locator('.ghost-fibers-canvas').waitFor({ state: 'attached' });
  await page.waitForTimeout(3000);
};

test('hero: exact headline, single gradient phrase, Star Border CTA, no overflow', async ({ page }) => {
  await page.goto('/');
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText(HEADLINE);

  const gradients = h1.locator('.gradient-text');
  await expect(gradients).toHaveCount(1);
  await expect(gradients).toHaveText('your Pokémon');

  const cta = page.getByRole('link', { name: 'Begin your journey' });
  await expect(cta).toHaveAttribute('href', '#begin');
  await expect(cta).toHaveClass(/star-border/);
  await expect(page.locator('.hero__fibers')).toHaveAttribute('aria-hidden', 'true');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  await settle(page);
  await page.screenshot({ path: shot('hero') });
  await page.screenshot({ path: shot('full'), fullPage: true });
});

test('CTA scrolls to Begin Your Journey (no Preparation Screen yet)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Begin your journey' }).click();
  await expect(page).toHaveURL(/#begin$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Begin Your Journey' })).toBeInViewport();
});

test('nav lists the four sections after the hero', async ({ page }) => {
  await page.goto('/');
  const hrefs = isDesktop(page)
    ? await page
        .getByRole('navigation', { name: 'Sections' })
        .getByRole('link')
        .evaluateAll((els) => els.map((e) => e.getAttribute('href')))
    : null;
  if (hrefs) expect(hrefs).toEqual(['#beyond', '#discovery', '#connection', '#begin']);
  else {
    await sheetTrigger(page).click();
    await expect(page.getByRole('dialog').getByRole('link')).toHaveCount(4);
  }
});

test('desktop nav condenses on scroll, tracks the section and shows hover', async ({ page }) => {
  await page.goto('/');
  test.skip(!isDesktop(page), 'Liquid Nav is desktop only');
  const nav = page.locator('.site-nav');
  await expect(nav).toHaveAttribute('data-scrolled', 'false');
  await page.getByRole('link', { name: 'How it works' }).click();
  await expect(nav).toHaveAttribute('data-scrolled', 'true');
  await expect(page.getByRole('link', { name: 'How it works' })).toHaveAttribute(
    'aria-current',
    'location',
  );
  await page.getByRole('link', { name: 'Connections' }).hover();
  await expect(page.locator('.liquid-nav__hover')).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot('nav-scrolled') });
});

test('settings: language and theme persist; headline and fibers follow', async ({ page }) => {
  await page.goto('/');
  await sheetTrigger(page).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('radio', { name: 'Português (Brasil)' }).check();
  await dialog.getByRole('radio', { name: 'Brasa' }).check();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'ember');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Em algum lugar por aí, existe o seu Pokémon.',
  );
  await expect(page.locator('h1 .gradient-text')).toHaveText('o seu Pokémon');
  await settle(page);
  await page.screenshot({ path: shot('hero-ptbr-ember') });
});

test('loads Clash Display when the licensed file is installed locally', async ({ page, request }) => {
  const font = await request.get('/fonts/ClashDisplay-Variable.woff2');
  test.skip(!font.ok(), 'Font not installed (run `npm run fonts:setup`); Inter fallback is used.');
  await page.goto('/');
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('600 32px "Clash Display"');
  });
  expect(loaded).toBe(true);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('hero is fully visible immediately, without the staged entry', async ({ page }) => {
    await page.goto('/');
    const opacities = await page
      .locator('.hero__line, .hero__lead, .hero__actions')
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
    expect(opacities.every((o) => o === '1')).toBe(true);
    await page.screenshot({ path: shot('hero-reduced-motion') });
  });
});

test.describe('browser language detection', () => {
  test.use({ locale: 'es-MX' });

  test('uses a supported browser language when nothing is saved', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('h1 .gradient-text')).toHaveText('tu Pokémon');
  });
});
