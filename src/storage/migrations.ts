/**
 * Versioned record migrations.
 *
 * Contract (blueprint): migrate when a validated path exists, otherwise ask the
 * user for an assisted restart. Never silently delete or recompute old data —
 * callers receive the original raw record so nothing is lost.
 */

export interface Versioned {
  readonly schemaVersion: number;
}

/** Upgrades data from version N to N + 1. */
export type MigrationStep = (data: unknown) => unknown;

export type MigrationOutcome<T> =
  | { readonly status: 'current'; readonly value: T }
  | { readonly status: 'migrated'; readonly value: T; readonly from: number }
  | {
      readonly status: 'needs-restart';
      readonly reason: 'invalid' | 'no-migration-path' | 'newer-schema';
      readonly raw: unknown;
    };

export interface MigrationPlan<T> {
  readonly currentVersion: number;
  /** Keyed by source version: steps[1] migrates v1 data to v2. */
  readonly steps: Readonly<Record<number, MigrationStep>>;
  readonly validate: (data: unknown) => data is T;
}

export function migrateRecord<T>(
  record: unknown,
  plan: MigrationPlan<T>,
): MigrationOutcome<T> {
  if (!isVersioned(record)) return { status: 'needs-restart', reason: 'invalid', raw: record };

  const from = record.schemaVersion;
  if (from > plan.currentVersion) {
    return { status: 'needs-restart', reason: 'newer-schema', raw: record };
  }

  let data: unknown = 'data' in record ? record.data : undefined;
  for (let v = from; v < plan.currentVersion; v++) {
    const step = plan.steps[v];
    if (!step) return { status: 'needs-restart', reason: 'no-migration-path', raw: record };
    try {
      data = step(data);
    } catch {
      return { status: 'needs-restart', reason: 'invalid', raw: record };
    }
  }

  if (!plan.validate(data)) return { status: 'needs-restart', reason: 'invalid', raw: record };
  return from === plan.currentVersion
    ? { status: 'current', value: data }
    : { status: 'migrated', value: data, from };
}

function isVersioned(value: unknown): value is Versioned & { readonly data?: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    Number.isInteger(value.schemaVersion) &&
    (value.schemaVersion as number) >= 1
  );
}
