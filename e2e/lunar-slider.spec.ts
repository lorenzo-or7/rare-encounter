import { expect, test, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

const KEY = 'rare-encounter:preferences';
const THEMES = ['spectrum', 'amethyst', 'azure', 'ember', 'sakura', 'verdant'] as const;
const shot = (name: string) => `test-results/screens/${test.info().project.name}-${name}.png`;
const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 900;
const root = (page: Page) => page.locator('html');
const stored = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null') as unknown, KEY);
const seed = (page: Page, value: unknown) =>
  page.addInitScript(
    ([key, v]) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(key, JSON.stringify(v));
        sessionStorage.setItem('seeded', '1');
      }
    },
    [KEY, value] as const,
  );

/** The settings trigger is named in the page language: settings on desktop, menu on phones. */
const TRIGGERS: Record<string, readonly [string, string]> = {
  en: ['Open settings', 'Open menu'],
  'pt-BR': ['Abrir configurações', 'Abrir menu'],
  es: ['Abrir ajustes', 'Abrir menú'],
};

async function openSettings(page: Page) {
  const lang = (await root(page).getAttribute('lang')) ?? 'en';
  const named = TRIGGERS[lang] as readonly [string, string] | undefined;
  const [settings, menu] = named ?? ['Open settings', 'Open menu'];
  const trigger = isDesktop(page) ? settings : menu;
  await page.getByRole('banner').getByRole('button', { name: trigger }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

test('dark by default; the switch turns light on and off, keeping the palette', async ({
  page,
}) => {
  // Six state changes plus a capture over the WebGL landing: 20-25 s alone on the tablet
  // emulation (measured), close to the default 30 s once the whole suite runs.
  test.setTimeout(60_000);
  await page.goto('/');
  await expect(root(page)).toHaveAttribute('data-mode', 'dark');
  const dialog = await openSettings(page);
  const lunar = dialog.getByRole('switch', { name: 'Light mode' });
  await expect(lunar).toHaveAttribute('aria-checked', 'false');

  await dialog.getByRole('radio', { name: 'Azure' }).check();
  await lunar.click();
  await expect(root(page)).toHaveAttribute('data-mode', 'light');
  await expect(root(page)).toHaveAttribute('data-theme', 'azure');
  await expect(lunar).toHaveAttribute('aria-checked', 'true');
  expect(await stored(page)).toEqual({
    schemaVersion: 2,
    data: { locale: null, theme: 'azure', mode: 'light' },
  });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(
    'light',
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: shot('lunar-settings-light') });

  // Palette change keeps light; mode change keeps the palette.
  await dialog.getByRole('radio', { name: 'Ember' }).check();
  await expect(root(page)).toHaveAttribute('data-mode', 'light');
  await lunar.click();
  await expect(root(page)).toHaveAttribute('data-mode', 'dark');
  await expect(root(page)).toHaveAttribute('data-theme', 'ember');
  expect(await stored(page)).toMatchObject({ data: { theme: 'ember', mode: 'dark' } });
});

test('a saved light mode is applied before first paint and survives a reload', async ({ page }) => {
  await seed(page, { schemaVersion: 2, data: { locale: null, theme: 'sakura', mode: 'light' } });
  // Record the mode at DOMContentLoaded: before the app's module runs, only the inline
  // pre-paint script can have set it.
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      (window as unknown as { modeAtLoad?: string }).modeAtLoad =
        document.documentElement.dataset['mode'];
    });
  });
  await page.goto('/');
  expect(await page.evaluate(() => (window as unknown as { modeAtLoad?: string }).modeAtLoad)).toBe(
    'light',
  );
  await expect(root(page)).toHaveAttribute('data-theme', 'sakura');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f4f2f8');
  await page.reload();
  await expect(root(page)).toHaveAttribute('data-mode', 'light');
  await expect(root(page)).toHaveAttribute('data-theme', 'sakura');
});

test('older preferences (before light mode) keep their palette and language, in dark', async ({
  page,
}) => {
  await seed(page, { schemaVersion: 1, data: { locale: 'es', theme: 'verdant' } });
  await page.goto('/');
  await expect(root(page)).toHaveAttribute('data-mode', 'dark');
  await expect(root(page)).toHaveAttribute('data-theme', 'verdant');
  await expect(root(page)).toHaveAttribute('lang', 'es');
});

test('an invalid mode falls back to dark without touching the rest', async ({ page }) => {
  await seed(page, {
    schemaVersion: 2,
    data: { locale: 'pt-BR', theme: 'amethyst', mode: 'sepia' },
  });
  await page.goto('/');
  await expect(root(page)).toHaveAttribute('data-mode', 'dark');
  await expect(root(page)).toHaveAttribute('data-theme', 'amethyst');
  await expect(root(page)).toHaveAttribute('lang', 'pt-BR');
});

