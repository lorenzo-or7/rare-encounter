import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { appHref, encounterHistoryState, navigate } from '../../app/routing';
import { SiteLayout } from '../../components/layout/SiteLayout';
import type { ModeId } from '../../domain/modes';
import type { QuizSession } from '../../domain/session';
import { PreparationScreen } from '../../features/preparation/PreparationScreen';
import { answeredCount, createSession, totalQuestions } from '../../features/quiz/flow';
import { QuizScreen } from '../../features/quiz/QuizScreen';
import { ResultsPhase } from '../../features/results/ResultsPhase';
import { BANK_SOURCE } from '../../content/questions/bank';
import type { EncounterResult } from '../../domain/results';
import { useEncounterStore } from '../../features/quiz/useEncounterStore';
import { markSession } from '../../features/quiz/useQuiz';
import { loadStoredState, type RecoveryReason } from '../../features/resume/resume';
import { SavedEncounterPanel } from '../../features/resume/SavedEncounterPanel';
import { encounterStoreExists, type EncounterStore } from '../../storage/encounter-store';
import { clearSessionMarker, readSessionMarker } from '../../storage/session-marker';
import { MODE_NAMES } from '../../features/preparation/mode-names';

/** Every new session runs on the question bank (v1 candidate). */
const SOURCE = BANK_SOURCE;

type View =
  | { readonly kind: 'loading' }
  | { readonly kind: 'prepare'; readonly unreachable: boolean }
  | { readonly kind: 'saved'; readonly store: EncounterStore; readonly session: QuizSession }
  | {
      readonly kind: 'recovery';
      readonly store: EncounterStore;
      readonly reason: RecoveryReason;
      readonly sessionId: string | null;
    }
  | { readonly kind: 'quiz'; readonly store: EncounterStore; readonly session: QuizSession }
  | {
      readonly kind: 'result';
      readonly store: EncounterStore;
      /** Just finished: compute and store the result. */
      readonly session: QuizSession | null;
      /** Already stored: show it as is. */
      readonly stored: EncounterResult | null;
    };

/**
 * The encounter at `/encounter`. On arrival it reads what this browser holds:
 * - an unfinished session: continued directly when the person asked to (resume banner,
 *   reload or Back into the quiz), otherwise offered next to "start a new encounter";
 * - data that cannot continue: assisted recovery, nothing deleted without confirmation;
 * - nothing (or unreachable storage): Preparation. A session exists only once it has been
 *   written to IndexedDB, so the quiz never starts on progress it cannot keep.
 */
export default function EncounterPage() {
  const { t } = usePreferences();
  const openStore = useEncounterStore();
  const [view, setView] = useState<View>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    const intent = encounterHistoryState().encounter;
    void loadStoredState(openStore, SOURCE, { exists: encounterStoreExists }).then(({ state, store }) => {
      if (!active) return;
      if (state.kind === 'session' && store) {
        markSession(state.session);
        setView(
          intent
            ? { kind: 'quiz', store, session: state.session }
            : { kind: 'saved', store, session: state.session },
        );
      } else if (state.kind === 'recovery' && store) {
        setView({ kind: 'recovery', store, reason: state.reason, sessionId: state.sessionId });
      } else if (state.kind === 'none' && store && intent === 'result') {
        // Reload (or Back) onto the results: show the stored result, never recompute it.
        void store.getLatestResult().then((latest) => {
          if (!active) return;
          if (latest && latest.status !== 'needs-restart' && latest.value.bankVersion === SOURCE.bankVersion) {
            setView({ kind: 'result', store, session: null, stored: latest.value });
          } else {
            setView({ kind: 'prepare', unreachable: false });
          }
        });
      } else {
        // Nothing stored: a leftover pointer is only a pointer, so it can go.
        if (state.kind === 'none') clearSessionMarker();
        setView({
          kind: 'prepare',
          unreachable: state.kind === 'unreachable' && !!readSessionMarker(),
        });
      }
    });
    return () => {
      active = false;
    };
  }, [openStore]);

  const start = async (mode: ModeId) => {
    const store = await openStore();
    const session = createSession(mode, SOURCE, crypto.randomUUID(), new Date().toISOString());
    await store.putSession(session);
    markSession(session);
    setView({ kind: 'quiz', store, session });
  };

  const discard = async (store: EncounterStore, sessionId: string | null) => {
    if (sessionId) await store.deleteSession(sessionId);
    clearSessionMarker();
    window.history.replaceState(null, '');
    setView({ kind: 'prepare', unreachable: false });
  };

  if (view.kind === 'quiz') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <QuizScreen
          store={view.store}
          source={SOURCE}
          session={view.session}
          onLeave={() => {
            navigate('/');
          }}
          onRestart={() => {
            window.history.replaceState(null, '');
            setView({ kind: 'prepare', unreachable: false });
          }}
          onComplete={(finished) => {
            // The results take over this history entry, so a reload shows them again.
            window.history.replaceState({ encounter: 'result' }, '');
            setView({ kind: 'result', store: view.store, session: finished, stored: null });
          }}
        />
      </motion.div>
    );
  }

  if (view.kind === 'result') {
    return (
      <SiteLayout sections={[]} brandHref={appHref('/')}>
        <ResultsPhase
          store={view.store}
          source={SOURCE}
          session={view.session}
          stored={view.stored}
          onNewEncounter={() => {
            window.history.replaceState(null, '');
            window.scrollTo({ top: 0 });
            setView({ kind: 'prepare', unreachable: false });
          }}
          onHome={() => {
            navigate('/');
          }}
        />
      </SiteLayout>
    );
  }

  return (
    <SiteLayout sections={[]} brandHref={appHref('/')}>
      {view.kind === 'prepare' && (
        <PreparationScreen onConfirm={start} storageUnreachable={view.unreachable} />
      )}
      {view.kind === 'saved' && (
        <SavedEncounterPanel
          kind="resume"
          summary={t('pause.summary', {
            mode: t(MODE_NAMES[view.session.mode]),
            answered: answeredCount(view.session),
            total: totalQuestions(view.session),
          })}
          answered={answeredCount(view.session)}
          onContinue={() => {
            setView({ kind: 'quiz', store: view.store, session: view.session });
          }}
          onDiscard={() => discard(view.store, view.session.id)}
        />
      )}
      {view.kind === 'recovery' && (
        <SavedEncounterPanel
          kind="recovery"
          reason={view.reason}
          onDiscard={() => discard(view.store, view.sessionId)}
        />
      )}
    </SiteLayout>
  );
}
