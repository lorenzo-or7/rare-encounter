# Phase 02, Checkpoint 03: Control, Persistence and Recovery

Branch `phase/02-quiz-experience`. Not merged, not pushed. **Stopped for Or7 review.**
Questions remain the labelled preview set. There is no question bank, no Pokémon profiles, no matching, no scores and no results. Checkpoint 04 was not started.

## What changed
**1. Pause and navigation**
- **Pause** uses the approved sheet pattern: right drawer on desktop, bottom sheet on phones, native modal `<dialog>`.
  - It shows the depth and progress ("A Glimpse: 2 of 30 answered."), plus "Every answer so far is saved in this browser". If the last save failed, it says that answer isn't saved yet.
  - **Continue** (also Escape and the close control) returns focus to Pause.
  - **Save and leave** stores the `paused` status and returns to the landing.
  - **Start over** always asks first ("This deletes your N answers from this browser. It cannot be undone.") with focus on *Keep my answers*.
- **Browser Back:** an extra history entry lets the first Back open Pause instead of leaving. A second Back leaves for real (the session stays saved). There is no loop.
- **Reload:** reloading during the questions resumes them.
- **Closing the tab:** the browser asks for confirmation only while an answer isn't stored yet (saving, failed, or an edit waiting for confirmation). Every other answer is already committed.

**2. Resuming**
- **Landing banner**, floating over the bottom so the approved layout doesn't change:
  - "Your encounter is waiting · The Journey: 3 of 60 answered" with **Continue the encounter**, which runs the Liquid Flow straight into the question where the person stopped;
  - or "A saved encounter needs your attention" (recovery);
  - or "Your saved progress cannot be reached right now".
- **Closing the banner** hides it for this tab and deletes nothing. A new tab shows it again.
- **Priority:** an unfinished session comes before the last result (`bannerFor`, tested). Results arrive in Phase 05, so that case doesn't appear yet.
- **Begin your journey with an encounter in progress:** a panel offers *Continue the encounter* or *Start a new encounter*, which deletes the old one only after confirmation.
- **Resume** opens at the first unanswered question, with the same depth, the same answer ids and the same progress.
- **The banner only touches IndexedDB when the localStorage marker says there's something to check,** and `/encounter` only opens IndexedDB when the database exists (`indexedDB.databases()`). A first visit never creates a database.

**3. Editing answers**
- Going back and choosing a different answer runs `applyEdit`. The source's `reconcile` (new, optional contract) says which questions are still valid; still-valid answers are kept, and only those that depended on the change are cleared.
- When answers would be cleared, the person confirms first: "N later answers will be cleared… Everything else stays" (*Change answer* / *Keep previous answer*).
- The contract is validated: same length, no repeats, nothing before the edited question changes. Otherwise the edit is refused and nothing inconsistent is stored.
- Progress counts only answers that belong to the sequence.
- **Fixtures, not an algorithm:**
  - `src/test/fixtures/adaptive-source.ts` (test-only) has two dependent pairs.
  - The preview questions have no dependencies, so in the browser an edit only replaces the answer.
  - The dependency path is covered by unit tests and a component test on the real screen with real IndexedDB (fake-indexeddb).

**4. Persistence and reliability**
- **IndexedDB is still the source of truth;** DB v1 structure is unchanged.
- **Session schema v1 → v2** adds `revision`, a write counter, with a **validated migration**: sessions saved by CP02 builds are migrated, not discarded.
- **Conditional writes:** each write names the revision it expects, and a mismatch is refused (`SessionConflictError`). A session deleted elsewhere is reported as missing.
- **localStorage marker** `rare-encounter:active-session`: a versioned pointer written only after IndexedDB commits. Malformed data is ignored and never erased. It never replaces IndexedDB.
- **Two tabs:** the marker's `storage` event warns the other tab at once ("This encounter changed in another tab. Reload…"). The stale tab can't overwrite anything, and Reload resumes from the latest answers.
- **Assisted recovery** with nothing deleted until confirmed. Cases:
  - unreadable data;
  - data from a newer version;
  - no migration path;
  - written for other questions (different bank or unknown ids).

  The options are *Decide later* or *Delete it and start a new encounter*, with confirmation.
- **Failures:**
  - a failed save keeps the answer on screen (CP02);
  - a pause that can't be confirmed says so and offers *Leave anyway*, since the saved answers are already stored;
  - storage that can't be opened, or doesn't answer within 5 s, is reported as unreachable, never as "nothing saved".
- **Bug found and fixed:** the "latest unfinished session" lookup used the `data.updatedAt` index, and IndexedDB leaves records missing that field out of the index. Malformed sessions were invisible, not lost, but never offered for recovery. It now reads every record.

## Files
- **New:**
  - `src/storage/session-marker.ts` (+ test)
  - `src/features/quiz/{edit.ts, edit.test.ts, PauseSheet.tsx, QuizScreen.test.tsx}`
  - `src/features/resume/{resume.ts, resume.test.ts, intent.ts, ResumeBanner.tsx, ResumeBannerContent.tsx, ResumeBanner.css, SavedEncounterPanel.tsx, SavedEncounterPanel.css}`
  - `src/features/preparation/mode-names.ts`
  - `src/test/fixtures/adaptive-source.ts`
  - `e2e/{helpers.ts, recovery.spec.ts}`
  - this report and `phase-02-cp03/`
