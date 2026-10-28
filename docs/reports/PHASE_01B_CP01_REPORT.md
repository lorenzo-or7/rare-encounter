# Phase 01B — Checkpoint 01 report (structural landing + hero)

Branch `phase/01-visual-identity` (from `main` @ `aad7b85`). Not merged, not pushed. **Stopped for Or7 visual review.**

## A. Summary
**Delivered**
- **Landing at `/`:** the hero ("The Encounter") plus four structural sections (Beyond the Obvious, How Discovery Works, Every Connection Is Different, Begin Your Journey). In this checkpoint those four sections carry only their titles.
- **Integrated nav:** the 01A Liquid Nav / Top Bar and settings now come from a shared `SiteLayout`. Nav lists the four sections after the hero; the logo returns to the top.
- **Editorial Split hero:**
  - **Headline:** exact English source `Somewhere out there, there's your Pokémon.` Clash Display; copy aligned to the content column.
  - **Ghost Fibers:** own the right half and bleed to the viewport edge, with a masked fade under the type. On tablet and mobile they become the upper backdrop and the copy settles at the bottom.
- **Original React Bits**, vendored byte-for-byte from the official registry and verified by SHA-256 (`src/vendor/react-bits/README.md`):
  - **Ghost Fibers:** colors follow the active theme. Lazy chunk, 9.5 kB gzip. Pulse-on-click is turned off, through props only.
  - **Gradient Text:** **only** on `your Pokémon`, with theme colors.
  - **Star Border:** the CTA (`<a href="#begin">`, per D7), with theme colors.
- **Cinematic Motion:** one sequence played once. The headline line, then the gradient phrase, then the lead, then the CTA (0.15 / 0.45 / 0.85 / 1.05 s, 1.1 s expo-out with blur, opacity and a small y shift). The fibers use their own 2.6 s intro. With reduced motion everything renders final immediately, and the vendored components stop their own motion.
- **D8:** the Visual Foundation page is now `/foundation` in **dev only**. Its code and text are absent from the production bundle (verified with `grep` on `dist/`).
- **i18n:** hero copy, nav labels and section titles in en, pt-BR and es. The headline is split into `before / highlight / after` so each locale highlights its own phrase. Everything except the exact English headline is a **draft** for Or7 review.

**Not in this checkpoint:** section content, Stepper, Floating Archetype Cards in the landing, Liquid Flow infrastructure, final copy approval.

## B. Technical verification
| Check | Result |
| --- | --- |
| typecheck (`tsc -b`, incl. new `tsconfig.vendor.json`) | ✅ |
| lint (vendor excluded to keep originals unmodified) | ✅ 0 problems |
| Vitest | ✅ 41/41 (new: exact headline reassembly, highlight per locale) |
| Playwright, 3 viewports | ✅ 22 passed, 2 skipped (desktop-only nav test) |
| Safety scan | ✅ |
| Build | ✅ main 124 kB gzip + GhostFibers 9.5 kB gzip (lazy) |
| Impeccable detector | ✅ 0 findings |

**E2E coverage:**
- Exact headline, single gradient span, Star Border CTA with `href="#begin"`, no horizontal overflow.
- CTA scrolls to Begin Your Journey.
- Nav lists the four sections; desktop condense, active state and hover.
- Language and theme persist; the headline and fibers follow the theme.
- Clash Display loads.
- Reduced motion shows the final state immediately.
- es browser detection.

**Implementation notes:**
- **Vendored code:** React Bits sources do not pass this project's extra flags (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; 163 errors). Instead of editing them, they compile in their own TS project with standard `strict` (0 errors) and are consumed through declarations.
- **E2E runs serially (`workers: 1`):** headless Chromium renders WebGL in software, and parallel workers starved each other. Serially all tests pass (2.2 min).
- **Dependencies:** none added in this checkpoint. The hugeicons packages come with the Stepper in checkpoint 02.

**Evidence** (`docs/reports/phase-01b-cp01/`): `desktop-hero`, `tablet-hero`, `mobile-hero`, `desktop-nav-scrolled`, `desktop-hero-ptbr-ember`, `mobile-hero-reduced-motion`, `desktop-full`. Extra captures (all locales and viewports) are regenerated in `test-results/screens/`.

## For Or7 review
1. Hero composition: split proportions, fiber placement, and the mobile/tablet stacking with fibers on top.
2. Entry timings (proposed, not final).
3. Draft copy: lead line, CTA "Begin your journey", short nav labels (Beyond the obvious / How it works / Connections / Begin) and their pt-BR/es versions.
4. Section titles: kept in the approved Title Case. pt-BR/es titles are drafts.

## Pending (unchanged)
D1 final logo (text placeholder) · D2 art-only cards · D3 the card serif will be proposed in checkpoint 02 · D10 Clash Display hosting.
