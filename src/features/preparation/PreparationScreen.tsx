import { useReducedMotion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { hasNavigatedInApp } from '../../app/routing';
import { Button } from '../../components/button/Button';
import { MODES, MODE_IDS, type ModeId } from '../../domain/modes';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { MessageKey } from '../../i18n/messages';
import { ModeOption } from './ModeOption';
import './PreparationScreen.css';

/** Approved depth names, shared with the landing's closing section. */
const MODE_NAMES: Readonly<Record<ModeId, MessageKey>> = {
  30: 'landing.mode.glimpse',
  60: 'landing.mode.journey',
  90: 'landing.mode.deep',
};

/**
 * Preparation: choose 30, 60 or 90 questions, then confirm. Nothing is preselected and the
 * confirm control stays unavailable (focusable, with its reason) until a depth is chosen.
 * The questions do not exist yet, so confirming locks the choice and says so plainly; it
 * creates no session and starts nothing.
 */
export function PreparationScreen() {
  const { t, theme } = usePreferences();
  const colors = useThemeColors(theme);
  const reduceMotion = useReducedMotion() ?? false;
  const [selected, setSelected] = useState<ModeId | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const changeRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const focusAfter = useRef<'change' | 'confirm' | null>(null);
  const group = useId();
  const titleId = useId();
  const leadId = useId();
  const statusId = useId();

  // Arriving from the landing (Liquid Flow or history), focus starts at the screen title.
  useEffect(() => {
    if (hasNavigatedInApp()) titleRef.current?.focus();
  }, []);

  useEffect(() => {
    document.title = t('preparation.documentTitle');
    return () => {
      document.title = t('brand.name');
    };
  }, [t]);

  // The confirm and change controls replace each other; keep focus on whichever appears.
  useEffect(() => {
    if (focusAfter.current === 'change') changeRef.current?.focus();
    if (focusAfter.current === 'confirm') confirmRef.current?.focus();
    focusAfter.current = null;
  }, [confirmed]);

  const confirm = () => {
    if (selected === null) return;
    focusAfter.current = 'change';
    setConfirmed(true);
  };

  const change = () => {
    focusAfter.current = 'confirm';
    setConfirmed(false);
  };

  const status =
    confirmed && selected !== null
      ? t('preparation.confirmed', { mode: t(MODE_NAMES[selected]), n: selected })
      : selected === null
        ? t('preparation.needChoice')
        : '';

  return (
    <section className="preparation" aria-labelledby={titleId}>
      <header className="preparation__header">
        <h1 id={titleId} ref={titleRef} className="preparation__title" tabIndex={-1}>
          {t('preparation.title')}
        </h1>
        <p id={leadId} className="preparation__lead">
          {t('preparation.lead')}
        </p>
      </header>

      <div
        className="preparation__options"
        role="radiogroup"
        aria-labelledby={titleId}
        aria-describedby={leadId}
      >
        {MODE_IDS.map((id) => (
          <ModeOption
            key={id}
            mode={id}
            name={t(MODE_NAMES[id])}
            count={t('landing.mode.questions', { n: id })}
            mix={t('preparation.mix', { core: MODES[id].fundamental, adaptive: MODES[id].adaptive })}
            group={group}
            checked={selected === id}
            locked={confirmed}
            reduceMotion={reduceMotion}
            colors={colors}
            onSelect={setSelected}
          />
        ))}
      </div>

      <div className="preparation__action">
        {confirmed ? (
          <Button ref={changeRef} variant="secondary" size="lg" onClick={change}>
            {t('preparation.change')}
          </Button>
        ) : (
          <Button
            ref={confirmRef}
            className="preparation__confirm"
            variant="primary"
            size="lg"
            aria-disabled={selected === null}
            aria-describedby={statusId}
            onClick={confirm}
          >
            {t('preparation.confirm')}
          </Button>
        )}
        <div id={statusId} className="preparation__status" role="status">
          {status && <p>{status}</p>}
          {confirmed && <p className="preparation__note">{t('preparation.unavailable')}</p>}
        </div>
      </div>
    </section>
  );
}
