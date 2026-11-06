import type { ModeId } from '../../domain/modes';
import type { QuestionSource } from '../../domain/question-source';
import type { AnswerId, Question, QuestionId } from '../../domain/questions';
import {
  runExperimentalEngine,
  scoreSpecies,
  personSignals,
  type AnsweredQuestion,
  type EngineOutput,
  type TieBreakReason,
} from '../engine';
import type { EngineParams } from '../params';
import type { SpeciesProfile } from '../profile';
import type { TraitRegistry } from '../registry';
import { sameVersions, type VersionStamp } from '../versions';
import { replayAnswers, seededRandom, walkJourney, type Journey } from './journey';

/**
 * Calibration & Coverage Audit (ME-04). Reachability is measured, never assumed:
 * - Reached: a witness exists (a valid journey whose Soul Match is the species).
 * - Not Yet Found: no witness so far. This is NOT evidence of impossibility.
 * - Proven Unreachable: only with an actual proof. The one proof implemented: a species with
 *   no trait mapping always has zero coverage, so the gate never admits it.
 * Results are only meaningful for the profiles and bank they were run on: pilot reachability
 * says nothing about the full catalog.
 */
export type CoverageStatus = 'reached' | 'not-yet-found' | 'proven-unreachable';

export interface Witness {
  readonly speciesId: string;
  readonly mode: ModeId;
  readonly method: 'random' | 'targeted';
  readonly seed: number | null;
  readonly questionIds: readonly QuestionId[];
  readonly answers: readonly { readonly questionId: QuestionId; readonly answerId: AnswerId }[];
  readonly versions: VersionStamp;
  readonly soul: string;
  readonly hidden: string | null;
  readonly alternative: string | null;
  readonly ranking: readonly { readonly speciesId: string; readonly score: number; readonly gate: string }[];
  readonly tieBreak: TieBreakReason | null;
}

export interface AuditConfig {
  readonly source: QuestionSource;
  readonly modes: readonly ModeId[];
  readonly profiles: readonly SpeciesProfile[];
  readonly registry: TraitRegistry;
  readonly params: EngineParams;
  readonly versions: VersionStamp;
  readonly randomJourneys: number;
  readonly seed: number;
  /** Run the greedy targeted search for species random journeys did not reach. */
  readonly targeted: boolean;
}

export interface SpeciesCoverage {
  readonly speciesId: string;
  readonly byMode: Readonly<Record<string, CoverageStatus>>;
}

export interface AuditReport {
  readonly versions: VersionStamp;
  readonly calibrated: boolean;
  readonly profileCount: number;
  /** Profiles with at least one trait mapping: the only ones that can ever be matched. */
  readonly candidateCount: number;
  readonly species: readonly SpeciesCoverage[];
  readonly witnesses: readonly Witness[];
  readonly journeysRun: number;
  readonly determinism: { readonly checked: number; readonly mismatches: number };
  readonly forms: { readonly candidates: number; readonly profiles: number; readonly formRecords: number };
  /** Profiles with identical mappings: only the neutral key can separate them. */
  readonly indistinguishablePairs: readonly (readonly [string, string])[];
}

function run(cfg: AuditConfig, journey: Journey): EngineOutput {
  return runExperimentalEngine({
    answered: journey.answers,
    profiles: cfg.profiles,
    registry: cfg.registry,
    params: cfg.params,
    versions: cfg.versions,
  });
}

function witness(
  cfg: AuditConfig,
  journey: Journey,
  out: EngineOutput,
  method: Witness['method'],
  seed: number | null,
): Witness | null {
  if (!out.soul) return null;
  return {
    speciesId: out.soul.speciesId,
    mode: journey.mode,
    method,
    seed,
    questionIds: journey.questionIds,
    answers: journey.answers.map((a) => ({ questionId: a.question.id, answerId: a.answerId })),
    versions: cfg.versions,
    soul: out.soul.speciesId,
    hidden: out.hidden?.speciesId ?? null,
    alternative: out.alternative?.speciesId ?? null,
    ranking: out.ranking.slice(0, 5).map((r) => ({ speciesId: r.speciesId, score: r.score, gate: r.gate })),
    tieBreak: out.ranking[0]?.tieBreak ?? null,
  };
}

/**
 * Greedy targeted search: at each question pick the answer that most improves the target's
 * margin over the best other species, on the answers so far. The walk goes through the real
 * source, so the result is a valid journey; failure to find one proves nothing.
 */
function targetedJourney(cfg: AuditConfig, mode: ModeId, target: SpeciesProfile): Journey {
  const others = cfg.profiles.filter((p) => p.speciesId !== target.speciesId);
  const margin = (answered: readonly AnsweredQuestion[]) => {
    const signals = personSignals(answered, cfg.registry);
    const t = scoreSpecies(signals, target, cfg.params).score;
    const best = Math.max(...others.map((o) => scoreSpecies(signals, o, cfg.params).score));
    return t - best;
  };
  return walkJourney(cfg.source, mode, (q: Question, sofar) => {
    let pick = q.options[0]?.id;
    let bestMargin = -Infinity;
    for (const o of q.options) {
      const m = margin([...sofar, { question: q, answerId: o.id }]);
      if (m > bestMargin) {
        bestMargin = m;
        pick = o.id;
      }
    }
    if (!pick) throw new Error(`targeted: ${q.id} has no options`);
    return pick;
  });
}

