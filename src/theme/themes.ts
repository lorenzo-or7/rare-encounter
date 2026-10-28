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
