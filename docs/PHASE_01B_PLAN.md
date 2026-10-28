# PHASE 01B — Landing & Motion Experience · Plan

Status: **PLANNED, NOT AUTHORIZED.** Branch `phase/01-visual-identity` (from `main` @ `aad7b85`).
Sources: `VISUAL_DIRECTION.md` (approved landing), `PHASE_01_PLAN.md`, the Q1–Q4 resolutions, and 01A as built. This plan adds no visual decisions. Anything not pinned by the direction is listed under **Decisions needed**.

## Verified before planning (2026-10-28)
| Item | Finding |
| --- | --- |
| React Bits registry (`reactbits.dev/r/*-TS-CSS.json`) | **Found:** GhostFibers, GradientText, StarBorder, Stepper (plus BorderGlow and HoloCard, reserved for Phases 02 and 05). **Not found:** `LiquidFlow`. The registry has no component by that name. |
| GhostFibers | WebGL + rAF, about 42 kB of source, no npm deps. Has reduced-motion and IntersectionObserver handling built in. Colors are configurable through props. |
| GradientText | CSS + rAF, no deps. Reduced-motion aware. |
| StarBorder | CSS + rAF, no deps. Reduced-motion aware. |
| Stepper | **Requires `@hugeicons/react` and `@hugeicons/core-free-icons`.** Reduced-motion aware. |
| License | MIT + Commons Clause. Allowed: use and modify as part of a website. Forbidden: selling or redistributing the components on their own. The copyright notice must be kept. |

## Workstreams

| # | Work | Acceptance | Depends on |
| --- | --- | --- | --- |
| B0 | **Vendor original React Bits** into `src/vendor/react-bits/` (TS-CSS variants), unmodified except type fixes needed to pass strict TS and lint, each with its header. Add `THIRD_PARTY_NOTICES.md` (React Bits license). | A diff against the registry shows only documented changes | D5 |
| B1 | **Landing route and shell.** The landing replaces the foundation page as `/`. The Liquid Nav and Top Bar list the five sections. Settings stay unchanged. | Nav tracks the active section on all three viewports | D8 |
| B2 | **Editorial Split hero.** Left: oversized Clash Display headline, exact English source `Somewhere out there, there's your Pokémon.` Right: Ghost Fibers. Desktop is a two-column split; tablet and mobile stack the headline first with the fibers as a backdrop band. | Headline text exact in `en`; one `h1`; no clipping at any width | — |
| B3 | **Gradient Text only on `your Pokémon`.** i18n splits the headline into `before / highlight / after` keys so each locale wraps its equivalent phrase. Colors come from the active theme's tokens. | Exactly one gradient span; contrast ≥ 3:1 at every gradient stop on the background | D4 (pt/es copy) |
| B4 | **Ghost Fibers, themed.** Colors are read from `--accent`/`--accent-2` and update on theme change. Lazy-loaded after first paint, DPR capped, lighter settings on coarse pointers, paused offscreen. Canvas is `aria-hidden`. | No layout shift from the canvas; FPS acceptable on mid hardware; static frame under reduced motion | — |
| B5 | **Star Border primary CTA** in the hero (and the closing section). The original StarBorder wraps the 01A primary Button. | Real `<button>`/`<a>`, keyboard focus visible, star motion stops under reduced motion | D7 |
| B6 | **Cinematic staged entry.** One orchestrated sequence on load: fibers fade in, then the headline reveals line by line, then the gradient phrase settles, then the support line, then the CTA with its star starting. Motion for React. Timings are proposed for Or7 review, not assumed final. | Plays once; does not block reading; reduced motion shows the final state immediately | — |
| B7 | **Five sections:** The Encounter · Beyond the Obvious · How Discovery Works · Every Connection Is Different · Begin Your Journey. Editorial layouts with no card-grid scaffolding and no extra animations beyond the direction. | Real localized copy; semantic headings; anchors | D4, D9 |
| B8 | **Stepper in How Discovery Works** (original React Bits). Steps reflect the approved flow: choose 30/60/90 → answer one question at a time → species-wide comparison → Soul/Hidden/Alternative result. | Keyboard operable; content localized | D5, D9 |
| B9 | **Floating Archetype Cards with Interactive Discovery,** reusing the 01A `ArchetypeCard` unchanged in behavior (tilt/glow on hover, phrase reveal on tap, no modal). Gentle float only if motion is allowed. Desktop row, mobile stack. | Behaves as 01A; art slot ready | **D2**, D3 |
| B10 | **Liquid Flow transition, architecture only.** A `useEncounterTransition()` hook plus a `<TransitionLayer>` that the CTA calls. In 01B it runs only in tests/storybook-free unit harness, and the CTA keeps a safe fallback. Phase 02 registers the Preparation Screen as the target. No provisional page. | Hook unit-tested; reduced-motion path = instant; no new route | D6, D7 |
| B11 | **Responsiveness and accessibility pass:** 360–1920 px, tablet portrait/landscape, reduced motion, keyboard path, landmarks, contrast on gradients and over fibers, `prefers-reduced-transparency` respected where blur is used. | 0 horizontal overflow; WCAG AA; Web Design Guidelines audit clean | — |
| B12 | **Performance:** `LazyMotion` evaluation (01A carried item), fibers lazy chunk, Clash Display `preload` when the file exists, image-free LCP (headline). | Budgets: LCP < 2.5 s and CLS < 0.05 on a throttled run; initial JS reported | — |

