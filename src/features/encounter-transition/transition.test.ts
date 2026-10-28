import { INITIAL_TRANSITION, transitionReducer, type TransitionState } from './transition';

const registered = new Set(['preparation']);
const begin = (destination: string, reg: ReadonlySet<string> = registered) =>
  ({ type: 'begin', destination, origin: { x: 10, y: 20 }, registered: reg }) as const;

describe('Liquid Flow transition state machine', () => {
  it('runs idle → covering → covered → idle for a registered destination', () => {
    let s: TransitionState = transitionReducer(INITIAL_TRANSITION, begin('preparation'));
    expect(s).toEqual({ phase: 'covering', destination: 'preparation', origin: { x: 10, y: 20 } });
    s = transitionReducer(s, { type: 'covered' });
    expect(s.phase).toBe('covered');
    s = transitionReducer(s, { type: 'revealed' });
    expect(s).toEqual(INITIAL_TRANSITION);
  });

  it('refuses to start toward a destination that has not registered', () => {
    expect(transitionReducer(INITIAL_TRANSITION, begin('preparation', new Set()))).toBe(
      INITIAL_TRANSITION,
    );
  });

  it('ignores a second begin while a transition is running', () => {
    const running = transitionReducer(INITIAL_TRANSITION, begin('preparation'));
    expect(transitionReducer(running, begin('preparation'))).toBe(running);
  });

  it('ignores out-of-order events and can always cancel', () => {
    expect(transitionReducer(INITIAL_TRANSITION, { type: 'covered' })).toBe(INITIAL_TRANSITION);
    const running = transitionReducer(INITIAL_TRANSITION, begin('preparation'));
    expect(transitionReducer(running, { type: 'revealed' })).toBe(running);
    expect(transitionReducer(running, { type: 'cancel' })).toEqual(INITIAL_TRANSITION);
  });
});
