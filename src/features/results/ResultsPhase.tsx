import { useCallback, useEffect, useState } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { Button } from '../../components/button/Button';
import type { Catalog } from '../../content/pokedex/catalog';
import type { QuestionSource } from '../../domain/question-source';
import type { EncounterResult } from '../../domain/results';
import type { QuizSession } from '../../domain/session';
import type { EncounterStore } from '../../storage/encounter-store';
import { clearSessionMarker } from '../../storage/session-marker';
import { ResultsExperience } from './ResultsExperience';
import { ResultsVoyage } from './ResultsVoyage';
import './Results.css';

type Phase =
  | { readonly kind: 'working' }
  | { readonly kind: 'ready'; readonly result: EncounterResult; readonly catalog: Catalog }
  | { readonly kind: 'error' };

interface ResultsPhaseProps {
  readonly store: EncounterStore;
  readonly source: QuestionSource;
  /** The finished session (all answers saved), or null when showing a stored result. */
  readonly session: QuizSession | null;
  /** A result already stored for this browser; shown as is, nothing is recomputed. */
  readonly stored: EncounterResult | null;
  readonly onNewEncounter: () => void;
  readonly onHome: () => void;
}

/**
 * From the last saved answer to the three matches:
 * validate the session → build the leanings → run the engine → store the result together
 * with the completed session (one transaction) → show the Results Experience.
 * A fresh computation plays the cinematic loading (ResultsVoyage) at the same time: the
 * video and the progress start with the work, the bar reaches 100 % only once the result
 * is stored and the 7 s minimum has passed, then the results take over. A stored result
 * (reload, returning visit) opens directly, without the wait.
 * A failure never deletes or restarts anything: the answers stay saved, the person sees
 * what happened and can try again, and the technical detail goes to the console.
 */
export function ResultsPhase({ store, source, session, stored, onNewEncounter, onHome }: ResultsPhaseProps) {
  const { t } = usePreferences();
  const [phase, setPhase] = useState<Phase>({ kind: 'working' });
  const [attempt, setAttempt] = useState(0);
  // Only a result computed now gets the voyage; it ends when it has shown 100 %.
  const [voyage, setVoyage] = useState(stored === null && session !== null);
  const endVoyage = useCallback(() => {
    setVoyage(false);
    window.scrollTo({ top: 0 });
  }, []);
  const retry = () => {
    setPhase({ kind: 'working' });
    setAttempt((n) => n + 1);
  };

  useEffect(() => {
    const run = { active: true };
    void (async () => {
      try {
        const [{ loadCatalog }, { computeResult }] = await Promise.all([
          import('../../content/pokedex/catalog'),
          import('../../content/results/compute'),
        ]);
        const catalog = await loadCatalog();
        let result = stored;
        if (!result) {
          if (!session) throw new Error('results: no session and no stored result');
          const now = new Date().toISOString();
          // Let the "reading your answers" state paint before the calculation runs.
          await new Promise((r) => setTimeout(r, 30));
          result = computeResult(session, source, catalog, now);
          await store.completeSession({ ...session, status: 'completed', updatedAt: now }, result);
          clearSessionMarker();
        }
        if (run.active) setPhase({ kind: 'ready', result, catalog });
      } catch (error) {
        console.error('[rare-encounter] result could not be computed', {
          sessionId: session?.id ?? stored?.sessionId,
          bankVersion: session?.bankVersion ?? stored?.bankVersion,
          error,
        });
        if (run.active) setPhase({ kind: 'error' });
      }
    })();
    return () => {
      run.active = false;
    };
  }, [store, source, session, stored, attempt]);

  if (voyage) {
    return (
      <ResultsVoyage
        ready={phase.kind === 'ready'}
        failed={phase.kind === 'error'}
        onRetry={retry}
        onDone={endVoyage}
      />
    );
  }

  if (phase.kind === 'ready') {
    return (
      <ResultsExperience
        result={phase.result}
        catalog={phase.catalog}
        onNewEncounter={onNewEncounter}
        onHome={onHome}
      />
    );
  }
  return (
    <section className="results-status" aria-live="polite">
      {phase.kind === 'working' ? (
        <p className="results__summary">{t('results.computing')}</p>
      ) : (
        <>
          <h1 className="results__title">{t('results.error.title')}</h1>
          <p className="results__summary">{t('results.error.body')}</p>
          <Button onClick={retry}>{t('results.error.retry')}</Button>
        </>
      )}
    </section>
  );
}
