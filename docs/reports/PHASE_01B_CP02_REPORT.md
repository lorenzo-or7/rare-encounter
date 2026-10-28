# Phase 01B — Checkpoint 02 report (sections, Stepper, cards, copy, finish)

Branch `phase/01-visual-identity`. Not merged, not pushed. **Stopped for Or7 review.**

## A. Summary
**Delivered** (hero, nav, Ghost Fibers, Gradient Text and Star Border from checkpoint 01 untouched)
- **Beyond the Obvious:** asymmetric editorial spread. A quiet title, a large display statement (strength, rarity and fame play no part), then three principles in a hairline-divided reading row. No cards, no numbering.
- **How Discovery Works:** a full-bleed band one tone lighter, with the title on the left and the **original React Bits Stepper** on the right.
  - Exactly **3 steps:** Discover Yourself, Find Your Connection, Reveal Your Encounter.
  - The step indicators are the navigation. The footer is off so no Back/Continue/Complete control pretends to do more than it does.
- **Every Connection Is Different:** centered intro, then the three **Floating Archetype Cards** on a staggered line (middle card highest).
  - The slow CSS float pauses on hover and focus, and is off under reduced motion.
  - Interactive Discovery from 01A is unchanged: tilt and glow with a mouse, phrase reveal on tap, no modal.
  - Number, title, phrase and button are real HTML.
- **Begin Your Journey:** a centered closing bookend.
  - The three depths (30 / 60 / 90 with their approved names) appear as information. They are not selectable, because selection belongs to the Preparation Screen in Phase 02.
  - The Star Border start control is wired to the Liquid Flow transition.
- **Liquid Flow infrastructure (D6, Motion + CSS, no new library):** in `src/features/encounter-transition/`:
  - a React-independent state machine (`idle → covering → covered → idle`) that refuses unregistered destinations;
  - a provider with `register / canBegin / begin`;
  - a clip-path layer that grows from the control (crossfade under reduced motion).
  - Phase 02's Preparation Screen registers `preparation`. **Until then the closing control is disabled** and described by "The encounter opens soon." (D7: no falsely functional buttons). The hero CTA still scrolls to this section.
- **Card title serif (D3), for approval: DM Serif Display.**
  - **License:** SIL Open Font License 1.1, via `@fontsource/dm-serif-display`. Free to self-host and redistribute in this public repo.
  - **Why this face:** a high-contrast editorial display serif close to the lettering on the approved cards. Used for card numerals and titles only.
- **Copy:** all four sections in en, pt-BR and es.
  - The English source went through a Humanizer pass: the repeated "popularity/rarity" point and a contrast tell were removed.
  - pt-BR and es headings now use sentence case, which those languages prefer.
  - Product terms Soul / Hidden / Alternative Match are kept in English in all locales.
  - Everything awaits Or7 editorial review.

**Assets: verified, not used.**
- **No art-only card files exist.** The three card PNGs in Downloads are byte-identical to the approved ones (text baked in), and both kit zips contain only the original references.
- `design-references/rare-encounter-visual-reference.png` is a mockup sheet. It lists "card-0X (arte limpa)" and logo SVG files that were never delivered, and its clean cards use **different frames and ornaments** from the approved art.
- Using those designs would replace approved art, so the cards keep the explicit "Art-only version pending" state. `ARCHETYPES[].art` is the single switch once real files arrive.
- **Note:** that reference sheet entered Git in commit `9888903` (01A, already on `main`) because it was in the folder when I staged. It contains no Pokémon imagery. Confirm it should stay public.

## B. Technical verification
| Check | Result |
| --- | --- |
| typecheck (incl. vendor project) | ✅ |
| lint | ✅ |
| Vitest | ✅ 45/45 (+4 transition state machine) |
| Playwright (desktop, tablet, mobile) | ✅ 43 passed, 2 skipped (desktop-only nav test) in the final runs |
| Safety scan | ✅ |
| Vendor integrity (8 files incl. Stepper) | ✅ |
| Build | ✅ main 135.5 kB gzip (+11 kB: Stepper, Hugeicons, serif CSS); GhostFibers 9.5 kB lazy |
| Impeccable detector | ✅ 0 findings |

**New E2E:**
- The five sections render in order with no overflow.
- Beyond: the statement and its three principles.
- Stepper: exactly 3 steps, navigation to steps 2 and 3.
- Cards: 3 articles, DM Serif Display loaded and applied, Radiant reveals its phrase.
- Begin: control disabled with an accessible description, no Liquid Flow layer.
- Reduced motion: no float.
- pt-BR rendering.

**Honest notes:**
- **Flaky capture:** one full-suite run failed a single capture with `Page.captureScreenshot: Unable to capture screenshot`, an intermittent failure in software-rendered headless Chromium. The re-runs passed completely.
- **Stepper labels:** the original Stepper builds its indicator `aria-label` as the English `"Step N: <title>"`. Titles are localized, but the word "Step" is not, and it cannot be changed without modifying the original. Options: accept it, or use its `renderStepIndicator` prop (which replaces the original indicator visuals).
- **Stepper on phones:** it hides step titles in its indicator when space is tight (original behaviour). The step content still shows the title as a heading.
- **Fixes during verification:**
  - Cards drifting under the pointer were hard to click (E2E and real users), so the float now pauses on hover and focus.
  - On tablet the raised middle card touched the intro.
  - The pending label overflowed narrow cards.
  - The Beyond statement was oversized (6 lines; now 5).
  - Closing numerals had gradient text, which the direction reserves for `your Pokémon`; they are now solid.

**New dependencies (authorized):** `@hugeicons/react` 1.1.10 and `@hugeicons/core-free-icons` 4.3.5 (MIT, D5), `@fontsource/dm-serif-display` 5.x (OFL, D3).

**Evidence** (`docs/reports/phase-01b-cp02/`, 14 real captures):
- **Desktop:** beyond, discovery step 1 and step 3, connection, connection revealed, begin, full page.
- **Tablet:** beyond, connection, begin.
- **Mobile:** beyond, discovery step 3, connection revealed, begin.

## Decisions for Or7
1. Approve **DM Serif Display** for card titles.
2. Closing control: keep it **disabled with a note** until Phase 02 (current), or another honest behaviour you prefer.
3. Stepper `aria-label` "Step N" in English: accept, or use `renderStepIndicator`.
4. Supply real **art-only card files** matching the approved art, or confirm the reference sheet's redesigned frames are now the approved art.
5. Keep or remove `design-references/rare-encounter-visual-reference.png` from the public repo.
6. **Final logo:** a `Glossy RARE Encounter Logo.png` exists in Downloads but was not delivered to the project. It was not used (D1).
