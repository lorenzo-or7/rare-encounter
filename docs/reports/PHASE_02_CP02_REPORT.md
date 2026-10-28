# Phase 02, Checkpoint 02: Quiz Questions & Motion

Branch `phase/02-quiz-experience`. Not merged, not pushed. **Stopped for Or7 review.**
Also delivered: the Checkpoint 01 refinements Or7 approved with E5/E8/E10/E12/E13. Checkpoints 03 and 04 were not started.

## 1. Checkpoint 01 refinements
- **Depth cards:** the core/adaptive split is gone from the interface. Each card keeps its numeral, its approved name and "N questions", plus one line:

  | Depth | pt-BR (Or7) | en | es |
  | --- | --- | --- | --- |
  | 30 A Glimpse | A primeira descoberta sobre quem você é. | A first discovery of who you are. | Un primer descubrimiento de quién eres. |
  | 60 The Journey | Explore mais profundamente sua personalidade. | Explore your personality in more depth. | Explora tu personalidad con más profundidad. |
  | 90 Deep Connection | Uma jornada completa pelas suas diferentes facetas. | A complete journey through your many sides. | Un recorrido completo por tus distintas facetas. |

  `MODES` (quotas, 21/9, 42/18, 63/27) is unchanged.
- **Dimming:** unselected cards while locked go from 0.4 to **0.72** opacity and stay readable (`prep-starting`).
- **Liquid Flow (E12 B):** about 1.2 s, as a 0.7 s cover plus a 0.5 s fade; reduced motion keeps 0.2 s. Same layer and look; only the durations changed.
- **Select & Confirm** is kept: choose, then confirm.
  - Confirm now has a real destination: it **writes the new session to IndexedDB first** and opens the questions only after the write commits.
  - While writing, the cards lock and Confirm reports busy.
  - If the browser can't save (blocked or private storage), the screen says so plainly, the choice stays open, and nothing starts (`quiz-storage-blocked`).
  - The interim "confirmed, not available yet / Choose another depth" state from CP01 is gone, along with its three strings.

## 2. Checkpoint 02
- **Quiz logic outside React:**
  - `domain/question-source.ts` defines the `QuestionSource` contract. Phase 04 extends it with adaptive `next` and `reconcile`.
  - `features/quiz/flow.ts` is a pure reducer: `answering → saving → answering | complete`, plus `save-error`, `retry`, `back` and `forward`.
  - React glue lives in `useQuiz` and `useEncounterStore`.
- **Preview questions** (`features/quiz/preview/`):
  - 12 sample questions I wrote, two per category: 5 text, 3 image and 4 icon-text, in en/pt-BR/es.
  - Labelled on screen: *"Preview: sample questions, not the final question bank. They repeat, and they will not produce a result."*
  - They carry **no trait effects**, so nothing can be scored from them.
  - Sessions use the real length (30/60/90), the **exact category quotas** and unique question ids. The templates repeat to fill them.
  - Image questions use six simple SVG landscapes I drew (about 0.5 kB each, no Pokémon or third-party imagery).
  - No result is ever generated: after the last answer the screen says the answers are saved and that preview questions never produce a result (`quiz-complete`).
- **Focused header (E8 A):**
  - the compact symbol;
  - one continuous progress bar in the logotype's violet-to-cyan (`role=progressbar`, answered / total) with its counter;
  - **Pause**, shown as unavailable with its reason, because the pause modal is Checkpoint 03;
  - **Settings** (the existing sheet).
- **Three formats:**
  - text: a list of answers;
  - image: a 2 × 2 grid with the label under each illustration;
  - icon with text: a Hugeicons glyph in an accent disc, one column on phones and two from 480 px.

  Each answer is a `button` with `aria-pressed` inside a group labelled by the question. The chosen state uses the accent border, a tint and a **check mark**, so it doesn't rely on color.
- **Horizontal Flow:** forward enters from the right; **back reverses it** (`data-direction=-1`). The view that's leaving is `inert`, so it can't be answered or focused.
- **Energy Pulse + Spring Press:**
  - The press dips to 0.97 and springs back (Motion).
  - One wave of accent light spreads from the point of contact, or from the center when chosen with the keyboard (CSS, 560 ms).
- **Auto-advance only after a confirmed save:** the next question appears when **both** the IndexedDB transaction has committed **and** the 300 ms feedback window has passed.
  - A failed save keeps the question and the chosen answer, shows a clear message with "Try again", and loses nothing.
  - A synchronous lock blocks double clicks.
  - A choice from the question that's leaving is ignored.
