/**
 * Every matching output and every coverage witness names the exact versions it was produced
 * with, so a result can be reproduced later or flagged as stale after any of them changes.
 */
export interface VersionStamp {
  readonly questionBank: string;
  readonly traitRegistry: string;
  readonly speciesProfiles: string;
  readonly engine: string;
}

export const sameVersions = (a: VersionStamp, b: VersionStamp): boolean =>
  a.questionBank === b.questionBank &&
  a.traitRegistry === b.traitRegistry &&
  a.speciesProfiles === b.speciesProfiles &&
  a.engine === b.engine;
