# Phase 02, Checkpoint 01: Entry and Preparation Screen

Branch `phase/02-quiz-experience`. Not merged, not pushed. **Stopped for Or7 visual review.**
Scope as authorized: `/encounter`, Liquid Flow landing → Preparation, the Preparation Screen (30/60/90, approved names, Border Glow original, external focus/selection/reduced-motion states, Select & Confirm with no preselection), responsiveness and full en/pt-BR/es. Checkpoint 02 was not started.

## What was built
- **Route `/encounter`** on the History API (`src/app/routing.ts`), with no router dependency.
  - The encounter screen is a lazy chunk, so the landing doesn't carry its code. The landing prefetches the chunk when the browser is idle.
  - Browser Back and Forward work; reloading or deep-linking `/encounter` works.
  - The brand link returns to the landing.
- **Liquid Flow live.**
  - `PreparationDestination` registers the `preparation` destination while the landing is shown. That enables the closing CTA, which had been `aria-disabled` until now.
  - When the liquid covers the page, the route switches to `/encounter` underneath it and the layer fades away.
  - Arriving focuses the screen title, resets the scroll and sets the document title.
  - The approved 01B provider, reducer and layer are unchanged.
- **Preparation Screen** (`src/features/preparation/`).
  - Three depths: **A Glimpse (30) · The Journey (60) · Deep Connection (90)**, with the localized names already approved on the landing.
  - Each card shows its numeral, name, question count, and the real core/adaptive mix from `MODES` (e.g. "21 core questions and 9 that adapt to your answers").
  - Side by side from 900 px; stacked below.
- **Border Glow:** the original, unmodified, inside a wrapper that handles what it doesn't:
  - **Selection:** native radios (`role=radiogroup` labelled by the title and described by the lead). Shown by an accent border, a tinted surface, an accent numeral and a **check mark**, so it doesn't rely on color alone.
  - **Focus:** a ring around the whole card (`:has(:focus-visible)`).
  - **Reduced motion:** a capture-phase listener stops pointer movement before it reaches the glow, which stays dark. Selection and focus remain.
  - **Overflow:** the glow's outer light extends 32 px past the card; the screen clips it horizontally so narrow phones don't scroll sideways.
- **Select & Confirm.**
  - No depth is preselected. Focus alone selects nothing.
  - "Confirm depth" stays `aria-disabled` (focusable, described by "Choose a depth to continue.") until a choice.
  - Confirming locks the three cards, announces "The Journey: confirmed, 60 questions." and states plainly: "Not available yet. Your questions will start here once they open."
  - **No session is created and nothing is stored.** The test checks that no IndexedDB database exists.
  - "Choose another depth" unlocks the choice, since nothing has started.
- **Chrome:** `SiteLayout`/`SiteNav` accept an optional `brandHref`. With no sections they show only the brand and settings, and the mobile sheet becomes "Settings". The landing renders exactly as before.

## Files
- **New:**
  - `src/app/routing.ts`
  - `src/pages/encounter/{EncounterPage.tsx, load.ts}`
  - `src/features/preparation/{PreparationDestination.tsx, PreparationScreen.tsx, PreparationScreen.css, ModeOption.tsx, glow-color.ts, glow-color.test.ts}`
  - `src/vendor/react-bits/BorderGlow/{BorderGlow.tsx, BorderGlow.css}` (registry originals)
  - `e2e/preparation.spec.ts`
  - this report and `phase-02-cp01/`
- **Changed:**
  - `src/app/App.tsx` (routes)
  - `src/components/nav/SiteNav.tsx` and `src/components/layout/SiteLayout.tsx` (optional brand link, section-less mode)
  - `src/components/button/Button.tsx` (accepts `ref`)
  - `src/i18n/messages/{en,pt-BR,es}.ts` (9 keys each)
  - `src/vendor/react-bits/{manifest.json, README.md}`
  - `e2e/landing.spec.ts` and `e2e/sections.spec.ts` (the closing CTA is now live)
  - `docs/EXECUTION_LOG.md`

