import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState, type MouseEvent } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { ENCOUNTER_PATH, navigate } from '../../app/routing';
import { Button, IconButton } from '../../components/button/Button';
import type { MessageKey } from '../../i18n/messages';
import { openEncounterStore } from '../../storage/encounter-store';
import { clearSessionMarker, readSessionMarker } from '../../storage/session-marker';
import { PREPARATION, useEncounterTransition } from '../encounter-transition/context';
import { answeredCount, totalQuestions } from '../quiz/flow';
import { requestResume } from './intent';
import { bannerFor, loadStoredState } from './resume';
import './ResumeBanner.css';
import { MODE_NAMES } from '../preparation/mode-names';

/** Per tab: a closed notice stays closed while this tab is open. Nothing else is touched. */
const DISMISSED_KEY = 'rare-encounter:resume-dismissed';

type Banner =
  | { readonly kind: 'session'; readonly id: string; readonly summary: string }
  | { readonly kind: 'recovery'; readonly id: string }
  | { readonly kind: 'unreachable'; readonly id: string };

function dismissed(id: string): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === id;
  } catch {
    return false;
  }
}

/**
 * Landing banner for a returning visitor, shown under the hero CTA (blueprint: an unfinished session first, then the
 * last result; results arrive in Phase 05). It only opens IndexedDB when the localStorage
 * marker says there may be something, so a first visit never creates a database, and it
 * confirms against IndexedDB before offering anything. Closing it hides the notice for
 * this tab; the saved encounter is untouched.
 */
export default function ResumeBannerContent() {
  const { t } = usePreferences();
  const transition = useEncounterTransition();
  // Height moves the content below; under reduced motion it changes at once.
  const reduceMotion = useReducedMotion() ?? false;
  const [banner, setBanner] = useState<Banner | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const marker = readSessionMarker();
    if (!marker) return;
    let active = true;
    // The question bank loads only when there is something to check it against.
    void import('../../content/questions/bank')
      .then(({ BANK_SOURCE }) => loadStoredState(openEncounterStore, BANK_SOURCE))
      .then(({ state, store }) => {
        store?.close();
        if (!active) return;
        const kind = bannerFor(state, null);
        if (state.kind === 'none') clearSessionMarker();
        if (kind === 'session' && state.kind === 'session') {
          const { session } = state;
          const id = `${session.id}:${String(session.revision)}`;
          if (dismissed(id)) return;
          setBanner({
            kind,
            id,
            summary: t('pause.summary', {
              mode: t(MODE_NAMES[session.mode]),
              answered: answeredCount(session),
              total: totalQuestions(session),
            }),
          });
        } else if (kind === 'recovery' || kind === 'unreachable') {
          const id = `${kind}:${marker.sessionId}`;
          if (!dismissed(id)) setBanner({ kind, id });
        }
      });
    return () => {
      active = false;
    };
  }, [t]);

  const close = () => {
    if (banner) {
      try {
        sessionStorage.setItem(DISMISSED_KEY, banner.id);
      } catch {
        // Blocked storage: the notice still closes for this page view.
      }
    }
    setClosed(true);
  };

  const resume = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    requestResume();
    if (transition.canBegin(PREPARATION)) {
      transition.begin(PREPARATION, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    } else {
      navigate(ENCOUNTER_PATH, { encounter: 'resume' });
    }
  };

  const title: MessageKey | null = banner
    ? banner.kind === 'session'
      ? 'resume.title'
      : banner.kind === 'recovery'
        ? 'banner.recovery.title'
        : 'banner.unreachable.title'
    : null;

  return (
    <AnimatePresence>
      {banner && title && !closed && (
        // In the page flow: it opens and closes its own height, so the content below moves
        // smoothly instead of jumping (reduced motion: instant).
        <motion.div
          key="resume-banner"
          className="resume-banner-slot"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <aside className="resume-banner" aria-label={t('resume.label')}>
            <div className="resume-banner__text">
              <p className="resume-banner__title">{t(title)}</p>
              <p className="resume-banner__body">
                {banner.kind === 'session'
                  ? banner.summary
                  : t(
                      banner.kind === 'recovery'
                        ? 'banner.recovery.body'
                        : 'banner.unreachable.body',
                    )}
              </p>
            </div>
            <div className="resume-banner__actions">
              {banner.kind === 'session' && (
                <Button variant="primary" onClick={resume}>
                  {t('resume.continue')}
                </Button>
              )}
              {banner.kind === 'recovery' && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigate(ENCOUNTER_PATH);
                  }}
                >
                  {t('banner.recovery.action')}
                </Button>
              )}
              <IconButton icon="close" label={t('resume.dismiss')} onClick={close} />
            </div>
          </aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
