import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { appHref, encounterHistoryState } from '../../app/routing';
import { Button } from '../../components/button/Button';
import { CosmicBackdrop } from '../../components/cosmos/CosmicBackdrop';
import { Icon } from '../../components/icon/Icon';
import { SettingsPanel } from '../../components/settings/SettingsPanel';
import { Sheet } from '../../components/sheet/Sheet';
import type { QuestionSource } from '../../domain/question-source';
import type { QuizSession } from '../../domain/session';
import type { EncounterStore } from '../../storage/encounter-store';
import { answeredCount, currentQuestionId, totalQuestions } from './flow';
import { PauseSheet } from './PauseSheet';
import { QuestionView } from './QuestionView';
import { QuizHeader } from './QuizHeader';
import { canMoveForward, useQuiz } from './useQuiz';
import { markNoticeShown, readShownNotices, voidRunBefore } from './void-notice';
import './QuizScreen.css';
import { MODE_NAMES } from '../preparation/mode-names';


interface QuizScreenProps {
  readonly store: EncounterStore;
  readonly source: QuestionSource;
  readonly session: QuizSession;
  /** After Save and leave: back to the landing, where the resume banner waits. */
  readonly onLeave: () => void;
  /** After a confirmed Start over: back to Preparation. */
  readonly onRestart: () => void;
  /** The last answer is saved (real bank only): the page moves on to the results. */
  readonly onComplete?: (session: QuizSession) => void;
}

/**
 * One question per view. Choosing an answer saves it, plays the selection feedback and,
 * once the save has committed, flows to the next question. Prompts and labels follow the
 * current language; stored answers are ids, so a language change never touches them.
 *
 * Browser Back: one extra history entry lets the first Back open Pause instead of leaving.
 * A second Back while Pause is open leaves (the session stays saved), so nobody is trapped.
 */
