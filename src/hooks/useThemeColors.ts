import { useEffect, useState } from 'react';
import type { ThemeId } from '../theme/themes';

export interface ThemeColors {
  readonly accent: string;
  readonly accent2: string;
  readonly bg: string;
  readonly surface: string;
  readonly text: string;
  readonly line: string;
}

/** Spectrum values, used before the first read (and in environments without CSSOM). */
const FALLBACK: ThemeColors = {
  accent: '#a78bfa',
  accent2: '#3dd6e8',
  bg: '#0b0816',
  surface: '#18132b',
  text: '#f2eefb',
  line: 'rgba(214, 204, 255, 0.2)',
};

function read(): ThemeColors {
  const css = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    accent: get('--accent', FALLBACK.accent),
    accent2: get('--accent-2', FALLBACK.accent2),
    bg: get('--color-bg', FALLBACK.bg),
    surface: get('--color-surface', FALLBACK.surface),
    text: get('--color-text', FALLBACK.text),
    line: get('--color-line-strong', FALLBACK.line),
  };
}

/**
 * Resolved token values for canvas/WebGL components that cannot consume CSS variables.
 * Re-reads after the theme attribute is applied (parent effects run after children's).
 */
export function useThemeColors(theme: ThemeId): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(FALLBACK);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setColors(read());
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [theme]);

  return colors;
}
