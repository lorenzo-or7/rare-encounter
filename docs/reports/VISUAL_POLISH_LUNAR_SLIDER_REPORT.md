# Visual Polish 02: Lunar Slider and Light Mode

Branch `feature/visual-polish-lunar-slider`, created from local `main` at `c46fc67` (Phase 01B, the last approved integration). Not merged, not pushed. **Stopped for Or7 review.**

## Git state at the start (inspected, not assumed)
- **Working tree:** clean.
- **`main`:** `c46fc67`.
- **`feature/visual-polish-scrollbar`:** `f3aa407`, based on `main`.
- **`phase/02-quiz-experience`:** `fdbb8bb` (CP03), based on `main`.
- **Untouched:** neither of those two branches was merged, copied or modified.

## Summary
- **A second theme dimension.** Light/dark mode (`data-mode` on `<html>`) is independent of the palette (`data-theme`): 6 palettes × 2 modes = 12 combinations.
  - Changing the mode keeps the palette, and changing the palette keeps the mode.
  - **Dark stays the default**, so a visitor without a saved preference sees exactly the approved experience.
- **Lunar Slider (Classic Celestial).** A capsule with the moon (dark) and the sun (light). A knob slides behind the active icon with a spring.
  - It's a single `<button role="switch">`, keyboard-operable and named in all three languages.
  - It lives in the settings panel's "Appearance" group.
- **Light mode is designed, not inverted.**
  - Paper surfaces carry a trace of each palette's accent.
  - Text is a deep ink, with soft tinted shadows and fine lines.
  - Each palette gets its own light accents: the same hue, deeper.
  - The React Bits components follow the mode **through their original props** (Ghost Fibers `lightMode`, Stepper `theme`, Star Border `theme`); no vendor file changed.

## Files
- **New:**
  - `src/components/lunar-slider/{LunarSlider.tsx, LunarSlider.css}`
  - `e2e/lunar-slider.spec.ts`
  - this report and `docs/reports/visual-polish-lunar-slider/`
- **Changed:**
  - `src/styles/tokens.css`: surface, text, line and shadow tokens move into the mode blocks (dark values identical); the light block; hover token.
  - `src/styles/themes.css`: light accents for each palette.
  - `src/theme/themes.ts`: modes and `applyMode`.
  - `src/storage/preferences.ts` (+ `storage.test.ts`): v2 with `mode`, v1 migration, repair of an invalid mode.
  - `src/app/{PreferencesProvider.tsx, preferences-context.ts}`: `mode` and `setMode`.
  - `index.html`: applies the mode before first paint; `data-mode="dark"` by default.
  - `src/hooks/useThemeColors.ts`: also re-reads on mode changes (signature unchanged).
  - `src/components/settings/{SettingsPanel.tsx, SettingsPanel.css}`: the Appearance group.
  - `src/components/nav/SiteNav.tsx`, `src/components/layout/SiteLayout.tsx`, `src/components/logo/{Logo.tsx, logo-asset.ts}`: the logotype's light-surface finish in light mode (section below).
  - `scripts/make-logo-onlight.mjs` (new), `scripts/build-assets.mjs`: the light-surface logotype and its runtime sizes.
  - `src/components/archetype-card/ArchetypeCard.tsx`: local dark scope, since the art is dark glass.
  - `src/components/button/Button.css`: primary hover through a token.
  - `src/pages/landing/{Hero.tsx, sections/Begin.tsx, sections/Discovery.tsx}`: mode passed to the original props.
  - `src/i18n/messages/{en,pt-BR,es}.ts`: 2 keys each.
  - `src/pages/foundation/FoundationPage.test.tsx`: the saved record now includes the preserved `mode`.

