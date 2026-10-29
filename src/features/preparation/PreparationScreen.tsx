import { useReducedMotion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { hasNavigatedInApp } from '../../app/routing';
import { Button } from '../../components/button/Button';
import { MODE_IDS, type ModeId } from '../../domain/modes';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { MessageKey } from '../../i18n/messages';
import { ModeOption } from './ModeOption';
import { MODE_NAMES } from './mode-names';
import './PreparationScreen.css';

/** What each depth offers, in a line. The core/adaptive split stays internal. */
const MODE_DESCRIPTIONS: Readonly<Record<ModeId, MessageKey>> = {
  30: 'preparation.desc.glimpse',
  60: 'preparation.desc.journey',
  90: 'preparation.desc.deep',
};

interface PreparationScreenProps {
  /** Starts the encounter at this depth; rejects when it could not be stored. */
  readonly onConfirm: (mode: ModeId) => Promise<void>;
  /** A saved encounter is marked, but storage cannot be opened to reach it right now. */
  readonly storageUnreachable?: boolean;
}

/**
 * Preparation: choose 30, 60 or 90 questions, then confirm. Nothing is preselected and the
 * confirm control stays unavailable (focusable, with its reason) until a depth is chosen.
 * Confirming stores a new session before anything starts: the cards lock while it is
 * written, and if this browser cannot save, the screen says so and the choice stays open.
 */
export function PreparationScreen({
  onConfirm,
  storageUnreachable = false,
}: PreparationScreenProps) {
  const { t, theme } = usePreferences();
  const colors = useThemeColors(theme);
  const reduceMotion = useReducedMotion() ?? false;
  const [selected, setSelected] = useState<ModeId | null>(null);
  const [starting, setStarting] = useState(false);
  const [failed, setFailed] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
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

  const confirm = () => {
    if (selected === null || starting) return;
    setStarting(true);
    setFailed(false);
    onConfirm(selected).catch(() => {
      setStarting(false);
      setFailed(true);
    });
  };

  const choose = (mode: ModeId) => {
    setSelected(mode);
    setFailed(false);
  };

  return (
    <section className="preparation" aria-labelledby={titleId}>
      <header className="preparation__header">
        <h1 id={titleId} ref={titleRef} className="preparation__title" tabIndex={-1}>
          {t('preparation.title')}
        </h1>
        <p id={leadId} className="preparation__lead">
          {t('preparation.lead')}
        </p>
        {storageUnreachable && (
          <p className="preparation__notice" role="status">
            <strong>{t('banner.unreachable.title')}</strong> {t('banner.unreachable.body')}
          </p>
        )}
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
            description={t(MODE_DESCRIPTIONS[id])}
            group={group}
            checked={selected === id}
            locked={starting}
            reduceMotion={reduceMotion}
            colors={colors}
            onSelect={choose}
          />
        ))}
      </div>

      <div className="preparation__action">
        <Button
          className="preparation__confirm"
          variant="primary"
          size="lg"
          aria-disabled={selected === null || starting}
          aria-busy={starting}
          aria-describedby={statusId}
          onClick={confirm}
        >
          {t('preparation.confirm')}
        </Button>
        <div id={statusId} className="preparation__status" role="status">
          {selected === null && <p>{t('preparation.needChoice')}</p>}
        </div>
        {failed && (
          <p className="preparation__error" role="alert">
            {t('preparation.storageError')}
          </p>
        )}
      </div>
    </section>
  );
}
