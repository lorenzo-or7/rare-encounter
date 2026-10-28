export const LOCALES = ['pt-BR', 'en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Endonyms: each language is always shown in its own name. */
export const LOCALE_NAMES: Readonly<Record<Locale, string>> = {
  'pt-BR': 'Português (Brasil)',
  en: 'English',
  es: 'Español',
};

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

/** Maps a BCP 47 tag to a supported locale: exact match first, then primary language. */
export function matchLocale(tag: string): Locale | null {
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return null;
  const exact = LOCALES.find((l) => l.toLowerCase() === normalized);
  if (exact) return exact;
  const primary = normalized.split('-')[0];
  return LOCALES.find((l) => l.toLowerCase().split('-')[0] === primary) ?? null;
}

/** Resolution order: saved explicit choice > browser languages > English. */
export function resolveLocale(
  explicit: Locale | null | undefined,
  browserLanguages: readonly string[],
): Locale {
  if (explicit && isLocale(explicit)) return explicit;
  for (const tag of browserLanguages) {
    const match = matchLocale(tag);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}

export function browserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return [];
  return navigator.languages.length > 0 ? navigator.languages : [navigator.language];
}
