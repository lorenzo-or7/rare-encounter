<div align="center">

# Rare Encounter

**A Pokémon personality and aesthetics discovery, by Or7.**

`Phase 00 · Foundation` · React 19 · TypeScript (strict) · Vite 8

</div>

---

Rare Encounter asks 30, 60 or 90 questions and compares your answers with every eligible species, using normalized weighted scores and no popularity bonus. It returns a Soul Match, a Hidden Match and Alternative Matches, and each one comes with an explanation.

This repository is in **Phase 00 — Foundation**. It contains the architecture, the contracts and the tooling. There is no landing page, quiz or matching engine yet.

## Status

| Phase | Scope | State |
| --- | --- | --- |
| 00 | Foundation | In review |
| 01 | Visual identity and landing | Not started |
| 02 | Quiz UX | Not started |
| 03 | Catalog and profiles | Not started |
| 04 | Question bank, engine and coverage | Not started |
| 05 | Results and sharing | Not started |
| 06 | Full QA and release | Not started |

Each phase stops for explicit Or7 approval. Nothing merges or deploys automatically.

## Getting started

Requires Node.js 20.19 or newer.

```bash
npm install
npx playwright install chromium
npm run dev
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc -b` across app and tooling configs |
| `npm run lint` | ESLint with `typescript-eslint` strict type-checked rules |
| `npm test` | Vitest unit and component tests |
| `npm run test:e2e` | Playwright (desktop Chrome and Pixel 7), with screenshots in `test-results/` |
| `npm run check:safety` | Scans publishable files for secrets, env files, video media and files over 5 MB |
| `npm run check` | Typecheck, lint, unit tests and the safety scan |

## Architecture

```
src/
  app/          Providers and app-level context (preferences, i18n access)
  components/   UI components (Phase 00: accessible app shell only)
  domain/       React-free types and approved config: categories, modes, catalog,
                traits, questions, sessions, rankings, results
  i18n/         Locales, resolution rules, typed message catalogs (pt-BR, en, es)
  storage/      Versioned migrations, localStorage preferences, IndexedDB store
  styles/       Semantic tokens, six themes, base styles
  theme/        Theme registry and application
e2e/            Playwright specs
scripts/        Repository tooling
docs/           Blueprint, visual direction, phase specs and reports
```

More detail is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### Principles

- **Matching logic stays outside React.** `src/domain` imports no UI code, so the engine can be tested and audited on its own.
- **IDs over text.** Answers store stable question and answer IDs. Changing the language mid-quiz never changes them.
- **No silent data loss.** Stored records carry a schema version. Old records are migrated when a validated migration exists. Otherwise the user is offered an assisted restart. Nothing is deleted or recomputed without the user.
- **Themes change accents only.** All six themes share structure, surfaces and contrast. None of them affect scoring.

## Documentation

- [Approved blueprint](docs/APPROVED_BLUEPRINT.md)
- [Visual direction](docs/VISUAL_DIRECTION.md)
- [Asset manifest](docs/ASSET_MANIFEST.md)
- [Phase 00 spec](docs/PHASE_00.md) · [Phase 00 report](docs/reports/PHASE_00_REPORT.md)

## Rights

Original code and design: © 2026 Or7, All Rights Reserved. See [LICENSE](LICENSE).

Rare Encounter is an unofficial fan project. Pokémon and all related names and imagery belong to Nintendo, Creatures Inc. and GAME FREAK inc. Pokémon and TCG assets require a rights review before any public release.
