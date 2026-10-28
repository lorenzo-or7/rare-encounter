# PHASE 02 — Quiz Experience · Plan

Status: **PLANNED, NOT AUTHORIZED.** Branch `phase/02-quiz-experience` (from `main` @ `c46fc67`, Phase 01B merged).
Sources: `APPROVED_BLUEPRINT.md` (UX and persistence), `VISUAL_DIRECTION.md` (Preparation, Quiz), `ARCHITECTURE.md`, and Phase 01 as built. This plan adds no visual decisions. Anything the direction leaves open is listed under **Decisions needed**.

## Verified before planning (2026-10-28)
| Item | Finding |
| --- | --- |
| `main` after the 01B merge | typecheck, lint, Vitest 48/48, Playwright 47 passed / 4 skipped (desktop-only), safety, vendor integrity (8 files), build: all pass |
| React Bits **BorderGlow** (`reactbits.dev/r/BorderGlow-TS-CSS.json`) | `BorderGlow.tsx` + `BorderGlow.css`, **no npm dependencies**. Props: `children`, `className`, `edgeSensitivity`, `glowColor`, `backgroundColor`, `borderRadius`, `glowRadius`, `glowIntensity`, `coneSpread`, `animated`, `colors`, `fillOpacity`. |
| BorderGlow behavior | Glow follows the **pointer only** (`onPointerMove`); `animated` runs an rAF sweep. It does **not** handle `prefers-reduced-motion`, keyboard focus or selection. |
| Already in place | `MODES` (quotas, 30/60/90), `Question` (`text` · `photo` · `icon-text`), `QuizSession` (`questionIds`, `answers`, `cursor`, `status` incl. `paused`), IndexedDB store (`recordAnswer` atomic, `deleteSession`, migrations returning `needs-restart` without erasing), localStorage preferences, Liquid Flow state machine with the `preparation` destination id reserved, `Sheet` (native `<dialog>`), `Button`, `Icon` (Hugeicons), Motion with `MotionConfig reducedMotion="user"`. |
| Not available yet | **Question bank** (Phase 04), **adaptive engine** (Phase 04), **result** (Phase 05). Phase 02 must run on a sample bank and must not fabricate a result. |

## Architecture preserved and extended
- **Domain stays React-independent.**
  - New `domain/question-source.ts` contract: `QuestionSource.start(mode)` returns the first question ids, `next(session)` returns the next id or `done`, and `reconcile(session)` returns the ids still valid after an edit.
  - Phase 02 ships a `SampleQuestionSource`. Phase 04 swaps in the real engine behind the same contract.
- **New `features/quiz/flow.ts` reducer,** pure and unit-tested.
  - States: `loading` → `recovering` | `preparing` → `question` ⇄ `saving` → `question` | `save-error`, plus `paused`, `answered-all` and `needs-restart`.
  - React components only render the state and dispatch events.
- **Storage** keeps IndexedDB as the source of truth. Planned changes:
  - an atomic `editAnswer` (overwrite plus question-list reconcile in one transaction);
  - `setStatus`;
  - optimistic concurrency on `updatedAt`, so two tabs can't silently overwrite each other.
  - If the session shape changes, `SESSION_SCHEMA_VERSION` goes 1 → 2 with a tested migration. Nothing is deleted silently.
- **Liquid Flow:** the existing provider and reducer are used unchanged. Preparation registers `PREPARATION`, which makes the closing CTA's `aria-disabled` go away on its own.
- **Vendor rule:** BorderGlow is copied unmodified into `src/vendor/react-bits/BorderGlow/`, with its hash in `manifest.json` and an entry in `THIRD_PARTY_NOTICES.md`. Reduced motion, focus and selection are handled by **our wrapper**, never by editing the original.

## Workstreams

