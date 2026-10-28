import { isLocale, type Locale } from '../i18n/locales';
import { DEFAULT_THEME, isThemeId, type ThemeId } from '../theme/themes';
import { migrateRecord, type MigrationPlan } from './migrations';

/** localStorage holds lightweight preferences only; sessions live in IndexedDB. */
export const PREFERENCES_KEY = 'rare-encounter:preferences';
export const PREFERENCES_VERSION = 1;

export interface Preferences {
  /** Only an explicit user choice is stored; null means "follow the browser". */
  readonly locale: Locale | null;
  readonly theme: ThemeId;
}

export const DEFAULT_PREFERENCES: Preferences = { locale: null, theme: DEFAULT_THEME };

const isPreferences = (value: unknown): value is Preferences =>
  typeof value === 'object' &&
  value !== null &&
  'locale' in value &&
  'theme' in value &&
  (value.locale === null || isLocale(value.locale)) &&
  isThemeId(value.theme);

const plan: MigrationPlan<Preferences> = {
  currentVersion: PREFERENCES_VERSION,
  steps: {},
  validate: isPreferences,
};

function getStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    // Access can throw in private modes or with storage blocked.
    return null;
  }
}

/** Preferences are non-critical: unreadable data falls back to defaults without being erased. */
export function loadPreferences(storage: Storage | null = getStorage()): Preferences {
  if (!storage) return DEFAULT_PREFERENCES;
  let parsed: unknown;
  try {
    const raw = storage.getItem(PREFERENCES_KEY);
    if (raw === null) return DEFAULT_PREFERENCES;
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_PREFERENCES;
  }
  const outcome = migrateRecord(parsed, plan);
  return outcome.status === 'needs-restart' ? DEFAULT_PREFERENCES : outcome.value;
}

export function savePreferences(
  prefs: Preferences,
  storage: Storage | null = getStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ schemaVersion: PREFERENCES_VERSION, data: prefs }),
    );
    return true;
  } catch {
    return false;
  }
}
