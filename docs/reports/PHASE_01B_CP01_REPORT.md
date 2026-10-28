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

## C. Or7 review — refinements (round 1)
Measured with a layout probe at 360–1920 px, then verified on the real captures.
- **Headline:**
  - On tablet and desktop it breaks at its natural phrase: `Somewhere out there, / there's your Pokémon.` It used to fall into 3–4 lines with the artificial "there, there's" split.
  - It is still one sentence, 2 lines, no overflow, from 768 to 1920 px. Phones keep natural wrapping (3 lines at 412, 4 at 360).
  - The text is unchanged: i18n now groups it as `opening / bridge / highlight / after`, and a test reassembles the exact English source.
  - Word gap restored (`word-spacing: 0.08em`) and tracking eased from -0.035em to -0.025em. Desktop size is fluid from 3.5rem to 5.75rem.
  - Gradient Text is still only on `your Pokémon`.
- **Ghost Fibers:** the original component is unchanged (`check:vendor` passes). Only the container changed:
  - On desktop the fibers start where the headline is about 75% across, scaled to the headline's own size, and fade in over the first 38% of their width. The headline now ends inside that fade at every width (for example text right edge 856 px vs. fibers opaque from about 867 px at 1280).
  - Mobile and tablet bands are tighter, with opacity 0.85 on small screens.
- **Star Border CTA:**
  - Size 60 px (64 px from tablet up), semibold 17 px.
  - Surface tinted with the accent, a stronger accent track and a soft accent shadow.
  - The original star effect is unchanged. Still `href="#begin"`.
- **Liquid Nav:**
  - Labels go from 14 px muted to 15 px brighter, on a 44 px row.
  - The top state gets a light veil so labels stay legible over the fibers.
  - Morphing to solid on scroll is unchanged, and so is the mobile Top Bar.
- **Responsiveness:**
  - Tablet hero height is capped at 56 rem, so the next section starts within the first screen and there is no dead band.
  - On phones the fibers band ends where the headline begins.
- **Motion:**
  - The entry finishes in about 1.75 s (it was about 2.15 s).
  - Each stage takes 0.9 s, with lighter blur (6 px) and a smaller rise.
  - Stages start at 0.10 / 0.32 / 0.68 / 0.84 s.
  - No new animations. Reduced motion is unchanged and tested.
- **Vendor isolation:**
  - **Errors are not hidden:** a probe file with wrong prop types (`speed="fast"`, `radius="30px"`, `colors="#fff"`) failed `tsc -b` with 3 errors. The app checks every call against the components' real types.
  - **Originals are protected:** the new `npm run check:vendor` compares SHA-256 against `manifest.json`. A deliberate one-line edit was detected and then reverted. It is now part of `npm run check`.

**Checks:**
- typecheck ✅
- lint ✅
- Vitest 41/41 ✅
- Playwright 22 passed, 2 skipped (desktop-only nav test) ✅
- safety ✅
- vendor integrity ✅
- build ✅
- Impeccable detector: 0 findings

**Evidence:** `docs/reports/phase-01b-cp01/` has been refreshed.
