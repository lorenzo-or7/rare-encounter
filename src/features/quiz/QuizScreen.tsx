import { AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { Button } from '../../components/button/Button';
import { SettingsPanel } from '../../components/settings/SettingsPanel';
import { Sheet } from '../../components/sheet/Sheet';
import type { QuestionSource } from '../../domain/question-source';
import type { QuizSession } from '../../domain/session';
import type { EncounterStore } from '../../storage/encounter-store';
import { answeredCount, currentQuestionId, isAnswered, totalQuestions } from './flow';
import { QuestionView } from './QuestionView';
import { QuizHeader } from './QuizHeader';
import { useQuiz } from './useQuiz';
import './QuizScreen.css';

interface QuizScreenProps {
  readonly store: EncounterStore;
  readonly source: QuestionSource;
  readonly session: QuizSession;
}

/**
 * One question per view. Choosing an answer saves it, plays the selection feedback and,
 * once the save has committed, flows to the next question. Prompts and labels follow the
 * current language; stored answers are ids, so a language change never touches them.
 */
export function QuizScreen({ store, source, session }: QuizScreenProps) {
  const { t, locale } = usePreferences();
  const { state, select, retry, back, forward } = useQuiz(store, session);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const total = totalQuestions(state.session);
  const answered = answeredCount(state.session);
  const questionId = currentQuestionId(state);
  const question = questionId ? source.question(questionId) : undefined;
  const saved = questionId ? state.session.answers[questionId]?.answerId : undefined;
  const chosen = state.pending ?? saved ?? null;
  const busy = state.status === 'saving';
  const canGoBack = state.status === 'answering' && state.index > 0;
  const canGoForward =
    state.status === 'answering' && questionId !== undefined && isAnswered(state.session, questionId);

  useEffect(() => {
    document.title = t('quiz.documentTitle');
    return () => {
      document.title = t('brand.name');
    };
  }, [t]);

  return (
    <div className="quiz">
      <a className="site__skip" href="#main">
        {t('shell.skipToContent')}
      </a>
      <QuizHeader
        brand={t('brand.name')}
        answered={answered}
        total={total}
        progressLabel={t('quiz.progress')}
        pauseLabel={t('quiz.pause')}
        pauseNote={t('quiz.pauseUnavailable')}
        settingsLabel={t('nav.openSettings')}
        settingsOpen={settingsOpen}
        onOpenSettings={() => {
          setSettingsOpen(true);
        }}
      />

      <main id="main" className="quiz__main" tabIndex={-1}>
        {source.preview && <p className="quiz__preview">{t('quiz.preview')}</p>}

        {state.status === 'complete' ? (
          <section className="quiz__complete">
            <h1 className="question__prompt">{t('quiz.complete.title', { total })}</h1>
            <p className="quiz__complete-body">{t('quiz.complete.body')}</p>
            <a className="button button--secondary button--lg" href="/">
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
                    busy={busy}
                    // Every question takes focus, the first included: it replaces Preparation.
                    focusOnEnter
                    onChoose={(answerId) => {
                      select(question.id, answerId);
                    }}
                  />
                </AnimatePresence>
              </div>

              {state.status === 'save-error' && (
                <div className="quiz__error" role="alert">
                  <p>{t('quiz.saveFailed')}</p>
                  <Button variant="secondary" onClick={retry}>
                    {t('quiz.retry')}
                  </Button>
                </div>
              )}

              <div className="quiz__steps">
                <Button variant="ghost" icon="arrowLeft" disabled={!canGoBack} onClick={back}>
                  {t('quiz.back')}
                </Button>
                {canGoForward && (
                  <Button variant="ghost" className="quiz__next" onClick={forward}>
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
