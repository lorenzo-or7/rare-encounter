import { createContext, useContext } from 'react';
import type { TransitionPhase, TransitionState } from './transition';

export interface EncounterTransitionApi {
  readonly phase: TransitionPhase;
  /** True only when a destination with this id has registered itself. */
  readonly canBegin: (destination: string) => boolean;
  readonly begin: (destination: string, origin?: TransitionState['origin']) => void;
  /** Called by a destination screen; returns an unregister function. */
  readonly register: (destination: string, onCovered: () => void) => () => void;
}

export const EncounterTransitionContext = createContext<EncounterTransitionApi | null>(null);

/** Destination id the Preparation Screen will register in Phase 02. */
export const PREPARATION = 'preparation';

export function useEncounterTransition(): EncounterTransitionApi {
  const ctx = useContext(EncounterTransitionContext);
  if (!ctx) throw new Error('useEncounterTransition must be used inside <EncounterTransitionProvider>');
  return ctx;
}
