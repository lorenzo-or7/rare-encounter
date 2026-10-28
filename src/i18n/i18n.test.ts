import { LOCALES, matchLocale, resolveLocale } from './locales';
import { format, MESSAGES } from './messages';

describe('resolveLocale', () => {
  it('prefers the saved explicit choice over the browser', () => {
    expect(resolveLocale('es', ['pt-BR', 'en'])).toBe('es');
  });

  it('falls back to the first supported browser language', () => {
    expect(resolveLocale(null, ['de-DE', 'pt-PT', 'en'])).toBe('pt-BR');
    expect(resolveLocale(null, ['es-MX'])).toBe('es');
    expect(resolveLocale(undefined, ['en-GB'])).toBe('en');
  });

  it('defaults to English when nothing matches', () => {
    expect(resolveLocale(null, ['ja', 'fr-FR'])).toBe('en');
    expect(resolveLocale(null, [])).toBe('en');
  });

  it('matches tags case-insensitively', () => {
    expect(matchLocale('PT-br')).toBe('pt-BR');
    expect(matchLocale('')).toBeNull();
  });
});

describe('message catalogs', () => {
  const reference = Object.keys(MESSAGES.en).sort();

  it.each(LOCALES)('%s has exactly the source keys, all non-empty', (locale) => {
    const messages = MESSAGES[locale];
    expect(Object.keys(messages).sort()).toEqual(reference);
    for (const value of Object.values(messages)) expect(value.trim()).not.toBe('');
  });

  it('formats placeholders and leaves unknown ones visible', () => {
    expect(format('{n} of {total}', { n: 3, total: 30 })).toBe('3 of 30');
    expect(format('{missing}', {})).toBe('{missing}');
  });
});

describe('landing headline', () => {
  const assemble = (locale: (typeof LOCALES)[number]) => {
    const m = MESSAGES[locale];
    return `${m['landing.hero.before']} ${m['landing.hero.highlight']}${m['landing.hero.after']}`;
  };

  it('reassembles the exact approved English source', () => {
    expect(assemble('en')).toBe("Somewhere out there, there's your Pokémon.");
  });

  it.each(LOCALES)('%s keeps a gradient phrase that names Pokémon', (locale) => {
    expect(MESSAGES[locale]['landing.hero.highlight']).toMatch(/Pokémon$/);
    expect(assemble(locale)).toMatch(/Pokémon\.$/);
  });
});
