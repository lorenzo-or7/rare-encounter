import type { Locale } from '../i18n/locales';

/** Content strings must exist in every supported locale. */
export type LocalizedText = Readonly<Record<Locale, string>>;
