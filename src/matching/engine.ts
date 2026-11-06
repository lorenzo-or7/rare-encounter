import { CATEGORY_WEIGHTS } from '../domain/categories';
import type { TraitId } from '../domain/traits';
import type { EngineParams } from './params';
import type { SpeciesProfile, SupportLevel } from './profile';
import type { Dimension, TraitRegistry } from './registry';
import { preferenceSignals, type AnsweredQuestion, type PersonSignal } from './signals';
import type { VersionStamp } from './versions';

export type { AnsweredQuestion, PersonSignal } from './signals';

/**
 * MATCHING ENGINE v1 (promoted from the ME-03 experimental core; parameters calibrated by
 * simulation, see params.ts and MATCHING_CALIBRATION in the reports):
 *
 * - Evidence-Aware Hybrid: affinity (how well the species' mapped traits agree with the
 *   person's leanings) is kept apart from coverage (how much of the person's signal the
 *   species has evidence for). Uncertainty is applied once, by shrinking toward a neutral
 *   0.5 in proportion to missing coverage; reliability and source diversity are never added
 *   to the score, they only order equivalent scores. No double penalty, no repeated bonus.
 * - Missing evidence is unknown, not incompatible: unmapped traits are left out of affinity.
 * - Adaptive Confidence Gate: well / partially supported / insufficient, from how many
 *   of the person's clear leanings the species has evidence for.
 * - Evidence Equivalence Band + Evidence-Based Tie Break, ending in a neutral key derived from
 *   the answers and the species id (stable on refresh, no Pokédex-order or popularity bias).
 * - Species First: one candidate per profile; forms never become candidates.
 * Journey length changes how much evidence there is, never the scale of the score.
 */

export interface Contribution {
  readonly traitId: TraitId;
  readonly dimension: Dimension;
  readonly person: number;
  readonly species: number;
  /** 0.5 + 0.5 × person × species: 1 for a strong shared trait, 0 for one the person avoids. */
  readonly closeness: number;
  readonly evidenceIds: readonly string[];
}

export interface Scored {
  readonly speciesId: string;
  readonly affinity: number;
  readonly coverage: number;
  /** The ranking score: affinity shrunk toward 0.5 by missing coverage. */
  readonly score: number;
  readonly gate: SupportLevel;
  readonly contributions: readonly Contribution[];
  /** Tie-break inputs, not part of the score. */
  readonly reliability: number;
  readonly sourceCount: number;
  readonly consistency: number;
}

export type TieBreakReason = 'reliability' | 'sources' | 'consistency' | 'neutral-key';

export interface Ranked extends Scored {
  readonly position: number;
  /** Set when this entry shared an equivalence band with the next one. */
  readonly tieBreak: TieBreakReason | null;
}

export type MatchRole = 'soul' | 'hidden' | 'alternative';

export interface RoleMatch {
  readonly role: MatchRole;
  readonly speciesId: string;
  readonly gate: SupportLevel;
  /** The traits that carried the match, each traceable to the evidence behind it. */
  readonly drivers: readonly Contribution[];
  /** Alternative only: `weak` when no candidate offered a clearly different reading. */
  readonly differentiation?: 'distinct' | 'weak';
}

export interface EngineOutput {
  readonly experimental: true;
  readonly calibrated: boolean;
  readonly versions: VersionStamp;
  readonly answerFingerprint: string;
  readonly ranking: readonly Ranked[];
  readonly soul: RoleMatch | null;
  readonly hidden: RoleMatch | null;
  readonly alternative: RoleMatch | null;
  /** Why a role is empty, in plain terms for the audit; never shown to a person. */
  readonly notes: readonly string[];
}

/** FNV-1a, 32-bit: a stable, dependency-free hash for neutral ordering and fingerprints. */
export function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function answerFingerprint(answered: readonly AnsweredQuestion[]): string {
  const parts = answered.map((a) => `${a.question.id}=${a.answerId}`).sort();
  return fnv1a(parts.join('|')).toString(16).padStart(8, '0');
}

/** The person's leanings, read as preferences against the alternatives offered. */
export function personSignals(
  answered: readonly AnsweredQuestion[],
  registry: TraitRegistry,
): PersonSignal[] {
  return preferenceSignals(answered, registry);
}

const SUPPORT_WEIGHT: Readonly<Record<SupportLevel, number>> = {
  'well-supported': 1,
  'partially-supported': 0.5,
  'insufficient-evidence': 0,
};

