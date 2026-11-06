/**
 * Matching parameters.
 *
 * ENGINE_PARAMS are the values the app uses. They were chosen by simulation against the
 * real bank and catalog (scripts: `npm run audit:calibrate`), on calibration seeds, and
 * checked on separate validation seeds; the measured effects are in
 * docs/reports/MATCHING_CALIBRATION_REPORT.md. `calibrated: true` means "chosen by that
 * measured procedure", not "editorially approved".
 *
 * EXPERIMENTAL_PARAMS are the original uncalibrated research values, kept for the fixture
 * tests of the engine's mechanics.
 */
export interface EngineParams {
  readonly calibrated: boolean;
  /**
   * Evidence Equivalence Band, relative: a score within this fraction of the leader's lift
   * above neutral (score − 0.5) counts as equivalent to the leader.
   */
  readonly equivalenceBand: number;
  /** A person's leaning counts as clear (for the gate) from this magnitude on. */
  readonly salience: number;
  /** Adaptive Confidence Gate: clear leanings a species must have evidence for. */
  readonly gate: { readonly wellSupported: number; readonly partiallySupported: number };
  /** Hidden Match: the share of the person's strongest leanings treated as dominant. */
  readonly dominantShare: number;
  /** Alternative Match: maximum overlap (Jaccard) of top drivers with the Soul Match. */
  readonly alternativeMaxOverlap: number;
  /** How many top contributing traits form a match's driver set. */
  readonly driverCount: number;
}

export const EXPERIMENTAL_PARAMS: EngineParams = {
  calibrated: false,
  equivalenceBand: 0.02,
  salience: 0.2,
  gate: { wellSupported: 3, partiallySupported: 1 },
  dominantShare: 1 / 3,
  alternativeMaxOverlap: 0.5,
  driverCount: 3,
};

export const EXPERIMENTAL_ENGINE_VERSION = 'engine-experimental-0.1';

/** Set from the calibration run (see the calibration report). */
export const ENGINE_PARAMS: EngineParams = {
  calibrated: true,
  equivalenceBand: 0.05,
  salience: 0.2,
  gate: { wellSupported: 4, partiallySupported: 3 },
  dominantShare: 1 / 3,
  alternativeMaxOverlap: 0.5,
  driverCount: 3,
};

export const ENGINE_VERSION = 'engine-1.0';
