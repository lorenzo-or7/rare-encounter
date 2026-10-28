import { useId } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { LOCALE_NAMES, LOCALES } from '../../i18n/locales';
import { THEME_IDS, THEME_LABEL_KEYS } from '../../theme/themes';
import { Icon } from '../icon/Icon';
import { LunarSlider } from '../lunar-slider/LunarSlider';
import './SettingsPanel.css';

/**
 * Language, light/dark mode and palette. Lives inside the settings drawer / bottom sheet.
 * Mode and palette are independent: changing one never resets the other.
 */
export function SettingsPanel() {
  const { locale, theme, mode, setLocale, setTheme, setMode, t } = usePreferences();
  const name = useId();
  const appearanceId = useId();
  const lightModeId = useId();

  return (
    <div className="settings">
      <fieldset className="settings__group">
        <legend className="settings__legend">{t('settings.language')}</legend>
        <div className="settings__languages">
          {LOCALES.map((l) => (
            <label key={l} className="choice" lang={l}>
              <input
                type="radio"
                name={`${name}-locale`}
                value={l}
                checked={locale === l}
                onChange={() => {
                  setLocale(l);
                }}
              />
              <span className="choice__label">{LOCALE_NAMES[l]}</span>
              <Icon name="check" size={18} className="choice__check" />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="settings__group" role="group" aria-labelledby={appearanceId}>
        <p id={appearanceId} className="settings__legend">
          {t('settings.appearance')}
        </p>
        <div className="settings__mode">
          <span id={lightModeId} className="settings__mode-label">
            {t('settings.lightMode')}
          </span>
          <LunarSlider mode={mode} onChange={setMode} labelledBy={lightModeId} />
        </div>
      </div>

      <fieldset className="settings__group">
        <legend className="settings__legend">{t('settings.theme')}</legend>
        <div className="settings__themes">
          {THEME_IDS.map((id) => (
            <label key={id} className="swatch" data-theme={id}>
              <input
                type="radio"
                name={`${name}-theme`}
                value={id}
                checked={theme === id}
                onChange={() => {
                  setTheme(id);
                }}
              />
              <span className="swatch__chip" aria-hidden="true" />
              <span className="swatch__label">{t(THEME_LABEL_KEYS[id])}</span>
            </label>
          ))}
        </div>
        <p className="settings__hint">{t('settings.themeHint')}</p>
      </fieldset>
    </div>
  );
}