| # | Work | Acceptance | Depends on |
| --- | --- | --- | --- |
| Q0 | **Screens and URL.** Landing `/` and an `/encounter` screen (Preparation and Quiz) on the History API. No router dependency. Browser Back follows E4. Refreshing `/encounter` goes through recovery. | Deep link, refresh and Back behave as E4; no 404 in dev or preview | E4 |
| Q1 | **Liquid Flow live,** landing → Preparation. Covers from the CTA origin, mounts Preparation at `covered`, drains away. Focus moves to the Preparation heading and scroll resets. Reduced motion: an instant swap. Timings are proposed for review. | One transition per activation; no double start; no flash of landing; focus correct | — |
| Q2 | **Preparation Screen.** Three cards: 30 *A Glimpse*, 60 *The Journey*, 90 *Deep Connection*.<br>Layout: a row on desktop, stacked on mobile; tablet follows E10.<br>Interaction: original Border Glow inside a `role="radiogroup"` wrapper with arrow-key selection. **No default selection.**<br>Confirm: a distinct confirm CTA that stays `aria-disabled` with a message until a card is chosen. Confirming creates the session; the mode can't be changed afterward. | Keyboard, touch and pointer can all select. Selected state is visible without the glow (border, check, `aria-checked`). Glow sweep is off under reduced motion and on coarse pointers. | E1, E5, E10 |
| Q3 | **Question interface.** One question per view, three formats:<br>• **text:** a list of options;<br>• **photo:** an image grid with required `alt` and a visible label;<br>• **icon + text:** a Hugeicons icon with a label.<br>Each option is a `button` with `aria-pressed` inside a labelled group. Prompt in Clash Display, options in Inter. 2–6 options supported. | No layout jump between formats; tap targets ≥ 44 px; long pt-BR/es labels wrap without clipping | E1, E3 |
| Q4 | **Horizontal Flow + auto-advance.** Direction-aware slide: forward enters from the inline end, back from the start, with RTL-safe logical direction. Advance happens only when **both** are true: the feedback minimum (proposed 300 ms, within the approved 250–350 ms) has elapsed, and `recordAnswer` has **committed**. If the save fails, the view stays put with an inline error and Retry. Input is locked while saving, so a double tap can't record twice. | A save is always durable before advancing (Playwright reload test). Reduced motion: crossfade or instant. A live region announces "Question N of M". | — |
| Q5 | **Energy Pulse + Spring Press.** On press, a spring scale-down and return. On select, a single accent pulse from the press point (or the center for keyboard). Motion for React for the press, CSS for the pulse. | One pulse per selection; reduced motion: no scale or pulse, selection shown by color and check only | — |
| Q6 | **Continuous progress bar.** One bar, not segmented: `answered / mode length`, which is always known because the adaptive picks fill a fixed total. Spring width change and `role="progressbar"` with values. A numeric counter sits beside it. | Correct after back/edit and after recovery; no jump on reload | — |
| Q7 | **Back and edit.** Back steps to the previous question with its saved answer shown. A different answer overwrites through `editAnswer` and advances. When the answer is unchanged, a visible Continue control advances. Adaptive invalidation follows E7 and is tested against a fake adaptive source. | Answer ids are unchanged by a locale switch; edits are durable; quotas are never broken | E7 |
| Q8 | **Pause modal, save and recovery.**<br>Pause (reusing `Sheet`): Continue; **Save and leave**, which sets `paused`, shows when it was saved and returns to the landing; **Start over**, a two-step confirmation that calls `deleteSession` and returns to Preparation.<br>Recovery on entry: resume at the saved cursor. `needs-restart` shows an assisted-restart screen that explains why and never deletes without confirmation. A bank or question id that no longer exists counts as `needs-restart`. | Esc = Continue; focus returns to Pause; every exit path leaves stored data consistent | E6 |
| Q9 | **Hybrid persistence.**<br>• IndexedDB: session, question order, answers, cursor.<br>• localStorage: preferences (existing) plus a small `rare-encounter:active-session` pointer (`{schemaVersion, sessionId, mode, answered, total, updatedAt}`), written **after** the IndexedDB commit, for fast resume hints and to detect a missing record.<br>• Unavailable IndexedDB follows E9.<br>• Quota and blocked-storage errors get honest messages. | Unit tests with fake-indexeddb cover commit order, pointer mismatch, quota error, a stale tab, and the v1 → v2 migration if any | E9 |
| Q10 | **End of the sample run.** After the last answer, an "answers saved" screen states plainly that results open in a later phase. **No fake result** and no `completeSession` call (it requires a real result). The session stays recoverable. | Copy reviewed by Or7; nothing claims a match | E2 |
| Q11 | **Floating Archetype Cards on narrow phones** (Phase 01B observation). Revealed-state layout only, through container queries. Art, idle state and desktop/tablet are unchanged. | At 320, 360 and 375 px: title, phrase and Hide fit with no clipping; phrase ≥ 0.875 rem; Hide ≥ 44 px; AA contrast; before/after captures | E11 |
| Q12 | **Responsive, a11y, reduced motion, performance.**<br>• 320–1920 px, tablet portrait and landscape;<br>• keyboard path through the whole quiz;<br>• focus management on every step change;<br>• `lang` follows the locale and switching mid-quiz keeps the answers;<br>• reduced-motion and reduced-transparency paths;<br>• lazy chunk for `/encounter`;<br>• sample images sized and lazy-loaded. | 0 horizontal overflow; WCAG AA; Web Design Guidelines audit clean; landing JS does not grow by the quiz code | — |

