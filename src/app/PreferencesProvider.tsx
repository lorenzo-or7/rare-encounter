import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { browserLanguages, resolveLocale, type Locale } from '../i18n/locales';
import { format, MESSAGES, type MessageKey } from '../i18n/messages';
import { loadPreferences, savePreferences, type Preferences } from '../storage/preferences';
import { applyMode, applyTheme, type ModeId, type ThemeId } from '../theme/themes';
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

  useEffect(() => {
    applyMode(prefs.mode);
  }, [prefs.mode]);

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
      mode: prefs.mode,
      setLocale: (next: Locale) => {
        update({ locale: next });
      },
      setTheme: (next: ThemeId) => {
        update({ theme: next });
      },
      setMode: (next: ModeId) => {
        update({ mode: next });
      },
      t: (key: MessageKey, params) => format(MESSAGES[locale][key], params),
    }),
    [locale, prefs.theme, prefs.mode, update],
  );

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}