## Verification
| Check | Result |
| --- | --- |
| typecheck / lint | ✅ / ✅ |
| Vitest | ✅ 50/50 (+2: theme hex → Border Glow HSL) |
| Playwright, 3 viewports | ✅ 76 passed, 14 skipped (viewport-specific). In the first full run, one landing nav test failed with `ERR_CONNECTION_REFUSED` (the preview server dropped); rerun alone it passed. |
| Safety scan | ✅ |
| Vendor integrity | ✅ 10 originals (BorderGlow added) |
| Build | ✅ landing JS 137.6 kB gzip (+1.0 kB: routing, destination, prefetch); encounter chunk 3.1 kB JS + 2.4 kB CSS gzip, loaded on demand |
| Impeccable detector | ✅ 0 findings (regex scan only; contrast/size covered by visual review) |

**E2E coverage for this checkpoint:**
- CTA → Liquid Flow → `/encounter`, with focus, scroll, title, Back/Forward and the brand link;
- three depths, none checked, confirm gated and described;
- keyboard: Tab, arrows, focus ring;
- pointer select, confirm, lock, announce, nothing stored, choose again;
- the original glow follows the pointer near an edge (desktop);
- touch tap;
- reduced motion: fade-only transition, glow stays dark;
- 320/360/375 px: no overflow, no text outside its card;
- the mobile top bar opens Settings only;
- pt-BR and es fully translated, `lang` set.

**Evidence** (`docs/reports/phase-02-cp01/`, 27 captures):
- transition frames (desktop flow-1/2/3/5; mobile and tablet arrival);
- idle on 3 viewports;
- focus and keyboard selection;
- glow on hover;
- selected and confirmed on 3 viewports;
- reduced motion;
- 320/360/375 px;
- confirmed in pt-BR and es;
- the live closing CTA.

## Limits and notes
- **Liquid Flow visibility:** the layer is the page background itself, so the growing edge is subtle on the dark landing (frame `desktop-flow-2`). It reads as the page dissolving from the CTA. A visible rim would be a new visual element; it is listed under E12 and not added.
- **Floating Archetype Cards on narrow phones:** they were in the CP1 plan but are **not** in the authorized list, so they were not changed. They are waiting for your go-ahead, under the rule already set: minimal and legibility-only.
- **Provisional choices, not presumed approved:**
  - the confirm control's style (E5);
  - the tablet breakpoint (E10);
  - leaving out a duration estimate (E13).
  
  These are the options below. Each is easy to swap.

## Decisions for individual approval
| # | Question | Options | Recommendation |
| --- | --- | --- | --- |
| **E5** | Confirm control style | **A.** Primary `Button`, label "Confirm depth" (built now)<br>**B.** StarBorder, like the hero and closing CTAs<br>**C.** Primary `Button` with the depth in the label ("Confirm The Journey") | **A.** StarBorder stays the signature of the two landing CTAs; repeating it dilutes it. In CP2, when confirming actually starts the questions, the label becomes "Begin" with the depth name. |
| **E8** | Chrome during the questions | **A.** Focused header: symbol (to the landing), continuous progress, Pause, Settings<br>**B.** The current encounter chrome (brand + settings) with progress inside the content<br>**C.** No chrome; Pause and progress inside the question view | **A.** Progress and Pause stay in one fixed, predictable place on every viewport, and the brand remains a way out (through Pause, so nothing is lost). |
| **E10** | Preparation on tablet | **A.** Row from 900 px (iPad landscape), stacked in portrait (built now)<br>**B.** Row from 768 px (iPad portrait too)<br>**C.** Two plus one grid | **A.** At 768 px three columns leave about 180 px of text width, so "Deep Connection" and "Conexão Profunda" break awkwardly; C is unbalanced. |
| **E12** | Timings | Liquid Flow now: cover 0.9 s from the CTA + fade 0.9 s (about 1.8 s total); reduced motion 0.2 s fade.<br>**A.** Keep as built<br>**B.** Cover 0.7 s + fade 0.5 s (about 1.2 s)<br>**C.** B plus a thin accent rim on the liquid edge (new visual)<br>For CP2: answer feedback 300 ms (inside the approved 250–350 ms), question slide about 0.35 s spring, reduced motion crossfade 0.15 s | **B** for the transition, since 1.8 s is long for a step people repeat when they return. C only if you want the flow to read more clearly as liquid. CP2 values as listed, to be confirmed on real captures there. |
| **E13** | Duration estimate on the depth cards | **A.** None; question count and mix only (built now)<br>**B.** Add an estimate after timing is measured with the real bank (Phase 04/06)<br>**C.** Add an estimate now ("about 5 / 10 / 15 min") | **A now, B later.** An estimate before real questions exist would be an unverified claim. |