## Checkpoints (each stops for Or7 approval)
| CP | Scope | Evidence | Approval criteria |
| --- | --- | --- | --- |
| **CP1: Entry** | Q0, Q1, Q2, Q11, BorderGlow vendoring | Captures of Preparation (3 viewports, idle/hover/selected/focus, reduced motion), a frame sequence of Liquid Flow, before/after card captures at 320/360/375 | Transition reads as Liquid Flow and doesn't block; no default mode; the confirm CTA is distinct and honest; BorderGlow unmodified (`check:vendor`); cards legible on narrow phones |
| **CP2: Questions** | Q3, Q4, Q5, Q6 on the sample bank | Captures of each format × 3 viewports, a frame sequence of select → pulse → advance, the reduced-motion version | Advance only after a committed save (reload test); feedback stays within 250–350 ms; formats consistent; progress exact |
| **CP3: Control and persistence** | Q7, Q8, Q9, Q10 | Captures of the pause modal, start-over confirmation, recovery, assisted restart and end screen; storage test matrix | Nothing lost or silently deleted in any path; edits respect E7; locale switch keeps answer ids; two tabs can't clobber each other |
| **CP4: Hardening and gate** | Q12, final copy pass (Humanizer), audits, report | Full suite, audit results, final hybrid report | All checks green, documented limitations, then STOP for the Phase 02 gate |

## Tests and evidence
- **Vitest:**
  - flow reducer (every transition, including save-error and needs-restart);
  - `SampleQuestionSource` (mode length, category quotas, fundamental/adaptive mix, no repeats);
  - `editAnswer` and reconcile with a fake adaptive source;
  - store concurrency, pointer ordering and migrations;
  - Preparation radiogroup keyboard behavior;
  - locale switch keeps answer ids;
  - i18n parity for the new keys.
- **Playwright** (desktop, tablet, mobile, plus reduced motion):
  - CTA → Liquid Flow → Preparation;
  - no default selection and confirm gating;
  - each format;
  - reload after each answer resumes at the right question with progress intact;
  - back/edit, pause/save/leave/resume, start-over confirmation;
  - IndexedDB blocked (E9 path);
  - no horizontal overflow;
  - captures per checkpoint.
- **Audits:** Web Design Guidelines skill, Impeccable detector, `check:vendor`, `check:safety`, and the build size compared with `main`.
- Motion evidence is **frame sequences (PNG)**. No video is committed, so the safety scan keeps blocking video.

