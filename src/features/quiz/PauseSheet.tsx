import { useEffect, useId, useRef, useState } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { Button } from '../../components/button/Button';
import { Sheet } from '../../components/sheet/Sheet';

interface PauseSheetProps {
  readonly open: boolean;
  readonly modeName: string;
  readonly answered: number;
  readonly total: number;
  /** The last answer's save failed: say so instead of claiming everything is saved. */
  readonly lastAnswerUnsaved: boolean;
  readonly onContinue: () => void;
  /** Resolves once the pause is stored; rejects when it cannot be confirmed. */
  readonly onPause: () => Promise<void>;
  /** Called after a confirmed pause, or when leaving anyway after a failed one. */
  readonly onLeave: () => void;
  /** Resolves once the session is deleted. */
  readonly onStartOver: () => Promise<void>;
}

type View = 'menu' | 'confirm-restart';

/**
 * Pause (the settings drawer's pattern: right drawer on desktop, bottom sheet on phones,
 * native modal dialog for focus, Escape and the inert page). Escape or the close control
 * means Continue. Start over always asks again, and nothing is deleted until confirmed.
 * The parent gives each opening a new `key`, so it always starts on the menu.
 */
export function PauseSheet({
  open,
  modeName,
  answered,
  total,
  lastAnswerUnsaved,
  onContinue,
  onPause,
  onLeave,
  onStartOver,
}: PauseSheetProps) {
  const { t } = usePreferences();
  const [view, setView] = useState<View>('menu');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'pause' | 'restart' | null>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const restartRef = useRef<HTMLButtonElement>(null);
  const focusOnMenu = useRef(false);
  const restartTitleId = useId();

  // Moving between the two views keeps focus inside the dialog, on the safe choice.
  useEffect(() => {
    if (view === 'confirm-restart') keepRef.current?.focus();
    if (view === 'menu' && focusOnMenu.current) restartRef.current?.focus();
    focusOnMenu.current = false;
  }, [view]);

  const pause = () => {
    setBusy(true);
    setError(null);
    onPause()
      .then(onLeave)
      .catch(() => {
        setBusy(false);
        setError('pause');
      });
  };

  const restart = () => {
    setBusy(true);
    setError(null);
    onStartOver().catch(() => {
      setBusy(false);
      setError('restart');
    });
  };

  return (
    <Sheet open={open} onClose={onContinue} title={t('pause.title')} closeLabel={t('settings.close')}>
      {view === 'menu' ? (
        <div className="pause">
          <p className="pause__summary">
            {t('pause.summary', { mode: modeName, answered, total })}
          </p>
          <p className="pause__note">{t(lastAnswerUnsaved ? 'pause.unsaved' : 'pause.saved')}</p>

          {error === 'pause' && (
            <div className="pause__error" role="alert">
              <p>{t('pause.leaveFailed', { answered })}</p>
              <Button variant="secondary" onClick={onLeave}>
                {t('pause.leaveAnyway')}
              </Button>
            </div>
          )}

          <div className="pause__actions">
            <Button variant="primary" size="lg" onClick={onContinue}>
              {t('pause.continue')}
            </Button>
            <Button variant="secondary" size="lg" disabled={busy} aria-busy={busy} onClick={pause}>
              {t('pause.leave')}
            </Button>
            <Button
              ref={restartRef}
              variant="ghost"
              className="pause__restart"
              disabled={busy}
              onClick={() => {
                setError(null);
                setView('confirm-restart');
              }}
            >
              {t('pause.restart')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="pause" role="group" aria-labelledby={restartTitleId}>
          <h3 id={restartTitleId} className="pause__heading">
            {t('restart.title')}
          </h3>
          <p className="pause__note">{t('restart.body', { answered })}</p>
          {error === 'restart' && (
            <p className="pause__error" role="alert">
              {t('restart.failed')}
            </p>
          )}
          <div className="pause__actions">
            <Button
              ref={keepRef}
              variant="secondary"
              size="lg"
              disabled={busy}
              onClick={() => {
                focusOnMenu.current = true;
                setView('menu');
              }}
            >
              {t('restart.keep')}
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="pause__danger"
              disabled={busy}
              aria-busy={busy}
              onClick={restart}
            >
              {t('restart.confirm')}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
