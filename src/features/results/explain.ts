import type { CatalogSpecies, EvidenceKind } from '../../content/pokedex/catalog';
import { traitCopy } from '../../content/traits';
import { CATEGORY_IDS, type CategoryId } from '../../domain/categories';
import type { MatchKind } from '../../domain/results';
import type { Locale } from '../../i18n/locales';
import type { MessageKey } from '../../i18n/messages/en';

type Translate = (key: MessageKey, params?: Readonly<Record<string, string | number>>) => string;

export interface TraitNote {
  readonly id: string;
  readonly label: string;
}

/**
 * The "Why this Pokémon?" copy in three layers:
 * 1. `lead`: a natural paragraph: what the answers leaned toward, that the species is
 *    recorded with the same leanings, and which kinds of answers carried the agreement;
 * 2. `reading`: an interpretation that differs by encounter (Soul, Alternative, Hidden),
 *    built on the definition of the leaning that matters most for that encounter;
 * 3. `reasons`: the evidence, one line per leaning, as recorded for the species.
 * Plus `traits` (the shared leanings, for display) and `cautious` for thin records.
 */
export interface Explanation {
  readonly lead: string;
  readonly reading: string | null;
  readonly traits: readonly TraitNote[];
  readonly reasons: readonly string[];
  /** Set when the species has little recorded evidence: the copy says so. */
  readonly cautious: string | null;
}

/** What the explanation may draw on. Everything comes from the stored result and catalog. */
export interface ExplainInput {
  readonly kind: MatchKind;
  /** Trait ids behind this match, strongest first. */
  readonly traits: readonly string[];
  /** Categories that contributed most, strongest first. */
  readonly drivers: readonly string[];
  readonly species: CatalogSpecies;
  /** Alternative only: the Soul Match's traits, to say what sets this one apart. */
  readonly soulTraits?: readonly string[];
  /** Localized role name of the Soul Match ("Soul Match"). */
  readonly soulRole: string;
}

/** Strongest kind of evidence first: what the Pokédex says beats what the type suggests. */
const ORDER: readonly EvidenceKind[] = ['pokedex-text', 'habitat', 'game-stats', 'appearance', 'type'];

export const speciesName = (s: CatalogSpecies, locale: Locale) => (locale === 'es' ? s.name.es : s.name.en);

/** Mid-sentence form of a label or definition ("Curiosity" → "curiosity"). */
const lower = (text: string, locale: Locale) => text.charAt(0).toLocaleLowerCase(locale) + text.slice(1);

const isCategory = (id: string): id is CategoryId => (CATEGORY_IDS as readonly string[]).includes(id);

function reason(traitId: string, species: CatalogSpecies, locale: Locale, t: Translate): string | null {
  const mapped = species.traits.find((x) => x.t === traitId);
  const copy = traitCopy(traitId);
  if (!mapped || !copy) return null;
  const name = speciesName(species, locale);
  const trait = copy.label[locale];
  const kind = ORDER.find((k) => mapped.k.includes(k));
  switch (kind) {
    case 'pokedex-text': {
      const detail = mapped.d.find((d) => d.startsWith('text:')) ?? '';
      const [hits, total] = (detail.split(':').at(-1) ?? '').split('/');
      return hits && total ? t('results.reason.text', { trait, hits, total, name }) : null;
    }
    case 'habitat':
      return species.habitat
        ? t('results.reason.habitat', { trait, name, habitat: t(`habitat.${species.habitat}` as MessageKey) })
        : null;
    case 'game-stats': {
      const speed = mapped.d.find((d) => d.startsWith('speed:'))?.slice('speed:'.length);
      return speed ? t('results.reason.speed', { trait, name, speed }) : null;
    }
    case 'appearance':
      return t('results.reason.appearance', { trait, name });
    case 'type':
      return t('results.reason.type', { trait, name });
    default:
      return null;
  }
}

/** The interpretation for each encounter, on the leaning that defines it. */
function reading(input: ExplainInput, shown: readonly string[], locale: Locale, t: Translate): string | null {
  const name = speciesName(input.species, locale);
  const define = (id: string | undefined) => {
    const copy = id ? traitCopy(id) : undefined;
    return copy ? { trait: copy.label[locale], definition: lower(copy.definition[locale], locale) } : null;
  };
  switch (input.kind) {
    case 'soul': {
      const d = define(shown[0]);
      return d ? t('results.reading.soul', d) : null;
    }
    case 'alternative': {
      // What sets it apart: its strongest leaning that the Soul Match does not rest on.
      const soul = new Set(input.soulTraits ?? []);
      const own = shown.find((id) => !soul.has(id));
      const d = define(own);
      // Mid-sentence here, so the leaning's name is set in lower case.
      return d
        ? t('results.reading.alternative', { ...d, trait: lower(d.trait, locale), name, soulRole: input.soulRole })
        : t('results.reading.alternativeShared', { name, soulRole: input.soulRole });
    }
    case 'hidden': {
      const d = define(shown[0]);
      return d ? t('results.reading.hidden', { ...d, trait: lower(d.trait, locale) }) : null;
    }
  }
}

/**
 * Every sentence comes from data: the person's leanings (trait copy), the categories that
 * carried the match (engine drivers) and the evidence recorded for the species (Pokédex
 * entries, habitat, Speed, colour and shape, type). Nothing is said about a trait the species
 * has no evidence for, nothing is written per species, and thinly documented species get a
 * sentence that says so. Same input, same text.
 */
export function explain(input: ExplainInput, locale: Locale, t: Translate): Explanation {
  const { kind, species } = input;
  const name = speciesName(species, locale);
  const list = (items: readonly string[]) =>
    new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(items);
  const shown = input.traits.slice(0, 3);

  const phrases = shown.flatMap((id) => {
    const p = traitCopy(id)?.person[locale];
    return p ? [p] : [];
  });
  // Only leanings the species really has on record are said to be shared.
  const shared = shown.flatMap((id) => {
    const copy = traitCopy(id);
    return copy && species.traits.some((x) => x.t === id) ? [{ id, label: copy.label[locale] }] : [];
  });
  const categories = input.drivers
    .filter(isCategory)
    .slice(0, 2)
    .map((c) => t(`results.category.${c}`));

  const lead = [
    phrases.length > 0 ? t(`results.lead.${kind}`, { traits: list(phrases) }) : null,
    shared.length > 0 ? t('results.tie', { name, traits: list(shared.map((s) => lower(s.label, locale))) }) : null,
    categories.length > 0 ? t('results.drivers', { categories: list(categories) }) : null,
  ]
    .filter((x): x is string => x !== null)
    .join(' ');

  const reasons = shown.flatMap((id) => {
    const r = reason(id, species, locale, t);
    return r ? [r] : [];
  });
  const textual = species.traits.filter((x) => x.k.includes('pokedex-text')).length;
  return {
    lead,
    reading: reading(input, shown, locale, t),
    traits: shared,
    reasons,
    cautious: species.traits.length <= 2 || textual === 0 ? t('results.cautious', { name }) : null,
  };
}