## Token architecture
| Layer | Where | Contents |
| --- | --- | --- |
| Structure | `:root` | typography, spacing, radius, motion, layers (unchanged) |
| Palette (dark) | `:root` + `[data-theme='…']` | `--accent`, `--accent-2`, `--accent-soft`, `--on-accent`, `--focus-ring` (unchanged) |
| Palette (light) | `[data-mode='light'][data-theme='…']` and `[data-mode='light'] [data-theme='…']` | the same names, deeper values; the second form lets a nested palette (Theme Studio swatch) preview itself in the current mode |
| Mode | `:root, [data-mode='dark']` / `[data-mode='light']` | `color-scheme`, `--color-bg`, `--color-bg-raised`, `--color-surface(-hover)`, `--color-overlay`, `--color-line(-strong)`, `--color-highlight`, `--color-text(-muted, -subtle)`, `--shadow-sm/md/lg`, `--accent-hover-toward` |
| Derived | `:root, [data-theme]` | `--iris` (unchanged) and the new `--accent-hover` (toward white in dark mode, toward black in light mode) |

**Notes on the design:**
- **Light surfaces** are `color-mix()` of the palette accent (3–8%) with near-white paper, so each palette keeps its temperature without per-palette surface values.
- **Reusable dark scope.** `data-mode="dark"` on any element restores the night tokens locally; the archetype cards use it, because the approved art is dark glass in either mode.
- **Accent names unchanged.** `--accent`, `--accent-2` and `--iris` were neither renamed nor replaced. Their **values** follow the mode; that's how text, focus and fills keep their contrast on paper.

## Lunar Slider
- **Geometry:** a 66 × 36 capsule on the nav's material, with a 28 px knob that springs 30 px (Motion, about 0.2 s). The touch area is 44 px tall.
- **Semantics:** `role="switch"`, with `aria-checked` true meaning light mode. In settings it's named by the visible label ("Light mode" / "Modo claro" / "Modo claro").
- **Keyboard:** Space and Enter toggle it. Focus shows an outline in `--focus-ring`.
- **Reduced motion:** the knob jumps with no intermediate frame. That's measured, not assumed: the same test with motion enabled sees intermediate frames.
- **Reuse:** it takes `mode`, `onChange` and a name, with no dependency on settings, so a future introduction screen can use it as is (nothing was built for it).
- **Placement:** in the settings panel (desktop drawer and mobile sheet), under "Appearance", between Language and Theme. It isn't in the Floating Liquid Nav: there it would add about 70 px to a pill with four links and a settings button, which the brief asked not to do.

## Persistence
- **One store:** the existing preferences in `localStorage` (`rare-encounter:preferences`), now **v2** `{ locale, theme, mode }`.
- **v1 → v2:** a validated migration adds `mode: 'dark'`, keeping language and palette.
- **Invalid mode:** it alone falls back to `dark`, without discarding language and palette.
- **Invalid palette or language:** behaves exactly as before.
- **No flash:** the inline script in `index.html` applies `data-mode` (and the `color-scheme` and `theme-color` meta tags) before first paint. The test records the mode at `DOMContentLoaded`, before the app runs.
- **Untouched:** IndexedDB and journey data.

## The logotype in light mode (follow-up to `73ac115`)
**Problem:** the approved logotype's "ENCOUNTER" is a white fill with a thin navy outline. On the night background the outline disappears and the white reads; on paper the white disappears and the letters look hollow (`logo-onlight/before-original-on-light.png`). The first version of this branch fell back to the compact symbol in light mode.

**Fix:** a light-surface variant of the same logotype, made by `scripts/make-logo-onlight.mjs` from the approved raster. The original is never modified; the variant is `design-references/approved/assets-01b/logo-rare-encounter-transparent-onlight.png`.
- **The band is separable.** The script finds fully transparent rows (573–575) between the "RARE" block and "ENCOUNTER", and stops unless they exist.
- **What changes:** only the colour of the "ENCOUNTER" lettering (its opaque body and its antialiased edge within 2 px).
  - It becomes the logo's own outline navy, **`#111636`**: the mean of 3,392 outline pixels already in the logo, not a new colour.
  - Every pixel keeps its exact alpha, so geometry, antialiasing and spacing are identical.
