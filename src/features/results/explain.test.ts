import type { Catalog, CatalogSpecies } from '../../content/pokedex/catalog';
import catalogJson from '../../content/pokedex/pokedex.v1.json';
import { traitCopy } from '../../content/traits';
import { LOCALES, type Locale } from '../../i18n/locales';
import { format, MESSAGES } from '../../i18n/messages';
import type { MessageKey } from '../../i18n/messages/en';
import { explain, type ExplainInput } from './explain';

const catalog = catalogJson as unknown as Catalog;

const translator = (locale: Locale) => (key: MessageKey, params?: Readonly<Record<string, string | number>>) =>
  format(MESSAGES[locale][key], params);

/** A species with several documented traits, and its three strongest trait ids. */
const rich = catalog.species.find((s) => s.traits.filter((x) => x.k.includes('pokedex-text')).length >= 3) as CatalogSpecies;
const own = rich.traits.slice(0, 3).map((x) => x.t);
const missing = 'personality.nonexistent-trait';

const input = (over: Partial<ExplainInput> = {}): ExplainInput => ({
  kind: 'soul',
  traits: own,
  drivers: ['personality', 'aesthetics'],
  species: rich,
  soulRole: 'Soul Match',
  ...over,
});

describe('layered explanations', () => {
  it.each(LOCALES)('are complete sentences in %s, with every placeholder filled', (locale) => {
    for (const kind of ['soul', 'alternative', 'hidden'] as const) {
      const e = explain(input({ kind, soulTraits: [own[0] ?? ''] }), locale, translator(locale));
      const text = [e.lead, e.reading ?? '', ...e.reasons].join(' ');
      expect(e.lead.length).toBeGreaterThan(40);
      expect(e.reading).not.toBeNull();
      expect(text).not.toMatch(/\{\w+\}/);
    }
  });

  it('are deterministic', () => {
    const t = translator('pt-BR');
    expect(explain(input(), 'pt-BR', t)).toEqual(explain(input(), 'pt-BR', t));
  });

  it('never call a leaning shared when the species has no record of it', () => {
    const e = explain(input({ traits: [missing, ...own] }), 'en', translator('en'));
    expect(e.traits.map((x) => x.id)).not.toContain(missing);
    for (const note of e.traits) expect(rich.traits.some((x) => x.t === note.id)).toBe(true);
  });

  it('differ by encounter: the Alternative names what sets it apart from the Soul Match', () => {
    const t = translator('en');
    const soul = explain(input(), 'en', t);
    const alt = explain(input({ kind: 'alternative', soulTraits: [own[0] ?? ''] }), 'en', t);
    const hidden = explain(input({ kind: 'hidden' }), 'en', t);
    expect(new Set([soul.reading, alt.reading, hidden.reading]).size).toBe(3);
    const apart = traitCopy(own[1] ?? '')?.label.en.toLowerCase() ?? '';
    expect(alt.reading).toContain(apart);
    // Same leanings as the Soul Match: it says so instead of inventing a difference.
    const same = explain(input({ kind: 'alternative', soulTraits: own }), 'en', t);
    expect(same.reading).toContain('different balance');
  });

  it('say so when a species is thinly documented', () => {
    const thin = catalog.species.find((s) => s.traits.length > 0 && s.traits.every((x) => !x.k.includes('pokedex-text')));
    if (!thin) return;
    const e = explain(input({ species: thin, traits: thin.traits.map((x) => x.t) }), 'en', translator('en'));
    expect(e.cautious).not.toBeNull();
  });
});