- **Back / Next:** Back returns to earlier questions and shows the saved answer. "Next question" appears when the question on screen is already answered.
  - Choosing a different answer there overwrites it through the existing `recordAnswer`. That's safe because the preview has no adaptive dependencies.
  - Edits that invalidate adaptive questions (Or7's rule) belong to Checkpoint 03.
- **Reduced motion:** no slide, press scale or pulse (Motion `reducedMotion="user"`, CSS media query); a short fade remains, and the chosen state still shows.
- **Language mid-quiz:** prompts, labels and the preview notice switch language; the stored answers (ids) and progress don't change.
- **Persistence:** only the approved contracts are used (`putSession`, `recordAnswer`, unchanged; DB v1). Nothing says "saved" unless it has committed.

## Files
- **New:**
  - `src/domain/question-source.ts`
  - `src/features/quiz/{flow.ts, flow.test.ts, useQuiz.ts, useEncounterStore.ts, QuizScreen.tsx, QuizScreen.css, QuizHeader.tsx, QuestionView.tsx, AnswerButton.tsx, option-icons.ts}`
  - `src/features/quiz/preview/{preview-bank.ts, preview-bank.test.ts, scenes/*.svg}`
  - `e2e/quiz.spec.ts`
  - this report and `phase-02-cp02/`
- **Changed:**
  - `src/pages/encounter/EncounterPage.tsx`
  - `src/features/preparation/{PreparationScreen.tsx, PreparationScreen.css, ModeOption.tsx}`
  - `src/features/encounter-transition/EncounterTransition.tsx` (durations)
  - `src/components/icon/Icon.tsx` (pause and arrow icons)
  - `src/styles/tokens.css` (`--color-danger` for failed saves)
  - `src/domain/index.ts`
  - `src/i18n/messages/{en,pt-BR,es}.ts`
  - `e2e/preparation.spec.ts`
  - `docs/EXECUTION_LOG.md`

## Verification
| Check | Result |
| --- | --- |
| typecheck / lint | ✅ / ✅ |
| Vitest | ✅ 64/64 (+14: flow reducer and preview source) |
| Playwright, 3 viewports | ✅ **104 passed, 25 skipped** (viewport-specific), 0 failed in the final full run |
| Safety scan / vendor integrity | ✅ / ✅ (10 React Bits originals unchanged) |
| Build | ✅ landing JS 138.6 kB gzip (+1.0 kB, mostly the new strings in three languages); encounter chunk 13.7 kB JS + 3.6 kB CSS gzip, loaded on demand |
| Impeccable detector | ✅ 0 findings (regex scan; contrast and sizes checked on the captures) |

**Earlier run notes:**
- In the run before the final one, two tests failed:
  - **Clash Display check:** the failure was in `page.goto`, the same preview-server instability seen in CP01. It passed on rerun and in the final run.
  - **Quiz keyboard test:** this was a test fault. It checked focus while the previous question was still sliding away, so two prompts existed and Playwright's strict mode errored instead of waiting. A trace in a real browser confirmed focus does reach the new prompt. The test now targets the live question; it passed 3/3 on its own and in the final run.
- During the run, three language-switch tests also failed: the test looked for the dialog by its English name after switching to Portuguese. Fixed, and they pass.

**E2E coverage added:**
- the three formats with the header (progress, counter, unavailable Pause with its reason, preview notice);
- the pulse and chosen state;
- back with reverse direction and Next;
- **a failed save keeps question and answer, stores nothing, and "Try again" saves and advances** (checked by reading IndexedDB independently);
- a double click records exactly one answer;
- keyboard (Enter chooses, focus moves to the next prompt);
- language switch keeps answers;
- blocked storage stops the start with a clear message;
- a full 30-question run ends without a result;
- reduced motion;
- 320/360/375 px with no overflow across the first six questions;
- Preparation: new descriptions, no internal split shown, locked state at 0.72, confirm stores and starts.

**Evidence** (`docs/reports/phase-02-cp02/`, 32 captures):
- each format on desktop, tablet and mobile, plus image and icon at 320 px;
- the new depth cards at 320/360/375 px and on tablet, and the locked state;
- pressed with the pulse, the selected state and keyboard focus;
- save error (desktop and mobile) and blocked storage;
- reduced motion;
- pt-BR and es;
- the end of the preview run.

## Limits and notes
- **Leaving mid-quiz:** answers are already stored, but resuming and the pause modal are Checkpoint 03, so the symbol isn't a link during the questions and Pause is shown as unavailable.
- **Fallback when IndexedDB is unavailable:** that is E9, in Checkpoint 03. Until then, a session doesn't start without storage, so progress is never silently lost.
- **Preview repetition:** a 30-question run shows each of the 12 templates two or three times; 60 and 90 repeat more. The notice says so.
