# Architecture — Phase 00 contracts

## Layers
- `domain/` — pure TypeScript. Branded IDs (`SpeciesId`, `QuestionId`, `AnswerId`, `TraitId`, version IDs), the 6 categories and weights, mode quotas (30/60/90 with fundamental/adaptive mix), catalog, question, session, ranking and result types. The 48-trait taxonomy is NOT approved: `TraitId` is opaque and `validateTraitVector` checks structure only (count, range, known IDs).
- `i18n/` — `resolveLocale(explicit, browserLanguages)`: saved explicit choice > first supported browser language (exact, then primary subtag) > `en`. `en.ts` is the source catalog; `pt-BR`/`es` are typed as `Messages`, so a missing key fails typecheck and the parity test.
- `theme/` + `styles/` — `data-theme` on `<html>`. `tokens.css` defines semantic tokens and Spectrum; `themes.css` overrides only the accent layer for Amethyst, Azure, Ember, Sakura and Verdant. An inline script in `index.html` applies the saved theme before first paint.
- `storage/`
  - `migrations.ts` — `migrateRecord(record, plan)` returns `current | migrated | needs-restart` (reasons: `invalid`, `no-migration-path`, `newer-schema`) and always hands back the raw record.
  - `preferences.ts` — localStorage key `rare-encounter:preferences`, envelope `{ schemaVersion, data: { locale | null, theme } }`. Unreadable data falls back to defaults without being erased.
  - `encounter-store.ts` — IndexedDB `rare-encounter` v1. Store `sessions` (keyPath `id`, index `data.updatedAt`) and store `results` (single slot `latest`). Every write resolves after the transaction commits. `recordAnswer` is read-modify-write inside one transaction. `completeSession` marks the session completed and replaces the latest result atomically. Deletion happens only through `deleteSession` (explicit start over).
- `app/` — `PreferencesProvider` exposes `locale`, `theme`, setters and `t()`, and keeps `<html lang>` in sync.

## Not in Phase 00
Landing, React Bits, Motion, quiz UI, question bank, catalog data, matching engine, results, Share Studio, hosting.
