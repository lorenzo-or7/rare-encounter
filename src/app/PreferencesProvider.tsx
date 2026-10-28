import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { browserLanguages, resolveLocale, type Locale } from '../i18n/locales';
import { format, MESSAGES, type MessageKey } from '../i18n/messages';
import { loadPreferences, savePreferences, type Preferences } from '../storage/preferences';
import { applyTheme, type ThemeId } from '../theme/themes';
import { PreferencesContext, type PreferencesContextValue } from './preferences-context';

interface Props {
  readonly children: ReactNode;
  /** Injection points for tests. */
  readonly initial?: Preferences;
  readonly languages?: readonly string[];
}

export function PreferencesProvider({ children, initial, languages }: Props) {
  const [prefs, setPrefs] = useState<Preferences>(() => initial ?? loadPreferences());
  const locale = resolveLocale(prefs.locale, languages ?? browserLanguages());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    applyTheme(prefs.theme);
  }, [prefs.theme]);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      savePreferences(next);
      return next;
    });
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      locale,
      theme: prefs.theme,
      setLocale: (next: Locale) => {
        update({ locale: next });
      },
      setTheme: (next: ThemeId) => {
        update({ theme: next });
      },
      t: (key: MessageKey, params) => format(MESSAGES[locale][key], params),
    }),
    [locale, prefs.theme, update],
  );

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}
