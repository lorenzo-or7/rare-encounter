import { createContext, useContext } from 'react';
import type { Locale } from '../i18n/locales';
import type { MessageKey } from '../i18n/messages';
import type { ThemeId } from '../theme/themes';

export interface PreferencesContextValue {
  /** The locale in effect (explicit choice, browser match or English). */
  readonly locale: Locale;
  readonly theme: ThemeId;
  readonly setLocale: (locale: Locale) => void;
  readonly setTheme: (theme: ThemeId) => void;
  readonly t: (key: MessageKey, params?: Readonly<Record<string, string | number>>) => string;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return ctx;
}
