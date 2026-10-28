import { expect, test, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 900;
const sheetTrigger = (page: Page) =>
  page.getByRole('banner').getByRole('button', { name: isDesktop(page) ? 'Open settings' : 'Open menu' });
const shot = (name: string) => `test-results/screens/${test.info().project.name}-${name}.png`;

test('renders the foundation without horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Visual foundation' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'spectrum');
  await expect(sheetTrigger(page)).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Escape');
  await page.locator('body').click({ position: { x: 1, y: 300 } });

  await page.screenshot({ path: shot('top') });
  await page.screenshot({ path: shot('full'), fullPage: true });
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

test('desktop nav condenses on scroll and tracks the active section', async ({ page }) => {
  await page.goto('/');
  test.skip(!isDesktop(page), 'Liquid Nav is desktop only');
  const nav = page.locator('.site-nav');
  await expect(nav).toHaveAttribute('data-scrolled', 'false');
  await page.getByRole('link', { name: 'Components' }).click();
  await expect(nav).toHaveAttribute('data-scrolled', 'true');
  await expect(page.getByRole('link', { name: 'Components' })).toHaveAttribute(
    'aria-current',
    'location',
  );
  await page.waitForTimeout(600);
  await page.screenshot({ path: shot('nav-condensed') });

  await page.getByRole('link', { name: 'Themes' }).hover();
  await expect(page.locator('.liquid-nav__hover')).toBeVisible();
  await page.waitForTimeout(400);
  await page.locator('.liquid-nav').screenshot({ path: shot('nav-hover') });
  await page.mouse.move(640, 500);
  await expect(page.locator('.liquid-nav__hover')).toHaveCount(0);
});

test('settings sheet: language and theme persist, Esc returns focus', async ({ page }) => {
  await page.goto('/');
  await sheetTrigger(page).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot('sheet') });

  await dialog.getByRole('radio', { name: 'Português (Brasil)' }).check();
  await dialog.getByRole('radio', { name: 'Brasa' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'ember');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole('banner').getByRole('button', { name: isDesktop(page) ? 'Abrir configurações' : 'Abrir menu' }),
  ).toBeFocused();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'ember');
  await expect(page.getByRole('heading', { level: 1, name: 'Base visual' })).toBeVisible();
});

test('archetype card reveals its phrase as real text', async ({ page }) => {
  await page.goto('/');
  const card = page.getByRole('article', { name: 'Ethereal' });
  await card.scrollIntoViewIfNeeded();
  const action = card.getByRole('button', { name: 'Tap to discover' });
  await expect(action).toHaveAttribute('aria-expanded', 'false');
  await action.click();
  await expect(card.getByText('You find meaning in what others overlook.')).toBeVisible();
  await expect(card.getByRole('button', { name: 'Hide' })).toHaveAttribute('aria-expanded', 'true');
  await page.waitForTimeout(400);
  await page.locator('#cards').screenshot({ path: shot('cards') });
});

test.describe('browser language detection', () => {
  test.use({ locale: 'es-MX' });

  test('uses a supported browser language when nothing is saved', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { level: 1, name: 'Base visual' })).toBeVisible();
  });
});