## Sequencing (two internal review checkpoints, then the 01B gate)
1. **B-I Hero:** B0, B1, B2, B3, B4, B5, B6. Screenshots and a short screen capture of the entry for Or7.
2. **B-II Sections:** B7, B8, B9, B10.
3. **B-III Hardening:** B11, B12, final report, STOP.

Checkpoints B-I and B-II are optional pauses. Or7 can choose to review only at the end.

## Tests and evidence
- **Vitest:** headline i18n parts (exact `en` string reassembled, gradient on the highlight only), section/anchor registry, transition hook states (idle → running → done, reduced-motion instant), theme → fiber color mapping.
- **Playwright** (desktop / tablet / mobile + one `reducedMotion: 'reduce'` project): exact headline, single gradient span, CTA focus and activation, sections in order, Stepper keyboard flow, card reveal, no overflow, nav active state, screenshots per section.
- **Audits:** Web Design Guidelines skill; Lighthouse (performance/a11y) via `npx lighthouse` *(downloads a CLI package; ask before first use)*; Impeccable detector.

## Skills (selective)
- **Frontend Design and Impeccable** (`animate`, `polish`): hero composition, entry sequence, section layouts.
- **Humanizer:** the landing copy in all three locales.
- **Web Design Guidelines:** the B11 audit.
- **UI UX Pro Max:** not needed unless tokens change.

---

## Visual dependencies still open
| # | Dependency | Blocks | Status |
| --- | --- | --- | --- |
| **D1** | Final logo file + compact symbol | Final nav/hero brand presence; visual sign-off of 01B | Pending. Text placeholder; never redrawn |
| **D2** | Art-only archetype cards (3) + whether the 01/02/03 numbers stay in the art | Visual sign-off of "Every Connection Is Different" (B9) | Pending. Cards keep the explicit pending state |
| **D3** | Card title typeface (art uses a serif; DOM uses Clash Display) | B9 final look | Open from 01A |
| **D4** | Landing copy: support line, five section texts, CTA labels, Stepper step texts; pt-BR/es including the headline's translated highlight phrase | B3, B7, B8 | I draft the `en` source plus pt/es; Or7 gives editorial approval (Q4) |
| **D5** | Stepper's `@hugeicons/*` dependencies: install them (keeps the original intact) or swap in the 01A icon set (modifies the original) | B0, B8 | **Decision needed.** Recommendation: install, to preserve the original |
| **D6** | "Liquid Flow" has no React Bits component of that name. Its origin and look must be defined: custom Motion/SVG transition, or a specific source Or7 has in mind | B10 visuals | **Decision needed.** B10 builds only the transition architecture until then |
| **D7** | CTA behavior in 01B while Preparation does not exist: scroll to "Begin Your Journey", or stay visually present but announce "coming soon" | B5, B10 | **Decision needed.** Recommendation: scroll to the closing section |
| **D8** | The 01A foundation page after the landing takes `/`: remove it, or keep it as a dev-only view excluded from production | B1 | **Decision needed.** Recommendation: dev-only |
| **D9** | Section content mapping: confirm cards live in "Every Connection Is Different" and the Stepper's 4 steps as listed in B8 | B7–B9 | Confirm |
| **D10** | Clash Display in deployment (`npm run fonts:setup` in CI/hosting) | Production only | Deferred to hosting decision |

## Not in 01B
Preparation Screen, Border Glow (Phase 02), Holo Card (Phase 05), quiz, engine, catalog, results, Share Studio, hosting/deploy, the rejected landscape video pack, a light-mode switch, any animation not listed in the visual direction.
