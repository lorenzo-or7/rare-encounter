# Prompt 01: Functional Refinement Report

Branch `feature/functional-refinement`, created from `feature/complete-experience` (`0243081`). Not pushed, merged or deployed.

## 1. Question review
- **Review:** all 300 prompts were read in pt-BR, the reference language.
- **Rewritten: 14 questions** that relied on improbable or dramatic situations, on abstractions that are hard to answer, or that duplicated another question's situation:

| Question | Before | After |
| --- | --- | --- |
| pe-001 | a door you have never seen | a new place opening near home |
| pe-015 | an old map in a drawer | a box of old family photos |
| pe-020 | a secret that changes everything | something surprising about a familiar subject |
| pe-034 | a letter with no sender | a message from an unknown number |
| pe-037 | lost on a trail at dusk (the example raised) | lost in a city you don't know |
| pe-045 | an old bridge over a river | a thrill ride that looks a little scary |
| ae-030 | a sound that seems to have a shape | which sound you'd like to hear now |
| ae-046 | living inside a material | what your own corner would be made of |
| ae-051 | "choose a wave" | which wave you'd watch longest |
| va-013 | a house on fire | moving out in a hurry |
| va-018 | an injured "creature" | an injured animal |
| be-027 | "if you were a nest" | your ideal place to rest |
| in-013 | an animal fleeing a storm (repeated the trail-storm question) | a loud crash in a crowded place |
| in-024 | crossing hostile territory | sorting something out where you know nobody |

- **What stayed the same:** each rewrite keeps the same id, category, role and **trait per option position**, so stored answers keep their meaning. The bank version also stays, so sessions in progress keep working.
- **What changed:** the content `revision` of these questions is now 2. The pt-BR, en-US and es texts were rewritten together.
- **Automatic checks** (`bank.test.ts`, all passing): 300 questions, quotas, four options, translations, registered traits, and a near-duplicate screen with no new pairs.

## 2. "None of these"
- **What it is:** a fifth action, separate from the four options ("None of these" / "Nenhuma dessas opções" / "Ninguna de estas opciones"). It is stored as the reserved answer id `void`.
- **Progress:** it counts as a question gone through.
- **Evidence:** `preferenceSignals` skips it entirely. It adds nothing for or against any trait and never enters a denominator. A test checks that the signals are identical with and without voided questions.
- **Going back:**
  - the pass shows as chosen;
  - an answer can replace it, and the other way round;
  - adaptive picks are recomputed through the existing reconcile/edit path;
  - every question counts once.

## 3. Notice after three passes in a row
- **Where it lives:** `void-notice.ts`, computed from the session's current order. Because of that, edits, adaptive changes and going back update it on their own.
- **When it appears:** once per run of passes (identified by the run's first question). A real answer ends the run, and a new run of three brings a new notice.
- **After a reload:** it is marked as shown in `localStorage` (per session) the moment it appears, so it doesn't come back.
- **Behaviour:** it doesn't block answering, lives in a `role="status"` region, and has a "Continue the journey" button.

## 4. Unown and too little evidence
- **New result shape:** results are a union of three outcomes.
  - `matches`: also covers results stored before this change;
  - `mystery`;
  - `insufficient`.

  The store validator accepts all three, and earlier results keep working.
- **Every question voided (30, 60 or 90):** a `mystery` result with Unown, the real species No. 201 from the catalog.
  - No affinity is computed, and the normal ranking (Unown included) is never touched.
  - The page says Unown is a symbol of the mystery, not a calculated Soul Match.
- **Some answers, but no defensible trio:** an `insufficient` result, which names no species. One answer and 29 passes gives `insufficient` (tested).
- **What every result stores:** the answered and voided counts.

## 5. Landing cards
- **On reveal:** the question mark dissolves (a copy of the window lifting away in blur and light), a field of the card's own hue opens from the centre, and the sigil and phrase appear in the window. Hiding reverses it.
- **Layout:** the plate keeps only the title and the button, at a fixed size.
  - The button stays inside the card at 320, 375, 768, 1024 and 1440 px (measured).
  - The official arts are unchanged.
- **Reduced motion:** a plain fade.

## 6. Results: three official cards
- **Order and arts:**

| Encounter | Card |
| --- | --- |
| Soul Match | Ethereal |
| Alternative Match | Radiant |
| Hidden Match | Instinctive |

- **Back:** the official art with the "?".
- **Front:** a separate face.
  - The same official frame, with the window covered by a field of the card's hue.
  - The Pokémon's official artwork inside the window, the National Pokédex number at the top, the name on the plate.
  - It is built from data and nothing is baked per species.
- **Before the reveal:** every card starts face down. The front, name, number, image and explanation don't exist on the page until the card is revealed (tested), and each reveal waits for the one before it.
- **Two separate states:** the persistent `revealed` is kept per result in `localStorage`, honouring the earlier Hidden Match veil key; `faceUp` is local. Turning a discovered card back over never forgets the discovery.
- **Each encounter's turn:**
  - Soul: the main, brightest one;
  - Alternative: a softer one;
  - Hidden: darker and slower;
  - Unown: the slowest.

  The light and shade sit on separate layers. A `filter` on the 3D container flattened it and showed the back mirrored; this was caught in the captures and fixed.
- **Accessibility:** one button per card (click, tap, Enter, Space), and the same element keeps focus. Reduced motion swaps the faces without turning.
- **What left:** the earlier `HoloCard` and the provisional emblem were removed.
- **Sharing:** still not offered.

## 7. Matching engine
- **The engine itself was not changed.** The only change is in the signals: voided questions are skipped (zero evidence, not in the denominator).
- Determinism and three distinct species are covered by tests.

## Pending
- **Card front:** a frame-only version of the three card arts (without the "?") would let the front show the full window. The front covers the window with an opaque field of light today.
- **Copy review:** the rewritten questions and the new copy still need Or7's editorial review.
- **Visual redesign:** the cosmic results screen comes in Prompt 02. The components are already separate (`ResultCard`, `ResultsExperience`) for it.
