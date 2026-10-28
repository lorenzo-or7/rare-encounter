import { motion } from 'motion/react';
import { useState } from 'react';
import { SiteLayout } from '../../components/layout/SiteLayout';
import type { ModeId } from '../../domain/modes';
import type { QuizSession } from '../../domain/session';
import { PreparationScreen } from '../../features/preparation/PreparationScreen';
import { createSession } from '../../features/quiz/flow';
import { PREVIEW_SOURCE } from '../../features/quiz/preview/preview-bank';
import { QuizScreen } from '../../features/quiz/QuizScreen';
import { useEncounterStore } from '../../features/quiz/useEncounterStore';
import type { EncounterStore } from '../../storage/encounter-store';

/** Until the Phase 04 bank exists, every session runs on the labelled preview questions. */
const SOURCE = PREVIEW_SOURCE;

interface Started {
  readonly store: EncounterStore;
  readonly session: QuizSession;
}

/**
 * The encounter at `/encounter`: Preparation, then the questions. A session exists only
 * once it has been written to IndexedDB, so the quiz never starts on progress it cannot keep.
 */
export default function EncounterPage() {
  const openStore = useEncounterStore();
  const [started, setStarted] = useState<Started | null>(null);

  const start = async (mode: ModeId) => {
    const store = await openStore();
    const session = createSession(mode, SOURCE, crypto.randomUUID(), new Date().toISOString());
    await store.putSession(session);
    setStarted({ store, session });
  };

  if (!started) {
    return (
      <SiteLayout sections={[]} brandHref="/">
        <PreparationScreen onConfirm={start} />
      </SiteLayout>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <QuizScreen store={started.store} source={SOURCE} session={started.session} />
    </motion.div>
  );
}