- **Changed:**
  - `src/domain/{session.ts, question-source.ts}`
  - `src/storage/encounter-store.ts` (+ test)
  - `src/features/quiz/{flow.ts, flow.test.ts, useQuiz.ts, QuizScreen.tsx, QuizScreen.css, QuizHeader.tsx}`
  - `src/features/preparation/{PreparationScreen.tsx, PreparationScreen.css, PreparationDestination.tsx}`
  - `src/pages/encounter/EncounterPage.tsx`
  - `src/pages/landing/LandingPage.tsx` (banner only)
  - `src/app/routing.ts` (history state)
  - `src/components/button/Button.css` (no underline on links styled as buttons)
  - `src/i18n/messages/*` (47 keys in three languages; "Pause is not available yet" removed)
  - `e2e/quiz.spec.ts`
  - `docs/EXECUTION_LOG.md`

## Verification
| Check | Result |
| --- | --- |
| typecheck / lint | ✅ / ✅ |
| Vitest | ✅ **91/91**, 4 consecutive runs (+27: store revisions, conflicts, migration, malformed data; marker; edit contract; reducer; resume and priority; component test for edit with dependencies) |
| Playwright, full run (3 viewports) | **149 passed, 1 failed, 27 skipped** (viewport-specific). The failure is in the details below. |
| Recovery suite after the fix (3 viewports) | ✅ 46 passed, 2 skipped |
| Build | ✅ landing JS **138.4 kB gzip** (unchanged from CP02); the banner loads 1.2 kB only when there is a marker |
| Safety scan / vendor integrity | ✅ / ✅ (10 React Bits originals unchanged) |

**What the runs found, and how each was resolved:**
- **First full run** (141 passed, 9 failed). Two real problems:
  - opening `/encounter` created an empty IndexedDB even on a first visit, which broke the CP01 guarantee. Fixed by checking that the database exists first.
  - storage that never answers left the screen loading forever. Fixed with a 5 s limit, then reported as unreachable.

  The other failures were test issues: a smooth scroll made a button "unstable", and the banner needed more time.
- **Second full run** (147 passed, 3 failed). The simulated storage block now hit `indexedDB.databases()`, which my test didn't block. Since a real block affects both calls, I fixed the simulation, and the 3 tests then passed.
- **Third full run** (149 passed, 1 failed: "closing the banner keeps the encounter" on tablet).
  - **What I measured:** outside the runner, the banner on a second tab of the emulated iPad appears after **4.2 to 8.1 s, with no errors**. Headless Chromium renders the landing's WebGL in software (the reason for `workers: 1`), and two landings compete.
  - **What I changed:** the banner timeout went to 30 s; the test then passed 3/3 on tablet, and the whole recovery suite passed on all three viewports.
  - **Not verified:** the time on real hardware with a GPU.
- **After that run:** small changes (the button-link underline and that timeout). I reran typecheck, lint, unit, build, safety, integrity, and the affected E2E tests, but **not the whole E2E suite again.**

**Tested in E2E (desktop, tablet, mobile):**
- pause, Escape and focus;
- focus never reaches the page behind the modal;
- start over with confirmation (cancel and confirm);
- save and leave, then continue from the banner (same depth, answer ids and progress);
- reload resumes;
- closing the banner deletes nothing;
- Begin with an encounter in progress;
- browser Back opens Pause once, and a second Back leaves;
- editing an earlier answer keeps the sequence and progress;
- two tabs;
- a failed pause with *Leave anyway*;
- blocked storage on the landing and on Preparation;
- recovery for other questions (decide later, then delete with confirmation);
- malformed data and a newer version;
- a v1 session migrated and resumed;
- reduced motion;
- pause and banner in Spanish.

The double click and the language switch during a session are covered by the CP02 tests, which run in the same suite.

**Evidence** (`docs/reports/phase-02-cp03/`, 37 captures per viewport set):
- pause, start-over confirmation and failed pause;
- the resume banner (session, recovery, unreachable, Spanish);
- the panel for an encounter in progress;
- recovery (other questions, malformed data);
- the conflict between tabs;
- an earlier answer revisited;
- pause under reduced motion.

## Remaining limits
- **Editing with dependencies** is proven by contract (fixtures, unit and component tests). In the browser the preview has no dependencies, so the "N answers will be cleared" dialog only appears once a source with `reconcile` exists (Phase 04).
- **Blocked IndexedDB:** without the localStorage fallback (Or7: IndexedDB stays the source of truth), the encounter doesn't start and says so. Nothing is promised and nothing is lost, but there is no offline mode in that case.
- **Last result:** the banner priority is implemented and tested, but no result exists until Phase 05.
- **Mobile banner:** it floats over the bottom of the hero (its supporting text) until closed or scrolled past. This is for Or7 to judge visually.
- **Closing the tab** only warns while an answer isn't stored yet; it doesn't warn during a fully saved session, because nothing would be lost.
- **Marker only as a pointer:** if IndexedDB holds a session but the marker was never written, the landing banner doesn't show. `/encounter` still finds and offers the session.
