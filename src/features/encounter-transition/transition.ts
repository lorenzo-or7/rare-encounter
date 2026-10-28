/**
 * Liquid Flow transition: a React-independent state machine.
 *
 *   idle --begin--> covering --covered--> covered --revealed--> idle
 *
 * `covering` plays the liquid layer over the landing; at `covered` the destination
 * (the Preparation Screen, registered in Phase 02) mounts underneath; `revealed`
 * returns to idle once the layer has drained away. A `begin` is only accepted for a
 * registered destination, so no control can start a transition to nowhere.
 */

export type TransitionPhase = 'idle' | 'covering' | 'covered' | 'revealing';

export interface TransitionState {
  readonly phase: TransitionPhase;
  readonly destination: string | null;
  /** Viewport point the liquid grows from (usually the activating control's center). */
  readonly origin: { readonly x: number; readonly y: number } | null;
}

export type TransitionEvent =
  | {
      readonly type: 'begin';
      readonly destination: string;
      readonly origin: TransitionState['origin'];
      readonly registered: ReadonlySet<string>;
    }
  | { readonly type: 'covered' }
  | { readonly type: 'revealed' }
  | { readonly type: 'cancel' };

export const INITIAL_TRANSITION: TransitionState = { phase: 'idle', destination: null, origin: null };

export function transitionReducer(state: TransitionState, event: TransitionEvent): TransitionState {
  switch (event.type) {
    case 'begin':
      if (state.phase !== 'idle' || !event.registered.has(event.destination)) return state;
      return { phase: 'covering', destination: event.destination, origin: event.origin };
    case 'covered':
      return state.phase === 'covering' ? { ...state, phase: 'covered' } : state;
    case 'revealed':
      return state.phase === 'covered' || state.phase === 'revealing' ? INITIAL_TRANSITION : state;
    case 'cancel':
      return INITIAL_TRANSITION;
  }
}
