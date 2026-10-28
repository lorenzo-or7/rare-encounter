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

## C. Or7 visual review — refinements (round 1)
- **Liquid Nav:** links, logo and action now share one 2.5rem row inside 0.375rem of padding, so the inner pills sit concentric with the outer one. Added a hover pill that flows between links (Motion `layoutId`) and leaves when the pointer exits. The active indicator is quieter: a tinted fill and a short 2px iridescent baseline inside the pill. A hairline divider now separates links from settings. The top state keeps a hairline edge and a transparent body, then turns solid once you scroll. Structure and behavior are unchanged.
- **Secondary text:** `--color-text-subtle` went from #948ab0 (6.2:1) to #a59bc3 (7.6:1 on bg, 6.8:1 on card tint). The smallest text size went from 12px to 13px. Settings legends now use the primary text color and the hint uses muted. The card phrase went from 14px muted to 16px primary, and the pending label to 14px. The section lead is 18px on desktop.
- **Foundation hierarchy:** Components are now split into titled groups (Buttons / Icon buttons) on neutral stages, laid out 2:1 on desktop. Section rhythm is fluid. The theme grid has 2 columns on mobile and 3 from tablet up (it was a long single column on mobile). Type-scale labels and rows are tightened.
- **Cards:** art handling, behavior and composition are preserved. Only text legibility changed.
- **Checks:** typecheck, lint, Vitest 37/37, Playwright 16 passed and 2 skipped (a new test checks that the hover pill appears and leaves), safety scan, build, and the Impeccable detector (0 findings).
- **New evidence:** `phase-01a/*` refreshed, plus `desktop-nav-hover.png`.