export function runCoverageAudit(cfg: AuditConfig): AuditReport {
  const witnesses: Witness[] = [];
  const found = new Map<string, Set<ModeId>>();
  let journeysRun = 0;
  let checked = 0;
  let mismatches = 0;
  const record = (w: Witness | null) => {
    if (!w) return;
    const modes = found.get(w.speciesId) ?? new Set<ModeId>();
    if (!modes.has(w.mode)) witnesses.push(w);
    modes.add(w.mode);
    found.set(w.speciesId, modes);
  };

  for (const mode of cfg.modes) {
    for (let k = 0; k < cfg.randomJourneys; k++) {
      const seed = cfg.seed + k;
      const rnd = seededRandom(seed);
      const journey = walkJourney(cfg.source, mode, (q) => {
        const o = q.options[Math.floor(rnd() * q.options.length)];
        if (!o) throw new Error(`random: ${q.id} has no options`);
        return o.id;
      });
      journeysRun++;
      const out = run(cfg, journey);
      // Determinism: the same answers must give the same output, byte for byte.
      if (k < 5) {
        checked++;
        if (JSON.stringify(run(cfg, journey)) !== JSON.stringify(out)) mismatches++;
      }
      record(witness(cfg, journey, out, 'random', seed));
    }
    if (cfg.targeted) {
      for (const p of cfg.profiles) {
        if (found.get(p.speciesId)?.has(mode) || p.traitMappings.length === 0) continue;
        const journey = targetedJourney(cfg, mode, p);
        journeysRun++;
        const out = run(cfg, journey);
        if (out.soul?.speciesId === p.speciesId) record(witness(cfg, journey, out, 'targeted', null));
      }
    }
  }

  const statusOf = (p: SpeciesProfile, m: ModeId): CoverageStatus =>
    found.get(p.speciesId)?.has(m)
      ? 'reached'
      : p.traitMappings.length === 0
        ? 'proven-unreachable'
        : 'not-yet-found';
  const species: SpeciesCoverage[] = cfg.profiles.map((p) => ({
    speciesId: p.speciesId,
    byMode: Object.fromEntries(cfg.modes.map((m) => [String(m), statusOf(p, m)])),
  }));

  const key = (p: SpeciesProfile) =>
    JSON.stringify([...p.traitMappings].map((m) => [m.traitId, m.affinity]).sort());
  const pairs: [string, string][] = [];
  cfg.profiles.forEach((a, i) => {
    for (const b of cfg.profiles.slice(i + 1)) {
      if (a.traitMappings.length > 0 && key(a) === key(b)) pairs.push([a.speciesId, b.speciesId]);
    }
  });

  return {
    versions: cfg.versions,
    calibrated: cfg.params.calibrated,
    profileCount: cfg.profiles.length,
    candidateCount: cfg.profiles.filter((p) => p.traitMappings.length > 0).length,
    species,
    witnesses,
    journeysRun,
    determinism: { checked, mismatches },
    forms: {
      candidates: new Set(cfg.profiles.map((p) => p.speciesId)).size,
      profiles: cfg.profiles.length,
      formRecords: cfg.profiles.reduce((t, p) => t + p.forms.length, 0),
    },
    indistinguishablePairs: pairs,
  };
}

export type ReplayResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'stale-versions' | 'different-result' };

/** Independent reproduction: rebuild the journey from the source and re-run the engine. */
export function replayWitness(cfg: AuditConfig, w: Witness): ReplayResult {
  if (!sameVersions(w.versions, cfg.versions)) return { ok: false, reason: 'stale-versions' };
  const journey = replayAnswers(cfg.source, w.mode, w.answers);
  const out = run(cfg, journey);
  const same =
    out.soul?.speciesId === w.soul &&
    (out.hidden?.speciesId ?? null) === w.hidden &&
    (out.alternative?.speciesId ?? null) === w.alternative &&
    journey.questionIds.join() === w.questionIds.join();
  return same ? { ok: true } : { ok: false, reason: 'different-result' };
}

/** Deterministic calibration / holdout split, so tuning never sees the holdout species. */
export function splitCalibrationHoldout(
  speciesIds: readonly string[],
  holdoutShare: number,
  seed: number,
): { readonly calibration: string[]; readonly holdout: string[] } {
  const rnd = seededRandom(seed);
  const shuffled = [...speciesIds].sort().map((id) => ({ id, k: rnd() }));
  shuffled.sort((a, b) => a.k - b.k);
  const n = Math.round(speciesIds.length * holdoutShare);
  return {
    holdout: shuffled.slice(0, n).map((x) => x.id).sort(),
    calibration: shuffled.slice(n).map((x) => x.id).sort(),
  };
}