test('keyboard: Tab reaches the switch, focus is visible, Space toggles', async ({ page }) => {
  await page.goto('/');
  const dialog = await openSettings(page);
  const lunar = dialog.getByRole('switch', { name: 'Light mode' });
  await lunar.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(lunar).toBeFocused();
  await expect(lunar).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Space');
  await expect(lunar).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Enter');
  await expect(lunar).toHaveAttribute('aria-checked', 'false');
  // The touch area is at least 44 px tall.
  const box = await lunar.evaluate((el) => {
    const before = getComputedStyle(el, '::before');
    return el.getBoundingClientRect().height - 2 * parseFloat(before.top);
  });
  expect(box).toBeGreaterThanOrEqual(44);
});

for (const [locale, name] of [
  ['pt-BR', 'Modo claro'],
  ['es', 'Modo claro'],
] as const) {
  test.describe(locale, () => {
    test.use({ locale });

    test(`the switch is named in ${locale}`, async ({ page }) => {
      await page.goto('/');
      const dialog = await openSettings(page);
      await expect(dialog.getByRole('switch', { name })).toBeVisible();
    });
  });
}

/** Clicks the switch inside the page and samples the knob's position on every frame. */
const knobFrames = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const knob = document.querySelector('.lunar-slider__knob');
        const lunar = document.querySelector<HTMLButtonElement>('.lunar-slider');
        if (!knob || !lunar) {
          resolve([]);
          return;
        }
        const xs: number[] = [];
        const tick = () => {
          xs.push(new DOMMatrix(getComputedStyle(knob).transform).m41);
          if (xs.length < 30) requestAnimationFrame(tick);
          else resolve(xs);
        };
        lunar.click();
        requestAnimationFrame(tick);
      }),
  );
const inBetween = (xs: number[]) => xs.filter((x) => x > 0.5 && x < 29.5).length;

test('with motion allowed, the knob springs across', async ({ page }) => {
  await page.goto('/');
  await openSettings(page);
  const xs = await knobFrames(page);
  expect(inBetween(xs)).toBeGreaterThan(0);
  expect(xs.at(-1)).toBeCloseTo(30, 0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the knob moves at once, with no frame in between', async ({ page }) => {
    await page.goto('/');
    await openSettings(page);
    const xs = await knobFrames(page);
    expect(inBetween(xs)).toBe(0);
    expect(xs.at(-1)).toBeCloseTo(30, 0);
  });
});

test('light mode uses the compact symbol in the desktop nav', async ({ page }) => {
  test.skip(!isDesktop(page), 'The full logotype only shows on the desktop nav');
  await seed(page, { schemaVersion: 2, data: { locale: null, theme: 'spectrum', mode: 'light' } });
  await page.goto('/');
  await expect(page.locator('.liquid-nav .logo')).toHaveAttribute('data-variant', 'symbol');
});

test('no new horizontal overflow and no clipped settings in light mode', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile', 'Width sweep runs once, on the phone project');
  // Seven full landing loads (WebGL in software in headless Chromium) plus the settings check.
  test.setTimeout(120_000);
  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  for (const width of [320, 360, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.dataset['mode'] = 'dark';
    });
    await page.waitForTimeout(300);
    const dark = await overflow();
    await page.evaluate(() => {
      document.documentElement.dataset['mode'] = 'light';
    });
    await page.waitForTimeout(300);
    expect(await overflow(), `${String(width)} px`).toBeLessThanOrEqual(dark);
  }
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  const dialog = await openSettings(page);
  await dialog.getByRole('switch', { name: 'Light mode' }).click();
  const fits = await dialog.evaluate((d) => {
    const lunar = d.querySelector('.lunar-slider')?.getBoundingClientRect();
    return !!lunar && lunar.right <= d.getBoundingClientRect().right;
  });
  expect(fits).toBe(true);
  await page.waitForTimeout(400);
  await page.screenshot({ path: shot('lunar-settings-320-light') });
});

test.describe('matrix', () => {
  for (const mode of ['dark', 'light'] as const) {
    for (const theme of THEMES) {
      test(`${theme} ${mode}`, async ({ page }) => {
        test.skip(
          !isDesktop(page) && !(mode === 'light' && theme === 'spectrum'),
          'Matrix on desktop; one light capture on tablet and mobile',
        );
        await seed(page, { schemaVersion: 2, data: { locale: null, theme, mode } });
        await page.goto('/');
        await expect(root(page)).toHaveAttribute('data-mode', mode);
        await page.locator('.ghost-fibers-canvas').waitFor({ state: 'attached' });
        await page.waitForTimeout(3200);
        await page.screenshot({ path: shot(`matrix-${theme}-${mode}`) });
      });
    }
  }
});
