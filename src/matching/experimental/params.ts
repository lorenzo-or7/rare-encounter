/**
 * EXPERIMENTAL, UNCALIBRATED. Research values for the conditional matching core (ME-03).
 * None of these numbers is approved or measured: they exist so the components can be built,
 * tested and later calibrated against real profiles. `calibrated: false` is checked by the
 * engine and carried into every output.
 */
export interface EngineParams {
  readonly calibrated: boolean;
  /** Evidence Equivalence Band: scores this close to a group's leader count as equivalent. */
  readonly equivalenceBand: number;
  /** Adaptive Confidence Gate, on the share of the person's observed signal a species covers. */
  readonly gate: { readonly wellSupported: number; readonly partiallySupported: number };
  /** Hidden Match: the share of the person's strongest traits treated as dominant. */
  readonly dominantShare: number;
  /** Alternative Match: maximum overlap (Jaccard) of top drivers with the Soul Match. */
  readonly alternativeMaxOverlap: number;
  /** How many top contributing traits form a match's driver set. */
  readonly driverCount: number;
}

export const EXPERIMENTAL_PARAMS: EngineParams = {
  calibrated: false,
  equivalenceBand: 0.02,
  gate: { wellSupported: 0.6, partiallySupported: 0.25 },
  dominantShare: 1 / 3,
  alternativeMaxOverlap: 0.5,
  driverCount: 3,
};

export const EXPERIMENTAL_ENGINE_VERSION = 'engine-experimental-0.1';
