import { migrateRecord, type MigrationPlan } from './migrations';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  PREFERENCES_KEY,
  savePreferences,
} from './preferences';

interface V2 {
  readonly name: string;
  readonly count: number;
}

const plan: MigrationPlan<V2> = {
  currentVersion: 2,
  steps: { 1: (data) => ({ ...(data as object), count: 0 }) },
  validate: (d): d is V2 =>
    typeof d === 'object' && d !== null && 'name' in d && 'count' in d,
};

describe('migrateRecord', () => {
  it('returns current data untouched', () => {
    expect(migrateRecord({ schemaVersion: 2, data: { name: 'a', count: 1 } }, plan)).toEqual({
      status: 'current',
      value: { name: 'a', count: 1 },
    });
  });

  it('applies steps from older versions', () => {
    expect(migrateRecord({ schemaVersion: 1, data: { name: 'a' } }, plan)).toEqual({
      status: 'migrated',
      value: { name: 'a', count: 0 },
      from: 1,
    });
  });

  it('asks for assisted restart instead of discarding data', () => {
    const newer = { schemaVersion: 3, data: {} };
    expect(migrateRecord(newer, plan)).toEqual({
      status: 'needs-restart',
      reason: 'newer-schema',
      raw: newer,
    });
    expect(migrateRecord({ schemaVersion: 2, data: { name: 'a' } }, plan)).toMatchObject({
      status: 'needs-restart',
      reason: 'invalid',
    });
    expect(migrateRecord('garbage', plan)).toMatchObject({ reason: 'invalid', raw: 'garbage' });
    expect(
      migrateRecord({ schemaVersion: 1, data: {} }, { ...plan, steps: {} }),
    ).toMatchObject({ reason: 'no-migration-path' });
  });
});

describe('preferences', () => {
  it('round-trips through localStorage with a versioned envelope', () => {
    expect(savePreferences({ locale: 'pt-BR', theme: 'ember', mode: 'light' })).toBe(true);
    expect(JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? '')).toEqual({
      schemaVersion: 2,
      data: { locale: 'pt-BR', theme: 'ember', mode: 'light' },
    });
    expect(loadPreferences()).toEqual({ locale: 'pt-BR', theme: 'ember', mode: 'light' });
  });

  it('falls back to defaults on missing, corrupt or invalid data without erasing it', () => {
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
    localStorage.setItem(PREFERENCES_KEY, '{not json');
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ schemaVersion: 1, data: { theme: 'neon' } }));
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
    expect(localStorage.getItem(PREFERENCES_KEY)).not.toBeNull();
  });

  it('defaults to Spectrum, dark, with no explicit locale', () => {
    expect(DEFAULT_PREFERENCES).toEqual({ locale: null, theme: 'spectrum', mode: 'dark' });
  });

  it('migrates v1 preferences (before light mode existed) to the approved dark mode', () => {
    localStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ schemaVersion: 1, data: { locale: 'es', theme: 'sakura' } }),
    );
    expect(loadPreferences()).toEqual({ locale: 'es', theme: 'sakura', mode: 'dark' });
  });

  it('repairs an unreadable mode alone, keeping language and palette', () => {
    for (const mode of ['sepia', 42, null, undefined]) {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({ schemaVersion: 2, data: { locale: 'pt-BR', theme: 'verdant', mode } }),
      );
      expect(loadPreferences()).toEqual({ locale: 'pt-BR', theme: 'verdant', mode: 'dark' });
    }
  });

  it('keeps palette and mode independent', () => {
    savePreferences({ locale: null, theme: 'azure', mode: 'light' });
    savePreferences({ ...loadPreferences(), theme: 'ember' });
    expect(loadPreferences()).toMatchObject({ theme: 'ember', mode: 'light' });
    savePreferences({ ...loadPreferences(), mode: 'dark' });
    expect(loadPreferences()).toMatchObject({ theme: 'ember', mode: 'dark' });
  });

  it('survives unavailable storage', () => {
    expect(loadPreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(savePreferences(DEFAULT_PREFERENCES, null)).toBe(false);
  });
});