export function scoreSpecies(
  signals: readonly PersonSignal[],
  profile: SpeciesProfile,
  params: EngineParams,
): Scored {
  const mappings = new Map(profile.traitMappings.map((m) => [m.traitId as string, m]));
  const evidence = new Map(profile.evidence.map((e) => [e.id, e]));
  const byDim = new Map<Dimension, { observed: number; mapped: Contribution[] }>();
  for (const s of signals) {
    const d = byDim.get(s.dimension) ?? { observed: 0, mapped: [] };
    d.observed += 1;
    const m = mappings.get(s.traitId);
    if (m) {
      d.mapped.push({
        traitId: s.traitId,
        dimension: s.dimension,
        person: s.value,
        species: m.affinity,
        closeness: 0.5 + 0.5 * s.value * m.affinity,
        evidenceIds: m.evidenceIds,
      });
    }
    byDim.set(s.dimension, d);
  }

  let coverNum = 0;
  let coverDen = 0;
  let affNum = 0;
  let affDen = 0;
  const contributions: Contribution[] = [];
  for (const [dim, { observed, mapped }] of byDim) {
    const w = CATEGORY_WEIGHTS[dim];
    coverNum += (w * mapped.length) / observed;
    coverDen += w;
    if (mapped.length > 0) {
      affNum += (w * mapped.reduce((t, c) => t + c.closeness, 0)) / mapped.length;
      affDen += w;
      contributions.push(...mapped);
    }
  }
  const coverage = coverDen > 0 ? coverNum / coverDen : 0;
  const affinity = affDen > 0 ? affNum / affDen : 0.5;
  const score = coverage * affinity + (1 - coverage) * 0.5;
  // The gate counts the person's clear leanings (either way) that this species has evidence for.
  const salient = contributions.filter((c) => Math.abs(c.person) >= params.salience).length;
  const gate: SupportLevel =
    salient >= params.gate.wellSupported
      ? 'well-supported'
      : salient >= params.gate.partiallySupported
        ? 'partially-supported'
        : 'insufficient-evidence';

  const used = contributions.map((c) => mappings.get(c.traitId));
  const reliability =
    used.length > 0 ? used.reduce((t, m) => t + (m ? SUPPORT_WEIGHT[m.support] : 0), 0) / used.length : 0;
  const sources = new Set<string>();
  for (const c of contributions) {
    for (const id of c.evidenceIds) for (const s of evidence.get(id)?.sourceIds ?? []) sources.add(s);
  }
  const mean = contributions.reduce((t, c) => t + c.closeness, 0) / (contributions.length || 1);
  const variance =
    contributions.reduce((t, c) => t + (c.closeness - mean) ** 2, 0) / (contributions.length || 1);

  return {
    speciesId: profile.speciesId,
    affinity,
    coverage,
    score,
    gate,
    contributions: contributions.sort(byStrength),
    reliability,
    sourceCount: sources.size,
    consistency: 1 - Math.sqrt(variance),
  };
}

/** Strongest first: weight of the dimension times closeness; trait id keeps it total. */
function byStrength(a: Contribution, b: Contribution): number {
  const d = CATEGORY_WEIGHTS[b.dimension] * b.closeness - CATEGORY_WEIGHTS[a.dimension] * a.closeness;
  return d !== 0 ? d : a.traitId < b.traitId ? -1 : a.traitId > b.traitId ? 1 : 0;
}

/** Orders two equivalent entries; returns the deciding criterion with the sign. */
function tieBreak(a: Scored, b: Scored, fingerprint: string): [number, TieBreakReason] {
  if (a.reliability !== b.reliability) return [b.reliability - a.reliability, 'reliability'];
  if (a.sourceCount !== b.sourceCount) return [b.sourceCount - a.sourceCount, 'sources'];
  if (a.consistency !== b.consistency) return [b.consistency - a.consistency, 'consistency'];
  const ka = fnv1a(`${fingerprint}:${a.speciesId}`);
  const kb = fnv1a(`${fingerprint}:${b.speciesId}`);
  if (ka !== kb) return [ka - kb, 'neutral-key'];
  return [a.speciesId < b.speciesId ? -1 : 1, 'neutral-key'];
}

export function rank(scored: readonly Scored[], params: EngineParams, fingerprint: string): Ranked[] {
  const sorted = [...scored].sort((a, b) => b.score - a.score || tieBreak(a, b, fingerprint)[0]);
  const out: Ranked[] = [];
  let i = 0;
  while (i < sorted.length) {
    const leader = sorted[i];
    if (!leader) break;
    let j = i;
    // The band is relative to how far the leader stands above neutral (0.5), so "practically
    // tied" means the same thing whatever the scale of the scores.
    const width = params.equivalenceBand * Math.max(leader.score - 0.5, 1e-9);
    while (j < sorted.length && leader.score - (sorted[j]?.score ?? -Infinity) <= width) j++;
    const group = sorted.slice(i, j).sort((a, b) => tieBreak(a, b, fingerprint)[0]);
    group.forEach((entry, k) => {
      const next = group[k + 1];
      out.push({
        ...entry,
        position: out.length + 1,
        tieBreak: next ? tieBreak(entry, next, fingerprint)[1] : null,
      });
    });
    i = j;
  }
  return out;
}

