import type { CategoryId } from '../../domain/categories';
import type { QuestionSource } from '../../domain/question-source';
import type { SpeciesId } from '../../domain/catalog';
import { isVoided } from '../../domain/questions';
import type { EncounterResult, Match, MatchKind } from '../../domain/results';
import type { QuizSession } from '../../domain/session';
import { runExperimentalEngine as runEngine, type EngineOutput, type RoleMatch } from '../../matching/engine';
import { ENGINE_PARAMS, ENGINE_VERSION } from '../../matching/params';
import type { AnsweredQuestion } from '../../matching/signals';
import { REGISTRY_VERSION, TRAIT_REGISTRY } from '../traits';
import { toProfiles, type Catalog } from '../pokedex/catalog';

/** The real Pokédex species shown for the all-voided secret (National Pokédex No. 201). */
export const MYSTERY_SPECIES = 'unown';

export class ResultError extends Error {
  readonly reason: 'incomplete' | 'no-match';
  constructor(reason: 'incomplete' | 'no-match', detail: string) {
    super(detail);
    this.reason = reason;
  }
}

let profilesFor: { catalog: Catalog; profiles: ReturnType<typeof toProfiles> } | null = null;

/** Answered questions of a session, in its own order; fails on a gap or an unknown id. */
export function answeredQuestions(session: QuizSession, source: QuestionSource): AnsweredQuestion[] {
  return session.questionIds.map((id) => {
    const question = source.question(id);
    const answer = session.answers[id];
    if (!question || !answer) throw new ResultError('incomplete', `question ${id} has no answer`);
    return { question, answerId: answer.answerId };
  });
}

export function runForSession(session: QuizSession, source: QuestionSource, catalog: Catalog): EngineOutput {
  if (profilesFor?.catalog !== catalog) profilesFor = { catalog, profiles: toProfiles(catalog) };
  return runEngine({
    answered: answeredQuestions(session, source),
    profiles: profilesFor.profiles,
    registry: TRAIT_REGISTRY,
    params: ENGINE_PARAMS,
    versions: {
      questionBank: source.bankVersion,
      traitRegistry: REGISTRY_VERSION,
      speciesProfiles: catalog.version,
      engine: ENGINE_VERSION,
    },
  });
}

function toMatch(kind: MatchKind, m: RoleMatch, output: EngineOutput): Match {
  const entry = output.ranking.find((r) => r.speciesId === m.speciesId);
  const drivers = [...new Set(m.drivers.map((d) => d.dimension))] as CategoryId[];
  return {
    kind,
    speciesId: m.speciesId as Match['speciesId'],
    affinity: entry?.score ?? 0,
    explanation: { drivers, traits: m.drivers.map((d) => d.traitId) },
  };
}

/**
 * The three matches for a finished session. Deterministic: the same answers and data
 * versions always give the same three species. Throws ResultError rather than inventing a
 * match when the data cannot support one.
 */
export function computeResult(
  session: QuizSession,
  source: QuestionSource,
  catalog: Catalog,
  completedAt: string,
): EncounterResult {
  const answered = answeredQuestions(session, source);
  const voided = answered.filter((a) => isVoided(a.answerId)).length;
  const base = {
    sessionId: session.id,
    mode: session.mode,
    completedAt,
    catalogVersion: source.catalogVersion,
    bankVersion: source.bankVersion,
    engineVersion: ENGINE_VERSION,
    counts: { answered: answered.length - voided, voided },
  };
  // Every question voided: no evidence at all. Unown stands for the mystery; nothing is
  // computed, so the normal ranking (Unown included) is never touched.
  if (voided === answered.length) {
    const unown = catalog.species.find((s) => s.slug === MYSTERY_SPECIES);
    if (!unown) throw new ResultError('no-match', 'catalog has no Unown');
    return { ...base, outcome: 'mystery', speciesId: unown.slug as SpeciesId };
  }
  const output = runForSession(session, source, catalog);
  // Some answers, but not enough evidence for three defensible matches: say so, invent none.
  if (!output.soul || !output.hidden || !output.alternative) return { ...base, outcome: 'insufficient' };
  return {
    ...base,
    outcome: 'matches',
    soul: toMatch('soul', output.soul, output),
    hidden: toMatch('hidden', output.hidden, output),
    alternatives: [toMatch('alternative', output.alternative, output)],
  };
}
