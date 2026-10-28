import type { MessageKey } from '../i18n/messages';

/** Six approved themes. Themes change accents only, never scoring. */
export const THEME_IDS = ['spectrum', 'amethyst', 'azure', 'ember', 'sakura', 'verdant'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = 'spectrum';

export const THEME_LABEL_KEYS: Readonly<Record<ThemeId, MessageKey>> = {
  spectrum: 'theme.spectrum',
  amethyst: 'theme.amethyst',
  azure: 'theme.azure',
  ember: 'theme.ember',
  sakura: 'theme.sakura',
  verdant: 'theme.verdant',
};

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);

/** Applies the theme to the root element; CSS tokens key off `data-theme`. */
export function applyTheme(theme: ThemeId, root: HTMLElement = document.documentElement): void {
  root.dataset['theme'] = theme;
}

/**
 * Luminosity, independent of the palette: 6 palettes × 2 modes. Dark is the approved
 * experience and stays the default; light is an explicit choice, not the system's.
 */
export const MODE_IDS = ['dark', 'light'] as const;
export type ModeId = (typeof MODE_IDS)[number];

export const DEFAULT_MODE: ModeId = 'dark';

export const isModeId = (value: unknown): value is ModeId =>
  typeof value === 'string' && (MODE_IDS as readonly string[]).includes(value);

/** Browser chrome colours per mode (address bar, overscroll); kept equal to --color-bg. */
const CHROME_BACKGROUND: Readonly<Record<ModeId, string>> = {
  dark: '#0b0816',
  light: '#f4f2f8',
};

/**
 * Applies the mode to the root element (CSS tokens key off `data-mode`) and keeps the
 * browser's own UI in step: form controls, scrollbars and the address bar colour.
 */
export function applyMode(mode: ModeId, root: HTMLElement = document.documentElement): void {
  root.dataset['mode'] = mode;
  root.ownerDocument.querySelector('meta[name="color-scheme"]')?.setAttribute('content', mode);
  root.ownerDocument
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', CHROME_BACKGROUND[mode]);
}
