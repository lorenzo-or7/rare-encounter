/**
 * Holo Card, Adaptive Motion (Results Experience, Design Locked v1): the interaction model,
 * independent of React and of the card's visual design.
 *
 * - Moderate 3D tilt that follows the pointer or touch, clamped to `maxDeg`.
 * - The foil highlight follows the same point (0..1 across the card).
 * - Rest: back to flat. Reduced motion: no tilt, foil fixed at the centre.
 * - Flip: a two-state toggle the card's accessible control drives (click, tap, Enter, Space).
 */
export interface CardPose {
  readonly rotateX: number;
  readonly rotateY: number;
  /** Foil highlight position, 0..1 from the card's top-left. */
  readonly foilX: number;
  readonly foilY: number;
}

export const REST_POSE: CardPose = { rotateX: 0, rotateY: 0, foilX: 0.5, foilY: 0.5 };

/** Moderate by design; the exact value is a tuning detail, not a product decision. */
export const DEFAULT_MAX_TILT_DEG = 8;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function poseFromPointer(
  x: number,
  y: number,
  rect: { readonly left: number; readonly top: number; readonly width: number; readonly height: number },
  options: { readonly reducedMotion: boolean; readonly maxDeg?: number },
): CardPose {
  if (options.reducedMotion || rect.width <= 0 || rect.height <= 0) return REST_POSE;
  const max = options.maxDeg ?? DEFAULT_MAX_TILT_DEG;
  const fx = clamp01((x - rect.left) / rect.width);
  const fy = clamp01((y - rect.top) / rect.height);
  return {
    // Pointer at the top tilts the top edge away; at the right, the right edge away.
    rotateX: (0.5 - fy) * 2 * max,
    rotateY: (fx - 0.5) * 2 * max,
    foilX: fx,
    foilY: fy,
  };
}

export type CardFace = 'front' | 'back';

export const flip = (face: CardFace): CardFace => (face === 'front' ? 'back' : 'front');

/** Hidden Match, Chromatic Veil: once revealed it stays revealed. */
export type VeilState = 'veiled' | 'revealed';
export const reveal = (): VeilState => 'revealed';
