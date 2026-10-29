import { isLocale, type Locale } from '../i18n/locales';
import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  isModeId,
  isThemeId,
  type ModeId,
  type ThemeId,
} from '../theme/themes';
import { migrateRecord, type MigrationPlan } from './migrations';

/** localStorage holds lightweight preferences only; sessions live in IndexedDB. */
export const PREFERENCES_KEY = 'rare-encounter:preferences';
/** v2 adds the light/dark mode; v1 records migrate with the approved dark mode. */
export const PREFERENCES_VERSION = 2;

export interface Preferences {
  /** Only an explicit user choice is stored; null means "follow the browser". */
  readonly locale: Locale | null;
  readonly theme: ThemeId;
  /** Luminosity, independent of the palette. */
  readonly mode: ModeId;
}

export const DEFAULT_PREFERENCES: Preferences = {
  locale: null,
  theme: DEFAULT_THEME,
  mode: DEFAULT_MODE,
};

const isPreferences = (value: unknown): value is Preferences =>
  typeof value === 'object' &&
  value !== null &&
  'locale' in value &&
  'theme' in value &&
  'mode' in value &&
  (value.locale === null || isLocale(value.locale)) &&
  isThemeId(value.theme) &&
  isModeId(value.mode);

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

const plan: MigrationPlan<Preferences> = {
  currentVersion: PREFERENCES_VERSION,
  steps: {
    // v1 → v2: preferences saved before the mode existed keep the approved dark mode.
    1: (data) => (isRecord(data) ? { ...data, mode: DEFAULT_MODE } : data),
  },
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

/**
 * An unreadable mode alone falls back to dark without discarding the language and palette
 * stored next to it (the rest of the record is still validated as a whole).
 */
function repairMode(record: unknown): unknown {
  if (!isRecord(record) || record['schemaVersion'] !== PREFERENCES_VERSION) return record;
  const data = record['data'];
  if (!isRecord(data) || isModeId(data['mode'])) return record;
  return { ...record, data: { ...data, mode: DEFAULT_MODE } };
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
  const outcome = migrateRecord(repairMode(parsed), plan);
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
