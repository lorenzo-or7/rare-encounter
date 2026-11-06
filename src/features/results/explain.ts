import type { CatalogSpecies, EvidenceKind } from '../../content/pokedex/catalog';
import { traitCopy } from '../../content/traits';
import type { MatchKind } from '../../domain/results';
import type { Locale } from '../../i18n/locales';
import type { MessageKey } from '../../i18n/messages/en';

type Translate = (key: MessageKey, params?: Readonly<Record<string, string | number>>) => string;

export interface Explanation {
  readonly lead: string;
  readonly reasons: readonly string[];
  /** Set when the species has little recorded evidence: the copy says so. */
  readonly cautious: string | null;
}

/** Strongest kind of evidence first: what the Pokédex says beats what the type suggests. */
const ORDER: readonly EvidenceKind[] = ['pokedex-text', 'habitat', 'game-stats', 'appearance', 'type'];

export const speciesName = (s: CatalogSpecies, locale: Locale) => (locale === 'es' ? s.name.es : s.name.en);

function reason(
  traitId: string,
  species: CatalogSpecies,
  locale: Locale,
  t: Translate,
): string | null {
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

/**
 * The "Why this Pokémon?" copy. Every sentence comes from data: the person's leanings
 * (trait copy) and the evidence recorded for the species (Pokédex entries, habitat, Speed,
 * colour and shape, type). Nothing is said about a trait the species has no evidence for,
 * and thinly documented species get a sentence that says so.
 */
export function explain(
  kind: MatchKind,
  traits: readonly string[],
  species: CatalogSpecies,
  locale: Locale,
  t: Translate,
): Explanation {
  const shown = traits.slice(0, 3);
  const phrases = shown.flatMap((id) => {
    const p = traitCopy(id)?.person[locale];
    return p ? [p] : [];
  });
  const list = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(phrases);
  const reasons = shown.flatMap((id) => {
    const r = reason(id, species, locale, t);
    return r ? [r] : [];
  });
  const textual = species.traits.filter((x) => x.k.includes('pokedex-text')).length;
  return {
    lead: t(`results.lead.${kind}` as MessageKey, { traits: list }),
    reasons,
    cautious: species.traits.length <= 2 || textual === 0 ? t('results.cautious', { name: speciesName(species, locale) }) : null,
  };
}
