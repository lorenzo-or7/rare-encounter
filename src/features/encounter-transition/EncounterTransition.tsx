import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { EncounterTransitionContext, type EncounterTransitionApi } from './context';
import { INITIAL_TRANSITION, transitionReducer } from './transition';
import './EncounterTransition.css';

const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];

/**
 * Provides the Liquid Flow transition and renders its layer. Phase 01B ships the
 * infrastructure only: destinations register themselves (the Preparation Screen does so
 * in Phase 02), and until one exists `canBegin` stays false for it.
 */
export function EncounterTransitionProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(transitionReducer, INITIAL_TRANSITION);
  const destinations = useRef(new Map<string, () => void>());
  const [registered, setRegistered] = useState<ReadonlySet<string>>(new Set());
  const reduceMotion = useReducedMotion() ?? false;

  const register = useCallback((id: string, onCovered: () => void) => {
    destinations.current.set(id, onCovered);
    setRegistered(new Set(destinations.current.keys()));
    return () => {
      destinations.current.delete(id);
      setRegistered(new Set(destinations.current.keys()));
    };
  }, []);

  const api = useMemo<EncounterTransitionApi>(
    () => ({
      phase: state.phase,
      canBegin: (id) => registered.has(id),
      begin: (destination, origin = null) => {
        dispatch({ type: 'begin', destination, origin, registered });
      },
      register,
    }),
    [state.phase, registered, register],
  );

  const origin = state.origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const at = `${origin.x}px ${origin.y}px`;

  return (
    <EncounterTransitionContext value={api}>
      {children}
      <AnimatePresence>
        {state.phase !== 'idle' && (
          <motion.div
            key="liquid-flow"
            className="liquid-flow"
            aria-hidden="true"
            initial={
              reduceMotion ? { opacity: 0 } : { clipPath: `circle(0% at ${at})`, opacity: 1 }
            }
            animate={
              reduceMotion ? { opacity: 1 } : { clipPath: `circle(150% at ${at})`, opacity: 1 }
            }
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.9, ease: EASE }}
            onAnimationComplete={() => {
              if (state.phase !== 'covering' || !state.destination) return;
              destinations.current.get(state.destination)?.();
              dispatch({ type: 'covered' });
              dispatch({ type: 'revealed' });
            }}
          />
        )}
      </AnimatePresence>
    </EncounterTransitionContext>
  );
}
