import { useEffect, useId, useRef, useState } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { appHref, hasNavigatedInApp } from '../../app/routing';
import { Button } from '../../components/button/Button';
import type { MessageKey } from '../../i18n/messages';
import type { RecoveryReason } from './resume';
import './SavedEncounterPanel.css';

const REASONS: Readonly<Record<RecoveryReason, MessageKey>> = {
  changed: 'recovery.changed',
  'newer-schema': 'recovery.newer',
  invalid: 'recovery.invalid',
  'no-migration-path': 'recovery.noPath',
};

type SavedEncounterPanelProps =
  | {
      readonly kind: 'resume';
      readonly summary: string;
      readonly answered: number;
      readonly onContinue: () => void;
      /** Deletes the saved session; resolves once deleted. */
      readonly onDiscard: () => Promise<void>;
    }
  | {
      readonly kind: 'recovery';
      readonly reason: RecoveryReason;
      readonly onDiscard: () => Promise<void>;
    };

/**
 * Shown on /encounter when the browser already holds an encounter.
 * - resume: continue it, or start a new one (which deletes it, after confirmation);
 * - recovery: it cannot continue safely. The panel says why, keeps the data, and deletes
 *   it only on an explicit, confirmed choice. "Decide later" leaves everything as it is.
 */
export function SavedEncounterPanel(props: SavedEncounterPanelProps) {
  const { t } = usePreferences();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (hasNavigatedInApp()) titleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (confirming) keepRef.current?.focus();
  }, [confirming]);

  const discard = () => {
    setBusy(true);
    setFailed(false);
    props.onDiscard().catch(() => {
      setBusy(false);
      setFailed(true);
    });
  };

  const resume = props.kind === 'resume';

  return (
    <section className="saved-panel" aria-labelledby={titleId}>
      <h1 id={titleId} ref={titleRef} className="saved-panel__title" tabIndex={-1}>
        {t(resume ? 'resume.panelTitle' : 'recovery.title')}
      </h1>

      {resume ? (
        <>
          <p className="saved-panel__summary">{props.summary}</p>
          <p className="saved-panel__body">{t('resume.panelBody')}</p>
        </>
      ) : (
        <>
          <p className="saved-panel__body">{t(REASONS[props.reason])}</p>
          <p className="saved-panel__body">{t('recovery.kept')}</p>
        </>
      )}

      {confirming ? (
        <div className="saved-panel__confirm" role="group" aria-label={t('restart.title')}>
          <p className="saved-panel__warning">
            {resume
              ? t('restart.body', { answered: props.answered })
              : t('recovery.deleteBody')}
          </p>
          {failed && (
            <p className="saved-panel__error" role="alert">
              {t('restart.failed')}
            </p>
          )}
          <div className="saved-panel__actions">
            <Button
              ref={keepRef}
              variant="secondary"
              size="lg"
              disabled={busy}
              onClick={() => {
                setConfirming(false);
              }}
            >
              {t('restart.keep')}
            </Button>
            <Button variant="primary" size="lg" disabled={busy} aria-busy={busy} onClick={discard}>
              {t(resume ? 'restart.confirm' : 'recovery.delete')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="saved-panel__actions">
          {resume ? (
            <Button variant="primary" size="lg" onClick={props.onContinue}>
              {t('resume.continue')}
            </Button>
          ) : (
            <a className="button button--secondary button--lg" href={appHref('/')}>
              <span>{t('recovery.later')}</span>
            </a>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              setConfirming(true);
            }}
          >
            {t(resume ? 'resume.new' : 'recovery.delete')}
          </Button>
        </div>
      )}
    </section>
  );
}