- **What doesn't change:** the soft halo around the letters (31,758 px) keeps its original colour, so no dark haze is added. "RARE", the symbol and its gradient are untouched.
- **Proofs** (the script fails otherwise), confirmed by an independent diff:
  - 0 px changed above the gap;
  - 0 alpha differences anywhere;
  - colour changed only in rows 594–714 (91,099 px), same 1968×799 size.
- **Runtime:** `logo-onlight-88.webp` and `logo-onlight-132.webp` (273×88 and 409×132, the same crop and resampling as the original), built with `node scripts/build-assets.mjs logo-onlight`. A new optional filter builds only those, so no approved asset was rewritten.
- **Code:**
  - `Logo` gains `tone` (`dark` | `light`, the surface it sits on); `full` + `light` uses the light-surface image.
  - `SiteNav` takes `logoTone` instead of the earlier `fullLogo`, and `SiteLayout` passes the mode.
  - **Behaviour:** the full logotype shows at the top of the desktop page **in both modes**. The approved compact symbol stays in the condensed nav and on the phone and tablet top bar. Dark mode is identical to before (same image, same box).

**Checked in the browser** (`logo-onlight/`, 3× crops):
- **The right image in each of the 12 combinations:** `logo-132` in the six dark ones, `logo-onlight-132` in the six light ones.
- **No shift:** logo box 164.3×44 and nav 781.4×58 in all 12.
- **Approved compact behaviour kept:** symbol in the condensed nav in both modes, and on the mobile top bar in both modes, with no horizontal overflow.
- **Also verified:** mode switch, palette switch and reload keep the right finish (E2E).

**Observation for Or7:** "RARE" keeps its original white highlights inside the letters. On paper they read lighter than on the night: legible, but with less weight. They were left untouched because the brief preserves "RARE" and its gradient. A finishing pass on "RARE" for light surfaces, if wanted, would be a separate decision.

## Verification
**Automated contrast** (computed colors in the browser, WCAG formula), **132 pairs** across the 12 combinations: **0 below target**.

| Pair | Target | Lowest value in light mode |
| --- | --- | --- |
| Main, muted and subtle text on background and surface | 4.5 | 6.24 |
| Primary button text (and hover) | 4.5 | 5.83 |
| Accent as large text and icons | 3 | 4.97 |
| Second accent (gradients, large text) | 3 | 3.71 |
| Focus ring | 3 | 6.36 |

Dark mode keeps the approved values (main text 17.35:1). This is an automated check of token pairs, not a full visual audit: over images, the art and gradients, contrast was judged by eye on the captures.

**Commands:**
| Check | Result |
| --- | --- |
| typecheck / lint | ✅ / ✅ |
| production build | ✅ |
| Vitest | ✅ 51/51 (+3: v1 migration, mode repair, palette/mode independence) |
| Playwright, full suite, desktop/tablet/mobile | ✅ **90 passed, 0 failed, 30 skipped** (12-combination matrix on desktop only, width sweep on mobile only, desktop-only nav tests) |
| React Bits integrity | ✅ 8 originals unchanged |
| safety scan | ✅ |

**New E2E coverage:**
- Dark → Light and Light → Dark;
- palette change keeping the mode, and mode change keeping the palette;
- persistence after reload and the mode applied before first paint;
- v1 preferences, and an invalid mode;
- pt-BR and es names;
- keyboard and visible focus;
- a 44 px touch target;
- with motion (spring) and reduced motion (no intermediate frame);
- the full logotype in both modes, with its light-surface finish in light mode, the same box, and the compact symbol kept in the condensed nav and on phones;
- no **new** horizontal overflow from dark to light at 320, 360, 375, 390, 768, 1024 and 1440 px;
- settings usable at 320 px;
- the 12 captures.

**Investigated along the way:**
- **Six failures were in my test**, which looked up the settings button by its English name on Portuguese and Spanish pages. Fixed.
- **Two were time budgets**, with the measurement recorded in the code: 7 landing loads in one test, and a 20–25 s test alone on tablet.
- **The first reduced-motion test passed for the wrong reason.** Even with motion enabled, the reading came after the spring had settled. It was rewritten to sample every frame inside the page, and it now tells the two cases apart.

