import type { CategoryId } from '../../domain/categories';
import type { QuestionSource } from '../../domain/question-source';
import type { EncounterResult, Match, MatchKind } from '../../domain/results';
import type { QuizSession } from '../../domain/session';
import { runExperimentalEngine as runEngine, type EngineOutput, type RoleMatch } from '../../matching/engine';
import { ENGINE_PARAMS, ENGINE_VERSION } from '../../matching/params';
import type { AnsweredQuestion } from '../../matching/signals';
import { REGISTRY_VERSION, TRAIT_REGISTRY } from '../traits';
import { toProfiles, type Catalog } from '../pokedex/catalog';

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
  const output = runForSession(session, source, catalog);
  if (!output.soul || !output.hidden || !output.alternative) {
    throw new ResultError('no-match', output.notes.join('; ') || 'no match');
  }
  return {
    sessionId: session.id,
    mode: session.mode,
    completedAt,
    catalogVersion: source.catalogVersion,
    bankVersion: source.bankVersion,
    engineVersion: ENGINE_VERSION,
    soul: toMatch('soul', output.soul, output),
    hidden: toMatch('hidden', output.hidden, output),
    alternatives: [toMatch('alternative', output.alternative, output)],
  };
}