## Skills (selective)
- **Frontend Design and Impeccable:** Preparation and the question interface (CP1–CP2), `animate` for Pulse/Press and Horizontal Flow.
- **Web Design Guidelines:** the CP4 audit.
- **Humanizer:** quiz and Preparation copy in all three locales.
- **UI UX Pro Max:** not needed unless tokens change.

## Dependencies
- **npm:** none new. BorderGlow has no dependencies; Motion, Hugeicons, fake-indexeddb and Playwright are already installed.
- **Vendor:** BorderGlow original (MIT + Commons Clause, already covered by the notice) → manifest, notices, `check:vendor`.
- **Content:** Preparation and quiz UI copy (en source; pt-BR/es drafted, editorially reviewed by Or7); the sample bank per E1.
- **Images:** sample photo-question images per E3.
- **Hosting (deferred):** an SPA rewrite for `/encounter` when hosting is chosen.

## Decisions needed
| # | Decision | Blocks | Recommendation |
| --- | --- | --- | --- |
| **E1** | **Sample bank** while Phase 04 doesn't exist | Q2–Q10 | A small hand-written set (about 4 per format) plus numbered fillers that respect the real quotas and lengths, all marked as sample. The quiz shows a visible "Preview: sample questions" notice. |
| **E2** | **End of the sample run** without a result | Q10 | An honest "answers saved, results open later" screen. No fake result and no `completeSession`. |
| **E3** | **Photo-question images** (the manifest says to create them only when the bank needs them) | Q3 | Or7 supplies 4–8 sample images, or neutral abstract placeholders are marked as sample. No Pokémon imagery. |
| **E4** | **URL and browser Back** | Q0, Q8 | `/encounter` with history state. Browser Back during the quiz opens Pause, so nobody leaves by accident. |
| **E5** | **Confirm CTA style** on Preparation ("distinct CTA") | Q2 | The existing primary `Button` with the mode name in the label ("Begin The Journey"). StarBorder stays reserved for the hero and closing. |
| **E6** | **Returning-user context banner** (blueprint): on the landing too, or only on entering `/encounter` | Q8 | Phase 02 resumes on entering `/encounter`. A small landing banner only if Or7 approves touching the approved landing. |
| **E7** | **Editing an answer when later adaptive questions depend on it** | Q7 | Keep the later answers that are still valid. Drop invalidated adaptive picks only after a confirmation that says how many will change. Never break quotas. |
| **E8** | **Chrome during the quiz** | Q3, Q8 | A focused header (symbol, progress, Pause, settings) instead of the landing section nav. |
| **E9** | **IndexedDB unavailable** (private modes, blocked storage) | Q9 | A full-session fallback in localStorage (a 90-answer session is a few kB), with a visible notice that progress lives only in this browser. |
| **E10** | **Preparation layout on tablet** (direction pins desktop row / mobile stack) | Q2 | A row in landscape and a stack in portrait. |
| **E11** | **Narrow-phone card fix** touches the approved landing | Q11 | Revealed-state CSS only, under a container query. Art and the other states are unchanged. |
| **E12** | **Timings** (Liquid Flow cover/reveal, feedback, slide) | Q1, Q4, Q5 | Proposed for review at CP1/CP2. Feedback fixed at 300 ms inside the approved range. |
| **E13** | **Duration estimate on the mode cards** (e.g. "about 10 min") | Q2 | Leave it out until real timing data exists. Show the question count and name only. |

## Not in Phase 02
- the real question bank, the adaptive engine and matching (Phase 04);
- the catalog (Phase 03);
- results, Holo Card and Share Studio (Phase 05);
- "category atmosphere" treatments (listed in the direction but not requested here; they need separate approval);
- the Encounter Thread;
- a light-mode switch;
- hosting/deploy;
- the rejected landscape video pack;
- any animation beyond the ones listed above.
