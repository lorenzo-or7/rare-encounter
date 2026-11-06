import type { TraitId } from '../../domain/traits';
import type {
  EvidenceRecord,
  FormKind,
  ProfileDataset,
  SourceRecord,
  SpeciesProfile,
  SupportLevel,
} from '../../matching/profile';
import { REGISTRY_VERSION } from '../traits';

/**
 * The local, versioned Pokédex (built by scripts/pokedex/fetch.mjs + derive.mjs from
 * PokéAPI). The app reads only this file: no network call happens while matching.
 */
export type EvidenceKind = 'pokedex-text' | 'habitat' | 'game-stats' | 'appearance' | 'type';

export interface CatalogTrait {
  /** Trait id. */
  readonly t: string;
  /** Intensity in (0, 1]. */
  readonly v: number;
  readonly s: SupportLevel;
  /** Evidence kinds behind the mapping. */
  readonly k: readonly EvidenceKind[];
  /** Evidence details, e.g. `text:sleeps|naps:4/12`, `habitat:forest`, `speed:30`. */
  readonly d: readonly string[];
}

export interface CatalogSpecies {
  readonly id: number;
  readonly slug: string;
  readonly name: { readonly en: string; readonly es: string };
  readonly genus: { readonly en: string | null; readonly es: string | null };
  readonly generation: string;
  readonly types: readonly string[];
  readonly color: string | null;
  readonly shape: string | null;
  readonly habitat: string | null;
  readonly legendary: boolean;
  readonly mythical: boolean;
  readonly chain: number | null;
  readonly stage: number;
  readonly forms: readonly { readonly id: string; readonly kind: FormKind }[];
  readonly art: string | null;
  readonly entries: number;
  readonly traits: readonly CatalogTrait[];
}

export interface Catalog {
  readonly version: string;
  readonly source: { readonly name: string; readonly url: string; readonly retrievedAt: string; readonly speciesReported: number };
  readonly status: string;
  readonly species: readonly CatalogSpecies[];
}

let cached: Promise<Catalog> | null = null;

/** Loads the catalog once (a separate chunk, fetched only when a result is computed). */
export function loadCatalog(): Promise<Catalog> {
  cached ??= import('./pokedex.v1.json').then((m) => m.default as unknown as Catalog);
  return cached;
}

const speciesSource = (slug: string) => `pokeapi:pokemon-species/${slug}`;
const pokemonSource = (slug: string) => `pokeapi:pokemon/${slug}`;

/** The PokéAPI record each evidence kind was read from. */
const SOURCE_OF: Readonly<Record<EvidenceKind, (slug: string) => string>> = {
  'pokedex-text': speciesSource,
  habitat: speciesSource,
  appearance: speciesSource,
  'game-stats': pokemonSource,
  type: pokemonSource,
};

/**
 * Species profiles for the engine. Every trait mapping cites one evidence record per kind;
 * appearance is a direct observation, everything else a canonical fact from game data.
 * All profiles are `draft`: they are automatic candidates, not reviewed.
 */
export function toProfiles(catalog: Catalog): SpeciesProfile[] {
  return catalog.species.map((s) => {
    const evidence: EvidenceRecord[] = [];
    const traitMappings = s.traits.map((tr) => {
      const ids = tr.k.map((kind) => {
        const id = `${s.slug}.${tr.t}.${kind}`;
        evidence.push({
          id,
          kind: kind === 'appearance' ? 'direct-observation' : 'canonical-fact',
          statement: tr.d.filter((d) => belongs(kind, d)).join('; ') || kind,
          sourceIds: [SOURCE_OF[kind](s.slug)],
          scope: 'species',
          basedOn: [],
        });
        return id;
      });
      return { traitId: tr.t as TraitId, affinity: tr.v, evidenceIds: ids, support: tr.s };
    });
    return {
      speciesId: s.slug,
      nationalDex: s.id,
      profileVersion: catalog.version,
      editorialState: 'draft',
      evidence,
      traitMappings,
      evidenceBoundaries: [
        'Automatic candidate profile from game data: no editorial review yet.',
        'Appearance and type never support personality, values or instinct traits.',
      ],
      forms: s.forms.map((f) => ({ formId: f.id, kind: f.kind, evidenceIds: [] })),
      review: null,
    };
  });
}

const DETAIL_PREFIXES: Readonly<Record<EvidenceKind, readonly string[]>> = {
  'pokedex-text': ['text:'],
  habitat: ['habitat:'],
  'game-stats': ['speed:'],
  appearance: ['color:', 'shape:'],
  type: ['type:'],
};

const belongs = (kind: EvidenceKind, detail: string) =>
  DETAIL_PREFIXES[kind].some((p) => detail.startsWith(p));

export function toDataset(catalog: Catalog): ProfileDataset {
  const sources: SourceRecord[] = catalog.species.flatMap((s) => [
    { id: speciesSource(s.slug), kind: 'game-data', title: `PokéAPI species: ${s.slug}`, url: `https://pokeapi.co/api/v2/pokemon-species/${String(s.id)}/`, retrievedAt: catalog.source.retrievedAt },
    { id: pokemonSource(s.slug), kind: 'game-data', title: `PokéAPI default form: ${s.slug}`, url: `https://pokeapi.co/api/v2/pokemon/${String(s.id)}/`, retrievedAt: catalog.source.retrievedAt },
  ]);
  return { version: catalog.version, registryVersion: REGISTRY_VERSION, sources, profiles: toProfiles(catalog) };
}
