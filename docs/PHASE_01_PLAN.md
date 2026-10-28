# PHASE 01 — Visual Identity & Landing · Plan

Status: **PLANNED, NOT AUTHORIZED.** Branch `phase/01-visual-identity` (from `main` @ `cd684dc`).
Source of truth: `VISUAL_DIRECTION.md`, `ASSET_MANIFEST.md`, `APPROVED_BLUEPRINT.md`. This plan adds no new decisions; open items are listed as questions.

Delivered in two gated parts. Each part ends with checks, a report and a STOP for Or7 approval.

---

## 01A — Identity, typography, logo, navbar, components, assets

| # | Work | Depends on |
| --- | --- | --- |
| A1 | Final typography: `@font-face` for Clash Display (headlines) + Inter (UI), display/body scale, metrics checked against the reference cards | **Asset 1** |
| A2 | Logo component from the authentic file (full logotype + separate compact symbol), favicon, app icons, `theme-color` | **Asset 2** |
| A3 | Refine token layer (surfaces, restrained iridescence, borders, elevation, motion tokens) across all six themes; contrast re-verified | — |
| A4 | Navigation: Floating Liquid Nav (desktop, morphing) + Floating Top Bar (mobile) | A2 |
| A5 | Settings: right-side drawer (desktop) / bottom sheet (mobile) containing language + theme; focus trap, Esc, return focus | — |
| A6 | Base components: Button (primary/secondary), IconButton, Section/Container, Eyebrow/Heading, VisuallyHidden, Drawer/Sheet primitive | — |
| A7 | Archetype Card component (Ethereal / Instinctive / Radiant): art layer + localized DOM title, phrase and "Tap to discover" action; tilt/glow on hover, brief phrase reveal on click/tap, no modal; reduced-motion variant | **Asset 3**, Motion |
| A8 | Asset pipeline: optimized runtime assets in `src/assets/` (AVIF/WebP + PNG fallback, explicit sizes); originals stay in `design-references/approved/` | Assets 2–3 |
| A9 | Install `motion` (Motion for React); CSS for lightweight details | — |

**01A checks:** typecheck, lint, Vitest (components, focus management, i18n of card copy), Playwright desktop/tablet/mobile + screenshots compared to the reference cards and logo, axe a11y pass, safety scan, bundle/image weight.

## 01B — Full landing, React Bits, motion design, responsiveness

| # | Work | Depends on |
| --- | --- | --- |
| B1 | Editorial Split hero: oversized headline, exact English source `Somewhere out there, there's your Pokémon.`; Gradient Text **only** on `your Pokémon`; Star Border primary CTA | 01A, Asset 1 |
| B2 | Original React Bits **Ghost Fibers** on the right side of the hero | React Bits verification |
| B3 | Cinematic staged entry (with reduced-motion alternative) | B1–B2 |
| B4 | Narrative sections: The Encounter · Beyond the Obvious · How Discovery Works · Every Connection Is Different · Begin Your Journey | 01A |
| B5 | Floating Archetype Cards section with Interactive Discovery | A7 |
| B6 | React Bits Stepper / Border Glow on their assigned surfaces | Decision Q2 |
| B7 | Liquid Flow transition landing → preparation | Decision Q3 |
| B8 | pt-BR / es copy for every landing string (Humanizer pass); English headline stays exact | Decision Q4 |
| B9 | Responsive and performance pass: no clipping, LCP/CLS budget, GPU-cost limits on effects, `prefers-reduced-motion` everywhere | — |

**01B checks:** all 01A checks + Lighthouse (performance/a11y), reduced-motion E2E, real screenshots desktop/tablet/mobile for visual review.

---

## Pending assets — dependencies

| Asset | Blocks | Needed from Or7 | Fallback if late |
| --- | --- | --- | --- |
| **1. Clash Display** | A1 final type scale; B1 hero headline; every display heading; visual QA of 01A/01B | Font files (woff2 preferred, weights used: likely 500/600) **and** a license decision: self-host in the public repo, or load from the Fontshare CDN. The ITF Free Font License text must be checked for redistribution in a public repository. | Build A3–A6 with Inter; A1 and B1 cannot be signed off |
| **2. Final logo** | A2, A4 navbar, favicon/icons, social meta; 01A sign-off | Confirmed final file, ideally SVG (or transparent PNG ≥ 2×), **plus the separate compact symbol**. `logo-04-reference.png` is RGB with a baked "4" badge and cannot ship. | Text wordmark placeholder (current shell); no redrawing |
| **3. Art-only cards** | A7, A8, B5 | Three transparent PNGs (Ethereal violet, Instinctive cyan, Radiant warm gold), same framing as the approved refs, **without** baked number/title/phrase/"Tap to discover" button. Confirm whether the number (01/02/03) stays in the art or moves to the DOM. Also the "Tap to discover" sparkle icon as SVG if it must match exactly. | A7 can be built against the frame structure only; no fake button over baked art |

## Open decisions (do not assume)
- **Q1** Clash Display delivery: self-host vs Fontshare CDN.
- **Q2** Exact surfaces for React Bits Stepper and Border Glow (direction says "assigned surfaces" without listing them). Holo Card belongs to results (Phase 05).
- **Q3** Liquid Flow target: Preparation is Phase 02. Proposal: build the transition in 01B toward a minimal placeholder route, or defer it to Phase 02.
- **Q4** Who approves pt-BR/es landing copy, and the Interactive Discovery reveal phrases in all three languages.

## Verifications before use (per CLAUDE.md)
- React Bits: confirm each named component (Ghost Fibers, Gradient Text, Star Border, Stepper, Border Glow, Holo Card, Liquid Flow) exists in the official catalog, record its license, and copy the **original** code unmodified apart from typing/props.
- Floating Liquid Nav and Floating Top Bar: confirm whether they are React Bits components or custom builds.
- Motion version compatible with React 19.

## Skills (selective)
- **frontend-design** + **Impeccable**: building and refining A4–A7 and B1–B5.
- **UI UX Pro Max (design-system)**: once, for A3 token refinement.
- **Web Design Guidelines**: audits at the end of 01A and 01B.
- **Humanizer**: B8 copy only.
- Not installed: Taste Skill (its principles are applied editorially).

## Not in Phase 01
Quiz, preparation screen content, question bank, catalog, engine, results, Share Studio, hosting/deploy, rejected landscape video pack, any light-mode switch, any unlisted animation.