**Build weight compared with `main`** (gzip):
| | `main` | this branch | difference |
| --- | --- | --- | --- |
| JS | 136.57 kB | 137.58 kB | +1.0 kB |
| CSS | 8.16 kB | 8.80 kB | +0.64 kB |

**Evidence** (`docs/reports/visual-polish-lunar-slider/`):
- the **12 combinations** on desktop (`desktop-matrix-<palette>-<mode>.png`);
- light Spectrum on tablet and mobile;
- the settings panel in light mode on desktop, tablet, mobile and 320 px;
- light-mode sections: Discovery, Connection, Begin on desktop and mobile;
- the logo crop in both modes.

**Follow-up run (light-surface logotype):**
| Check | Result |
| --- | --- |
| typecheck / lint / production build | ✅ / ✅ / ✅ (JS 137.66 kB gzip, +0.08 kB; the two light-surface images load only in light mode: 17.5 and 29.5 kB) |
| Vitest | ✅ 51/51 |
| Playwright, full suite, 3 viewports | **91 passed, 1 failed, 31 skipped** |
| Re-run of the failed test alone | ✅ 3/3 |
| New logo tests (full logotype in both modes, finish follows mode/palette/reload, condensed nav and phone top bar keep the symbol) | ✅ all viewports |
| 12-combination matrix recaptured | ✅ 14 passed |
| React Bits integrity / safety scan | ✅ / ✅ |

**The one failure:** the 01B hero test on tablet, "Test timeout of 30000 ms exceeded", with no failed assertion.
- It runs in the default dark mode, where this follow-up changes nothing (same image, same box).
- Re-run alone it passed 3/3 (about 15–20 s of test).
- It's the documented load issue: WebGL in software in headless Chromium, plus a full-page capture.
- The test was not changed.

## Known limits
- **Logo in light mode:** resolved with a light-surface finish of the same logotype (section above); the "RARE" highlights are untouched (observation for Or7).
- **Archetype cards:** they stay dark glass in light mode (approved art); they read as dark objects on paper, which is intentional and should get Or7's visual sign-off.
- **320 px horizontal scroll:** the 5 px from the closing Star Border light are inherited from `main` (fixed in CP03, `fdbb8bb`). The test shows that light mode **adds** no overflow.
- **Browsers:** only Chromium was run, which is the only one installed here.
- **Matrix in the browser:** the 12 combinations were captured on desktop; tablet and mobile have the representative light Spectrum.

## Integration notes (not done here)
**With the scrollbar (`f3aa407`):**
- Both branches add to the same `:root, [data-theme]` block in `tokens.css`: a textual conflict that's simple to resolve (keep both).
- The scrollbar tokens are derived from `--color-text`, `--color-bg` and the accents, so in light mode they should become a light-grey track with the deep-accent gradient, with no new values. **To verify after the merge.**

**With CP03 (`fdbb8bb`):**
- **`tokens.css`:** CP03 adds `--color-danger: #ff8f9a` next to the text tokens, which here moved into the dark block. It needs a light value (a deeper red with ≥ 4.5:1 on paper) in `[data-mode='light']`.
- **`SiteNav.tsx` / `SiteLayout.tsx`:** CP03 adds `brandHref` and a mode without sections; this branch adds `fullLogo`. Same prop lists, so the conflict is simple.
- **`Button.css`:** CP03 adds `a.button`; this branch changes the primary hover. Nearby lines.
- **CP03 colors written for the night, to review in light mode:**
  - the dark text on the "Delete and start over" button (`#2a0a10`);
  - the photo-answer mark over images;
  - Border Glow on the depth cards: the original only recognizes light backgrounds given in hex, and CP03 passes `color-mix()`.
- **`useThemeColors` kept its signature,** so CP03's calls need no change.
