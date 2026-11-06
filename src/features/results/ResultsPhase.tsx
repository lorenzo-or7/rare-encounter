import { useEffect, useState } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { Button } from '../../components/button/Button';
import type { Catalog } from '../../content/pokedex/catalog';
import type { QuestionSource } from '../../domain/question-source';
import type { EncounterResult } from '../../domain/results';
import type { QuizSession } from '../../domain/session';
import type { EncounterStore } from '../../storage/encounter-store';
import { clearSessionMarker } from '../../storage/session-marker';
import { ResultsExperience } from './ResultsExperience';
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
 * A failure never deletes or restarts anything: the answers stay saved, the person sees
 * what happened and can try again, and the technical detail goes to the console.
 */
export function ResultsPhase({ store, source, session, stored, onNewEncounter, onHome }: ResultsPhaseProps) {
  const { t } = usePreferences();
  const [phase, setPhase] = useState<Phase>({ kind: 'working' });
  const [attempt, setAttempt] = useState(0);

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
          <Button
            onClick={() => {
              setPhase({ kind: 'working' });
              setAttempt((n) => n + 1);
            }}
          >
            {t('results.error.retry')}
          </Button>
        </>
      )}
    </section>
  );
}
