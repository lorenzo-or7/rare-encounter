import type { Brand } from './brand';
import type { LocalizedText } from './localized';
import type { TraitVector } from './traits';

/** Stable species identifier, e.g. the lowercase PokéAPI species slug. */
export type SpeciesId = Brand<string, 'SpeciesId'>;
export type FormId = Brand<string, 'FormId'>;
export type CatalogVersion = Brand<string, 'CatalogVersion'>;

export type EvolutionStage = 'basic' | 'stage-1' | 'stage-2';

export interface EvolutionLink {
  readonly from: SpeciesId;
  readonly to: SpeciesId;
  /** Branch key for split evolutions (several paths from one species). */
  readonly branch?: string;
}

/** Alternate forms are cataloged, but are not independent candidates in the initial release. */
export interface FormEntry {
  readonly id: FormId;
  readonly speciesId: SpeciesId;
  readonly name: LocalizedText;
  readonly candidate: false;
}

export interface SourceRef {
  readonly kind: 'pokeapi' | 'tcgdex' | 'editorial';
  readonly ref: string;
}

export interface SpeciesEntry {
  readonly id: SpeciesId;
  readonly nationalDex: number;
  readonly name: LocalizedText;
  readonly stage: EvolutionStage;
  /** Each evolutionary stage carries its own editorial attributes. */
  readonly traits: TraitVector;
  readonly forms: readonly FormEntry[];
  /** Factual source references; art sources must clear rights review before release. */
  readonly sources: readonly SourceRef[];
}

export interface Catalog {
  readonly version: CatalogVersion;
  readonly species: readonly SpeciesEntry[];
  readonly evolutions: readonly EvolutionLink[];
}
