# Phase 01B: Final finish report

Branch `phase/01-visual-identity`. Not merged, not pushed. **Stopped for the final Or7 review.**
The hero and the approved landing are unchanged apart from the points below.

## 1. Card 02 (Instinctive): "02" residue removed
- `scripts/fix-card-02.mjs` rebuilds only a 73×18 px box (x 478–552, y 152–171) by Coons-patch interpolation of the box's own border (RGBA). That box contains the two leftover arcs.
- **Proven by the script** (it exits with an error otherwise):
  - **0** pixels changed outside the box;
  - residue in the number band went from **151 pixels to 0**;
  - the art's own guide lines above and below were excluded and untouched.
- **Against the approved original:** alpha mean 184.0 → 184.0; the changed bands are the same as in the supplied file (number slot and lower plate only).
- The supplied file is kept as is. The fix is a new file, `design-references/approved/assets-01b/card-02-instinctive-art-only-v2.png`, and the WebPs are regenerated from it.
- **Visual proof:** `phase-01b-final/qa-card-02-number-4x.png` shows the approved original, the supplied art-only and v2 at 4×. v2 shows no residue.

## 2. Logo and navbar
- **Trimming:** only the transparent margin was removed (the logotype fills 71% of its file's height, the symbol 38%). No pixel of either mark changed.
- **Desktop, top of the page:** the full logotype at 44 px, now actually 44 px of mark instead of about 31 px.
- **Collapsed nav (after scroll) and phones:** the approved **compact symbol**. The swap is a 0.22 s crossfade. "ENCOUNTER" would be too small to read in those spaces, and the brand link keeps "Rare Encounter" as its accessible name.
- **Favicons and touch icon:** rebuilt from the trimmed symbol, so the mark is larger in the square.

## 3. Typography
- **DM Serif Display:** card **titles only**, as approved.
- **Card numbers:** now Clash Display.
- **Everything else:** Clash Display for editorial headings, Inter for text and controls (unchanged).

## 4. Stepper accessible labels: resolved
- `useLocalizedStepLabels` rewrites only the `aria-label` of the original Stepper's indicators: "Etapa N: …" in pt-BR and "Paso N: …" in es.
- It watches them through a `MutationObserver`. React re-sets an attribute only when its prop changes, so the localized label holds between renders and is re-applied when the locale changes.
- The vendored file is unchanged (`check:vendor` ✅) and nothing visual changes.
- **Remaining limitation:** it depends on the Stepper keeping its `Step N: <title>` label format. A React Bits update that changes that format would need the pattern adjusted. The E2E test would catch it, because it asserts no `Step ` label remains in pt-BR.

## 5. Closing CTA: unavailable, accessibly
- Switched from native `disabled` (removed from the tab order, so its explanation was unreachable) to `aria-disabled="true"`. It stays focusable, is announced as unavailable, does nothing when activated, and is described by:
  - **en:** "Not available yet. The encounter will start from here once it opens."
  - **pt-BR:** "Ainda indisponível. O encontro vai começar por aqui quando abrir."
  - **es:** "Aún no disponible. El encuentro empezará aquí cuando abra."
- The Liquid Flow structure is unchanged: Phase 02 registers `preparation` and the control enables itself.

## 6. Repository
- `design-references/rare-encounter-visual-reference.png` was removed from the current Git state with `git rm --cached`. History was not rewritten.
- The local copy is kept and ignored (`.gitignore`) so it can't be re-added by accident.
- All approved references and individual assets stay tracked.

## 7. QA
| Check | Result |
| --- | --- |
| typecheck / lint | ✅ / ✅ |
| Vitest | ✅ 48/48 (+2: localized Stepper labels) |
| Playwright, 3 viewports | ✅ 47 passed, 4 skipped (desktop-only nav and reflection tests on tablet and mobile) |
| Safety scan / vendor integrity | ✅ / ✅ (8 originals unchanged) |
| Build | ✅ JS 136.6 kB gzip |
| Impeccable detector (project code) | ✅ 0 findings |

**WebP quality** (decoded in Chromium against the source PNG at the same size):

| Asset | Alpha mean, WebP vs PNG | Ratio | Mean difference per channel |
| --- | --- | --- | --- |
| Card 01 | 169.3 vs 169.3 | 2:3 exact | 2.05 / 255 |
| Card 02 | 184.0 vs 183.9 | 2:3 exact | 2.05 / 255 |
| Card 03 | 172.7 vs 172.7 | 2:3 exact | 2.50 / 255 |

Logo and symbol keep their transparency (38% and 48% fully transparent).

**E2E coverage added:**
- Logo variant: full at the top, symbol when condensed and on phones.
- Card numbers render in Clash Display and titles in DM Serif Display.
- Stepper labels are localized in pt-BR.
- The CTA is `aria-disabled`, focusable and described, and pressing Enter starts nothing.
- Earlier coverage still applies: image loading, alignment, hover reflection, touch tap and reduced motion.

**Evidence** (`docs/reports/phase-01b-final/`):
- **Hero with the full logo:** desktop, tablet, mobile (mobile shows the symbol).
- **Collapsed nav with the symbol:** desktop.
- **Cards:** desktop revealed, desktop hover, tablet, mobile revealed.
- **Closing CTA:** desktop and mobile.
- **Card 02 comparison:** the 4× crop.

## Pending
None blocking Phase 01B. Observation for Or7: on the smallest cards (phones), the revealed state fills the lower plate fully. The phrase, the title and the Hide button fit, but with little spare room.
