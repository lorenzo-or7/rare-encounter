# Phase 01A — Visual Foundation report

Branch `phase/01-visual-identity` (from `main` @ `cd684dc`). Not merged, not pushed.

## A. Summary
**Delivered**
- Typography: Clash Display (official variable WOFF2, unmodified) for display and headings, Inter for UI. Type scale tokens run from display to small.
- Tokens: surfaces, text, accents, archetype hues, type, spacing, radii and depth. The motion and layer tokens were reworked. All six themes have explicit scopes, and the `--iris` accent gradient is recomputed per theme.
- Floating Liquid Nav (desktop ≥ 900px): transparent at the top of the page, it condenses into a pill on scroll, and a spring indicator follows the active section.
- Floating Top Bar (mobile and tablet portrait): brand plus a menu button.
- Settings: a native modal `<dialog>`. On desktop it is a right-side drawer, on mobile a bottom sheet with the section links. It has language and theme radio groups. Esc, the backdrop and the close button all close it, and focus returns to the trigger.
- Components: Button (primary, secondary, ghost, md and lg sizes, disabled), IconButton, an authored SVG Icon set, a Logo slot and Sheet.
- Archetype Card: the art layer is separate from the real DOM number, title, phrase and action. The phrase reveals on click or tap (`aria-expanded`/`aria-controls`). Tilt and glow happen only on hover-capable fine pointers, and reduced motion is respected through `MotionConfig`.
- A foundation page (the existing shell, not a landing) exercises every item above.

**Decisions applied:** Q1 is handled as below. Q2: no Stepper or Border Glow was added. Q3 and Q4 are deferred to 01B as authorized.

**Checks:** typecheck ✅ · lint ✅ (0 warnings) · Vitest 37/37 ✅ · Playwright 16 passed, 2 skipped (desktop-only nav test on tablet and mobile) across desktop, tablet and mobile ✅ · safety scan ✅ · build ✅ · Impeccable detector: 0 findings.

## B. Technical verification
- **Clash Display license (ITF FFL v2.0, read from the official kit):** §01 allows self-hosting on our own site. §02 forbids making the font available through a "repository" or "publicly accessible servers", and §02/§05 forbid modifying or converting the file. Result: the font is **not versioned**. `public/fonts/` is gitignored. `npm run fonts:setup` fetches the official kit from Fontshare and extracts the variable WOFF2 byte-for-byte. The safety scan now fails if any Clash Display file or `public/fonts/` content is tracked. Without the file, headings fall back to Inter.
- **Fixed during verification:**
  - The sheet header was a second `banner` landmark, so it is now a `div`.
  - Card hover glow stuck on touch, so it is now gated by `@media (hover: hover)`.
  - The hidden radios timed out in E2E, so the invisible input now covers its whole row.
- **New dependency:** `motion@14.7.1`, as planned. No others.
- **Evidence:** `docs/reports/phase-01a/` holds top, sheet and cards screenshots for desktop (1280×720), tablet (iPad Mini, 768×1024) and mobile (Pixel 7, 412×915), plus `desktop-nav-condensed.png`.

## Pending
1. **Final logo file (and compact symbol).** The navbar uses a plain-text name. `src/components/logo/logo-asset.ts` is the single switch.
2. **Art-only archetype cards.** Cards show an explicit "Art-only version pending" state. `ARCHETYPES[].art` is the single switch. Also needs a decision on whether the number stays in the art.
3. **Card title typeface:** the approved art sets the title in a serif. The DOM uses Clash Display, per the approved type pairing. Or7 should confirm.
4. **Clash Display for deployment:** each environment must run `npm run fonts:setup` (CI/deploy step to be defined with hosting).
5. **pt-BR/es** card and UI copy are drafts for Or7 editorial approval.
6. Bundle is 123 kB gzip JS (Motion included). Review `LazyMotion` in the 01B performance pass. No automated axe run yet (no new dependency added); contrast was checked manually.
