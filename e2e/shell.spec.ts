import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('renders the accessible shell without horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Rare Encounter' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'spectrum');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();

  await page.screenshot({ path: `test-results/shell-${test.info().project.name}.png`, fullPage: true });
});

test('persists language and theme across reloads', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Language').selectOption('pt-BR');
  await page.getByLabel('Tema').selectOption('ember');
  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'ember');
  await expect(page.getByLabel('Idioma')).toHaveValue('pt-BR');
});

test.describe('browser language detection', () => {
  test.use({ locale: 'es-MX' });

  test('uses a supported browser language when nothing is saved', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByText('Base del proyecto')).toBeVisible();
  });
});
