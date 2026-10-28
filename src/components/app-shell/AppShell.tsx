import { useId } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { isLocale, LOCALE_NAMES, LOCALES } from '../../i18n/locales';
import { isThemeId, THEME_IDS, THEME_LABEL_KEYS } from '../../theme/themes';
import './AppShell.css';

/** Phase 00 shell: landmarks, skip link and preference controls. Not the landing page. */
export function AppShell() {
  const { locale, theme, setLocale, setTheme, t } = usePreferences();
  const languageId = useId();
  const themeId = useId();

  return (
    <div className="shell">
      <a className="shell__skip" href="#main">
        {t('shell.skipToContent')}
      </a>

      <header className="shell__header">
        <span className="shell__brand">{t('shell.title')}</span>
      </header>

      <main id="main" className="shell__main" tabIndex={-1}>
        <p className="shell__eyebrow">{t('shell.status')}</p>
        <h1 className="shell__title">{t('shell.title')}</h1>
        <p className="shell__lead">{t('shell.lead')}</p>

        <section className="shell__prefs" aria-labelledby={`${languageId}-heading`}>
          <h2 id={`${languageId}-heading`} className="shell__prefs-title">
            {t('settings.title')}
          </h2>

          <div className="shell__field">
            <label htmlFor={languageId}>{t('settings.language')}</label>
            <select
              id={languageId}
              value={locale}
              onChange={(e) => {
                if (isLocale(e.target.value)) setLocale(e.target.value);
              }}
            >
              {LOCALES.map((l) => (
                <option key={l} value={l} lang={l}>
                  {LOCALE_NAMES[l]}
                </option>
              ))}
            </select>
          </div>

          <div className="shell__field">
            <label htmlFor={themeId}>{t('settings.theme')}</label>
            <select
              id={themeId}
              value={theme}
              onChange={(e) => {
                if (isThemeId(e.target.value)) setTheme(e.target.value);
              }}
            >
              {THEME_IDS.map((id) => (
                <option key={id} value={id}>
                  {t(THEME_LABEL_KEYS[id])}
                </option>
              ))}
            </select>
          </div>
        </section>
      </main>
    </div>
  );
}