export function QuizScreen({ store, source, session, onLeave, onRestart, onComplete }: QuizScreenProps) {
  const { t, locale } = usePreferences();
  const reduceMotion = useReducedMotion() ?? false;
  const quiz = useQuiz(store, source, session);
  const { state } = quiz;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  // A new key per opening: the dialog starts on its menu, without an earlier error.
  const [pauseKey, setPauseKey] = useState(0);
  const openPause = useCallback(() => {
    setPauseKey((k) => k + 1);
    setPauseOpen(true);
  }, []);
  const pauseOpenRef = useRef(false);
  useLayoutEffect(() => {
    pauseOpenRef.current = pauseOpen;
  }, [pauseOpen]);
  // Set once the screen is being left, so the closing dialog does not re-arm Back.
  const leaving = useRef(false);

  const total = totalQuestions(state.session);

  // Three voided questions in a row bring a gentle, non-blocking notice, once per run. Runs
  // already shown (this visit or before a reload) stay quiet; a real answer ends the run.
  const [shownBefore] = useState(() => readShownNotices(session.id));
  const [dismissed, setDismissed] = useState<string | null>(null);
  const voidRun = state.status === 'answering' ? voidRunBefore(state.session, state.index) : null;
  const voidNotice = voidRun !== null && voidRun !== dismissed && !shownBefore.has(voidRun) ? voidRun : null;
  useEffect(() => {
    if (voidNotice) markNoticeShown(session.id, voidNotice);
  }, [voidNotice, session.id]);
  const answered = answeredCount(state.session);
  const questionId = currentQuestionId(state);
  const question = questionId ? source.question(questionId) : undefined;
  const saved = questionId ? state.session.answers[questionId]?.answerId : undefined;
  const chosen = state.pending ?? saved ?? null;
  const busy = state.status === 'saving';
  const blocked = state.status === 'conflict';
  const canGoBack = state.status === 'answering' && state.index > 0;
  const unsaved =
    state.status === 'saving' || state.status === 'save-error' || state.status === 'confirm-edit';

  // Every answer is stored: hand the finished session to the results (never for the preview).
  useEffect(() => {
    if (state.status === 'complete' && !source.preview) onComplete?.(state.session);
  }, [state.status, state.session, source.preview, onComplete]);

  useEffect(() => {
    document.title = t('quiz.documentTitle');
    return () => {
      document.title = t('brand.name');
    };
  }, [t]);

  const armGuard = useCallback(() => {
    if (encounterHistoryState().guard) return;
    window.history.replaceState({ encounter: 'quiz' }, '');
    window.history.pushState({ encounter: 'quiz', guard: true }, '');
  }, []);

  // Mark this history entry as the quiz (a reload resumes it) and catch the first Back.
  useEffect(() => {
    armGuard();
    const onPop = () => {
      if (encounterHistoryState().guard || pauseOpenRef.current) return;
      openPause();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
    };
  }, [armGuard, openPause]);

  // Closing the tab while an answer is not stored yet asks the browser to confirm.
  useEffect(() => {
    if (!unsaved) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [unsaved]);

  const continueQuiz = () => {
    if (leaving.current) return;
    setPauseOpen(false);
    armGuard();
  };

  return (
    <div className="quiz">
      <CosmicBackdrop variant="quiz" />
      <a className="site__skip" href="#main">
        {t('shell.skipToContent')}
      </a>
      <QuizHeader
        brand={t('brand.name')}
        answered={answered}
        total={total}
        progressLabel={t('quiz.progress')}
        pauseLabel={t('quiz.pause')}
        pauseOpen={pauseOpen}
        onPause={openPause}
        settingsLabel={t('nav.openSettings')}
        settingsOpen={settingsOpen}
        onOpenSettings={() => {
          setSettingsOpen(true);
        }}
      />

      <main id="main" className="quiz__main" tabIndex={-1}>
        {source.preview && <p className="quiz__preview">{t('quiz.preview')}</p>}

        {blocked && (
          <div className="quiz__error" role="alert">
            <p>{t('quiz.conflict')}</p>
            <Button
              variant="secondary"
              onClick={() => {
                window.location.reload();
              }}
            >
              {t('quiz.reload')}
            </Button>
          </div>
        )}

        {state.status === 'complete' ? (
          <section className="quiz__complete">
            <h1 className="question__prompt">{t('quiz.complete.title', { total })}</h1>
            <p className="quiz__complete-body">{t('quiz.complete.body')}</p>
            <a className="button button--secondary button--lg" href={appHref('/')}>
              <span>{t('quiz.complete.home')}</span>
            </a>
          </section>
        ) : (
          question && (
            <>
              <p className="quiz__step" aria-hidden="true">
                {t('quiz.questionOf', { n: state.index + 1, total })}
              </p>
              <div className="quiz__stage">
                <AnimatePresence initial={false} mode="popLayout" custom={state.direction}>
                  <QuestionView
                    key={question.id}
                    question={question}
                    locale={locale}
                    direction={state.direction}
                    chosen={chosen}
                    busy={busy || blocked}
                    // Every question takes focus, the first included: it replaces Preparation.
                    focusOnEnter
                    onChoose={(answerId) => {
                      quiz.select(question.id, answerId);
                    }}
                    voidLabel={t('quiz.void')}
                  />
                </AnimatePresence>
              </div>

              <div className="quiz__notice-slot" role="status" aria-live="polite">
                {voidNotice && (
                  <VoidNotice
                    eyebrow={t('quiz.voidNotice.eyebrow')}
                    title={t('quiz.voidNotice.title')}
                    body={t('quiz.voidNotice.body')}
                    action={t('quiz.voidNotice.action')}
                    still={reduceMotion}
                    onContinue={() => {
                      setDismissed(voidNotice);
                    }}
                  />
                )}
              </div>

              {state.status === 'save-error' && (
                <div className="quiz__error" role="alert">
                  <p>{t('quiz.saveFailed')}</p>
                  <Button variant="secondary" onClick={quiz.retry}>
                    {t('quiz.retry')}
                  </Button>
                </div>
              )}

              <div className="quiz__steps">
                <Button variant="ghost" icon="arrowLeft" disabled={!canGoBack} onClick={quiz.back}>
                  {t('quiz.back')}
                </Button>
                {canMoveForward(state) && (
                  <Button variant="ghost" className="quiz__next" onClick={quiz.forward}>
                    {t('quiz.next')}
                  </Button>
                )}
              </div>
            </>
          )
        )}

        <p className="visually-hidden" role="status">
          {state.status === 'complete'
            ? t('quiz.complete.title', { total })
            : t('quiz.questionOf', { n: state.index + 1, total })}
        </p>
      </main>

      <PauseSheet
        key={pauseKey}
        open={pauseOpen}
        modeName={t(MODE_NAMES[state.session.mode])}
        answered={answered}
        total={total}
        lastAnswerUnsaved={state.status === 'save-error'}
        onContinue={continueQuiz}
        onPause={quiz.pause}
        onLeave={() => {
          leaving.current = true;
          setPauseOpen(false);
          onLeave();
        }}
        onStartOver={() =>
          quiz.startOver().then(() => {
            leaving.current = true;
            setPauseOpen(false);
            onRestart();
          })
        }
      />

      <Sheet
        open={state.status === 'confirm-edit'}
        onClose={quiz.cancelEdit}
        title={t('edit.title')}
        closeLabel={t('settings.close')}
      >
        <div className="pause">
          <p className="pause__note">{t('edit.body', { n: state.edit?.invalidated ?? 0 })}</p>
          <div className="pause__actions">
            <Button variant="secondary" size="lg" onClick={quiz.cancelEdit}>
              {t('edit.keep')}
            </Button>
            <Button variant="primary" size="lg" onClick={quiz.confirmEdit}>
              {t('edit.confirm')}
            </Button>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
        }}
        title={t('settings.title')}
        closeLabel={t('settings.close')}
      >
        <SettingsPanel />
      </Sheet>
    </div>
  );
}

interface VoidNoticeProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly action: string;
  readonly still: boolean;
  readonly onContinue: () => void;
}

/**
 * The notice after three passes in a row: a premium aside in the flow of the page, not an
 * error, toast or modal. A gold frame lit along its edge, an "Attention" mark with its sign,
 * the title whose last word carries the light, and one way on. It enters gently and never
 * blocks the answers.
 */
function VoidNotice({ eyebrow, title, body, action, still, onContinue }: VoidNoticeProps) {
  // The last word of the title ("mysterious…") carries the gold in every language.
  const cut = title.lastIndexOf(' ');
  const lead = cut > 0 ? title.slice(0, cut + 1) : '';
  const accent = cut > 0 ? title.slice(cut + 1) : title;
  return (
    <motion.aside
      className="quiz__notice"
      {...(still
        ? {}
        : {
            initial: { opacity: 0, y: 14 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
          })}
    >
      <span className="quiz__notice-edge" aria-hidden="true" />
      <span className="quiz__notice-sign" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
          <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
          <path d="M12 10v4.5" />
          <circle cx="12" cy="17.25" r="0.6" fill="currentColor" />
        </svg>
      </span>
      <div className="quiz__notice-content">
        <p className="quiz__notice-eyebrow">{eyebrow}</p>
        <p className="quiz__notice-title">
          {lead}
          <span className="quiz__notice-accent">{accent}</span>
        </p>
        <p className="quiz__notice-body">{body}</p>
        <button type="button" className="quiz__notice-action" onClick={onContinue}>
          <span>{action}</span>
          <Icon name="arrowRight" size={18} />
        </button>
      </div>
    </motion.aside>
  );
}