const drivers = (s: Scored, n: number) => s.contributions.slice(0, n);
const jaccard = (a: readonly Contribution[], b: readonly Contribution[]) => {
  const x = new Set<string>(a.map((c) => c.traitId));
  const y = new Set<string>(b.map((c) => c.traitId));
  const inter = [...x].filter((t) => y.has(t)).length;
  const union = new Set([...x, ...y]).size;
  return union === 0 ? 0 : inter / union;
};

export interface EngineInput {
  readonly answered: readonly AnsweredQuestion[];
  readonly profiles: readonly SpeciesProfile[];
  readonly registry: TraitRegistry;
  readonly params: EngineParams;
  readonly versions: VersionStamp;
}

export function runExperimentalEngine(input: EngineInput): EngineOutput {
  const { answered, profiles, registry, params, versions } = input;
  const fingerprint = answerFingerprint(answered);
  const signals = personSignals(answered, registry);
  const notes: string[] = [];
  const empty = { soul: null, hidden: null, alternative: null } as const;
  const base = { experimental: true as const, calibrated: params.calibrated, versions, answerFingerprint: fingerprint };

  if (signals.length === 0) {
    return { ...base, ...empty, ranking: [], notes: ['no trait signal in the answers'] };
  }

  const ranking = rank(
    profiles.map((p) => scoreSpecies(signals, p, params)),
    params,
    fingerprint,
  );
  const eligible = (s: Scored) => s.gate !== 'insufficient-evidence';

  const soulEntry = ranking.find(eligible);
  if (!soulEntry) {
    notes.push('no species has enough evidence for the observed signal');
    return { ...base, ...empty, ranking, notes };
  }
  const soul: RoleMatch = {
    role: 'soul',
    speciesId: soulEntry.speciesId,
    gate: soulEntry.gate,
    drivers: drivers(soulEntry, params.driverCount),
  };

  // Hidden: the strongest correspondence on observed but less dominant signals.
  const byStrengthDesc = [...signals].sort(
    (a, b) =>
      Math.abs(b.value) * b.observations - Math.abs(a.value) * a.observations ||
      (a.traitId < b.traitId ? -1 : 1),
  );
  const dominantCount = Math.ceil(signals.length * params.dominantShare);
  const complementary = byStrengthDesc.slice(dominantCount);
  let hidden: RoleMatch | null = null;
  if (complementary.length === 0) {
    notes.push('hidden: every observed signal is dominant');
  } else {
    const hiddenRanking = rank(
      profiles
        .filter((p) => p.speciesId !== soul.speciesId)
        .map((p) => scoreSpecies(complementary, p, params)),
      params,
      fingerprint,
    );
    // Complementary leanings are quieter by definition, so few of them reach the gate's
    // salience. If none does, the Hidden Match may rest on one observed positive leaning
    // (never on a trait the person did not show), and the note records it.
    const relaxed = (r: Scored) => r.contributions.some((c) => c.person > 0 && c.closeness > 0.5);
    const strict = hiddenRanking.find(eligible);
    const h = strict ?? hiddenRanking.find(relaxed);
    if (h) {
      hidden = {
        role: 'hidden',
        speciesId: h.speciesId,
        gate: h.gate,
        drivers: drivers(h, params.driverCount).filter((d) => d.person > 0),
      };
      if (!strict) notes.push('hidden: relaxed gate (one observed complementary leaning)');
    } else notes.push('hidden: no species has evidence on the complementary signals');
  }

  // Alternative: another strong global correspondence with a different set of drivers.
  const taken = new Set([soul.speciesId, hidden?.speciesId]);
  const rest = ranking.filter((r) => !taken.has(r.speciesId) && eligible(r));
  const distinct = rest.find(
    (r) => jaccard(drivers(r, params.driverCount), soul.drivers) <= params.alternativeMaxOverlap,
  );
  const altEntry = distinct ?? rest[0];
  const alternative: RoleMatch | null = altEntry
    ? {
        role: 'alternative',
        speciesId: altEntry.speciesId,
        gate: altEntry.gate,
        drivers: drivers(altEntry, params.driverCount),
        differentiation: distinct ? 'distinct' : 'weak',
      }
    : null;
  if (!alternative) notes.push('alternative: no further eligible species');

  return { ...base, ranking, soul, hidden, alternative, notes };
}
