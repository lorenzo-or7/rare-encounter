/**
 * The cinematic loading between the last answer and the results ("voyage"). Pure timing,
 * no React, so the honesty rules are tested on their own:
 * - the bar runs for a nominal minimum of 7 s, easing out as it goes;
 * - it never shows 100 % before the result exists: until then it stops at HOLD;
 * - once the result exists and the minimum has passed, it completes;
 * - if the result takes clearly longer than the minimum, the screen says so (slow).
 */
export const VOYAGE_MIN_MS = 7000;
/** Where the bar waits while the result is still being worked out. */
export const VOYAGE_HOLD = 0.92;
/** How long past the minimum before the screen says it is taking longer. */
export const VOYAGE_SLOW_AFTER_MS = 1500;
/** How long 100 % stays on screen before the results take over. */
export const VOYAGE_SETTLE_MS = 450;

/** Ease-out: quick at first, slowing toward the end, like light gathering. */
const ease = (x: number) => 1 - (1 - x) ** 2.2;

/** Share of the bar to show (0–1) at `elapsed` ms, given whether the result is ready. */
export function voyageProgress(elapsed: number, ready: boolean): number {
  const nominal = Math.min(Math.max(elapsed, 0) / VOYAGE_MIN_MS, 1);
  const shown = ease(nominal);
  if (!ready) return Math.min(shown, VOYAGE_HOLD);
  return voyageComplete(elapsed, ready) ? 1 : Math.min(shown, 0.995);
}

/** The bar may read 100 %: the result exists and the minimum time has passed. */
export const voyageComplete = (elapsed: number, ready: boolean) => ready && elapsed >= VOYAGE_MIN_MS;

/** Still working well past the minimum: say so instead of pretending. */
export const voyageSlow = (elapsed: number, ready: boolean) =>
  !ready && elapsed >= VOYAGE_MIN_MS + VOYAGE_SLOW_AFTER_MS;
