# Phase 01B: Asset pack integration report

Branch `phase/01-visual-identity`. Not merged, not pushed. **Stopped for Or7 visual review.**
Source: `RareEncounter_Assets_01B.zip` (6 files), inspected in an isolated folder before use. The originals are kept unmodified in `design-references/approved/assets-01b/`.

## A. Inspection

| File | Size / ratio | Transparency | Verdict |
| --- | --- | --- | --- |
| `logo-rare-encounter-transparent.png` | 1968×799 (2.46:1) | Real alpha (58% fully transparent) | ✅ **Production.** Same geometry and gradient as the approved `logo-04-reference`, no "4" badge. Byte-identical to the `Glossy RARE Encounter Logo.png` already in Downloads. Faint matting specks and a dark fringe show only at 1:1 over black; at nav size on the night background they are invisible. |
| `logo-symbol-transparent.png` | 1254×1254 (1:1) | Real alpha | ✅ **Production.** "AR" ribbon with the star, taken from the same logotype. |
| `card-01-ethereal-art-only.png` | 1024×1536 (2:3) | Alpha **identical** to the approved card (mean 169.3) | ✅ **Production.** |
| `card-02-instinctive-art-only.png` | 1024×1536 (2:3) | Alpha identical (mean 184.0) | ⚠️ **Production with a defect:** faint remnants of the "02" digits remain between the two upper stars. The real HTML "02" sits exactly over that spot and hides it, but the file itself **needs a clean pass** (see `qa-card-02-number-residue.png`). |
| `card-03-radiant-art-only.png` | 1024×1536 (2:3) | Alpha identical (mean 172.7) | ✅ **Production.** |

**How "not redesigned" was verified:** a pixel diff against the approved cards shows that only about 11% of pixels changed, all inside two bands:
- the number slot (y ≈ 144–240 px);
- the lower text and button plate (y ≈ 960–1440 px).

Frame, ornaments, colors and the luminous question mark are identical. The lower plates are clean, with no seams (see `qa-card-01-lower-plate.png`).

The visual reference image you attached was used only as **direction** (depth, violet, cyan and gold light, material). The hero was not rebuilt and nothing from it was copied.

## B. Integration
- **Optimized assets:** `scripts/build-assets.mjs` produces them with Playwright's own Chromium (resampling in halving steps, WebP export). No new dependency.
  - **Cards:** 480, 640 and 960 px WebP, 2:3 kept, served with `srcset` and `sizes`. A 640 px card is 133–148 kB instead of about 2 MB as PNG.
  - **Logo:** 2× and 3× WebP, 11 and 19 kB.
  - **Symbol:** 2× and 3× WebP.
  - **Identity:** `favicon-32`, `favicon-192`, `favicon-512`, `apple-touch-icon` (symbol on the night background, since iOS fills transparency with black) and `site.webmanifest`.
- **Logo:** `LOGO_ASSET` now points at the authentic logotype, shown in the Liquid Nav and in the mobile Top Bar at 40 px. The link keeps "Rare Encounter" as its accessible name. `Logo variant="symbol"` exists for compact UI. In the current interface the symbol is used for the favicon and app icons.
- **Floating Archetype Cards:**
  - The approved art is now the card itself. The CSS-drawn frame is used only while no art exists.
  - The real HTML number **01/02/03** sits in the cleared slot between the upper stars (13.7% from the top). Title, phrase and the "Tap to discover" button sit on the cleared lower plate.
  - Type scales with the card through container units, so the layout matches at every width.
  - The sparkle icon is the same on all three cards. Titles use DM Serif Display.
- **Motion** (Motion for React + CSS; the approved movement is kept):
  - **Reflection:** a soft highlight follows the cursor. It is masked by the art's own alpha, so it lights only the card, and it fades in and out with a spring.
  - **Elastic return:** the tilt spring was retuned (stiffness 220, damping 17) to settle back with one small, controlled overshoot.
  - **Unchanged:** the slow CSS float (paused on hover and focus), the phrase reveal, and pointer-only effects (no tilt or reflection on touch).
  - **Reduced motion:** no float, no tilt, no reflection layer.
- **Themes:** the six themes are untouched. The cards keep their fixed art hues, as approved.

## C. Verification
| Check | Result |
| --- | --- |
| typecheck / lint | ✅ |
| Vitest | ✅ 46/46 (new: all three cards ship `srcset` art; decorative `alt=""`) |
| Playwright, 3 viewports | ✅ 47 passed, 4 skipped (desktop-only nav and reflection tests on tablet and mobile) |
| Image loading (E2E) | ✅ 3 card images complete with ratio 2:3; nav logo loaded; favicon, touch icon and manifest served |
| Interaction (E2E) | ✅ Hover: the reflection appears and fades on leave. Click: phrase revealed. **Touch tap:** phrase revealed. Reduced motion: no float and no reflection layer. |
| Safety scan / vendor integrity | ✅ / ✅ (8 originals unchanged) |
| Build | ✅ JS 143 kB gzip (+8 kB); images load lazily via `srcset` |
| Impeccable detector | ✅ 0 findings in project code. The 3 findings are all in vendored React Bits originals (Gradient Text and Stepper easing), which must not be edited. |

**Fix during verification:** tests timed out waiting for floating cards to "hold still". Tests now scroll the section rather than the moving card. No product change was needed.

**Evidence** (`docs/reports/phase-01b-assets/`):
- **Hero with the logo:** desktop, tablet, mobile.
- **Cards:** desktop, tablet, mobile revealed, desktop hover and desktop revealed.
- **Asset QA crops:** card 02 residue and card 01 lower plate.

## Pending
1. **Card 02:** a clean re-export of the number area. The residue is hidden in the page, but the file is not final.
2. **Logo at small sizes:** "ENCOUNTER" is about 6 px tall at nav size. It is legible, but small. Or7 may prefer a horizontal lockup (symbol + wordmark) for the nav.
3. Open decisions from checkpoint 02 still stand: DM Serif Display, the disabled closing control, the Stepper's English aria prefix, and keeping `rare-encounter-visual-reference.png` public.
