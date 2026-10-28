# PHASE 00 — Foundation (only authorized execution)

## Scope
1. Inspect existing repository, worktree and installed skills. Preserve pre-existing code.
2. Configure React + TypeScript + Vite, strict TS, ESLint and sensible scripts.
3. Establish modular src organization and semantic CSS theme-token system (six themes, Spectrum default).
4. Set up i18n architecture: pt-BR, en, es; saved explicit choice > browser selection > en.
5. Define localStorage preferences / IndexedDB session-result abstractions and versioned migrations (do NOT build full quiz UI).
6. Define typed interfaces for catalog, species IDs, questions, answer IDs, 6 categories, 48 traits (taxonomy remains unapproved), rankings and results.
7. Set up Vitest and Playwright, initial meaningful tests, accessible basic app shell.
8. Create README Premium Or7, public-repo safety checks, documentation and initial phase report.
9. Work in `phase/00-foundation` from latest approved main. Do not merge/deploy/push without permission.

## Do not implement
Final landing, React Bits effects, 300 questions, Pokémon profiles, matching engine, complete quiz, results, Share Studio, hosting, video landscapes.

## Exit criteria
Working dev server and production build; passing typecheck/lint/tests; valid i18n/theme/storage contracts; no secrets or unapproved media tracked; report grounded in executed commands.

## Required report, concise
A. Delivered / not delivered / passed-failed-skipped / blockers / status.
B. Changed files, commands/results, screenshots when relevant, deviations, Git status.
End with READY FOR OR7 REVIEW only if all critical criteria actually pass. Otherwise INCOMPLETE/BLOCKED. STOP.
