# Visual Polish 01: Slim Chromatic Scrollbar

Branch `feature/visual-polish-scrollbar`, created from local `main` at `c46fc67` (Phase 01B, the last approved and merged base). `phase/02-quiz-experience` (`fdbb8bb`, CP03) is untouched. Not merged, not pushed. **Stopped for Or7 review.**

## What it is
The browser's own scrollbar, restyled.
- **Nothing is added to the DOM** and no JavaScript is involved.
- **Scrolling is untouched:** wheel, trackpad, touch and keyboard behave as before, and the existing smooth-scroll setting already respects reduced motion.
- **Where it applies:** the page (root) and the settings sheet's body, the two scroll containers the app owns. Nothing else is restyled.
- **Thumb:** a 6 px pill (8 px under the pointer) in the active theme's iris, `--accent` → `--accent-2`, over an almost invisible track.
- **Space:** a fixed 10 px, so hover never moves the layout.
- **No animation:** scrollbar pseudo-elements can't animate, and hover is a width step, so reduced motion needs no special case.

## Files
- `src/styles/scrollbar.css` (new): the two routes below.
- `src/styles/tokens.css`: three tokens in the block that already re-derives `--iris` for every `[data-theme]` scope.
- `src/main.tsx`: imports the new stylesheet after `base.css`.
- `docs/reports/VISUAL_POLISH_SCROLLBAR_REPORT.md` and `docs/reports/visual-polish-scrollbar/` (evidence).

## Tokens added
Derived from the existing accents, so the six themes follow automatically and no theme gained a value:

| Token | Value | Use |
| --- | --- | --- |
| `--scrollbar-thumb` | `linear-gradient(180deg, var(--accent), var(--accent-2))` | the thumb (vertical iris) in Blink/WebKit |
| `--scrollbar-thumb-solid` | `color-mix(in oklab, var(--accent) 70%, var(--accent-2))` | the single colour for engines without gradients |
| `--scrollbar-track` | `color-mix(in oklab, var(--color-text) 4%, var(--color-bg))` | the track |

A horizontal bar, should one ever appear, uses the existing `--iris` (100°) along its own axis.

## Compatibility
| Engine and pointer | Route | Result |
| --- | --- | --- |
| Chromium/Edge, desktop (fine pointer) | `::-webkit-scrollbar` (`@supports selector(::-webkit-scrollbar)`) | gradient pill, **verified** |
| Safari desktop | the same route (WebKit supports the pseudo-elements) | expected to render like Chromium; **not tested** (WebKit isn't installed here) |
| Firefox desktop | `scrollbar-width: thin` + `scrollbar-color` (single colour) | **not tested** (Firefox isn't installed here). By the standard, the bar is thin and in one colour; no gradient is possible, so none is simulated |
| Touch (phones, tablets) | none: `(hover: hover) and (pointer: fine)` doesn't match | native auto-hiding indicator kept, along with the existing `base.css` rule; **verified** in emulation |

**Why two routes:** in Chromium 121+, setting `scrollbar-color` or `scrollbar-width` on an element **disables** its `::-webkit-scrollbar` pseudo-elements. The existing `base.css` rule (`scrollbar-color` on `html`) would have blocked the gradient, so the Blink/WebKit route resets both to `auto`, and the standard route applies only where the pseudo-elements don't exist.

## Verification
**Visual checks in Chromium**, against the production build, with scrollbars made visible (Playwright's headless Chromium hides them by default):

| Theme | Thumb sampled from pixels (top → bottom) | Expected `--accent` → `--accent-2` |
| --- | --- | --- |
| Spectrum | `#a68cfa → #3ed5e8` | `#a78bfa → #3dd6e8` |
| Amethyst | `#b895f6 → #e1c5ff` | `#b794f6 → #e2c6ff` |
| Azure | `#5dc8f5 → #8eb3ff` | `#5cc8f5 → #8fb3ff` |
| Ember | `#f2b65a → #ff8f63` | `#f2b65a → #ff8f63` |
| Sakura | `#f3a9c9 → #ffcfe2` | `#f3a8c8 → #ffd0e2` |
| Verdant | `#75dcb0 → #b4e48c` | `#74dcb0 → #b5e48c` |

The 1–2 point differences come from sampling a few pixels inside the gradient. The track measured `#120f1d` in every theme.

- **Live theme switch** (Settings, no reload): Spectrum `#a68cfa → #3fd6e9` became Ember `#f2b65a → #ff9063`. The bar repaints immediately.
- **Settings sheet** at a short height: its body scrolls with its own 10 px bar on the sheet's surface.
- **Reduced motion:** the wheel scrolls, End reaches the bottom, and `scroll-behavior` resolves to `auto` (unchanged rule).
- **Horizontal scroll on desktop** (1440×900): 0.
- **Touch emulation** at 320, 360, 375 and 390 px and on iPad Mini: the customization doesn't apply, and the native bar is unchanged.
  - Horizontal scroll is 0 at 360, 375 and 390 px and on tablet.
  - **At 320 px there are 5 px.** That's a problem inherited from `main`: the closing section's Star Border light passes the screen edge. It was diagnosed and fixed in CP03 (`fdbb8bb`, `Begin.css`, below 360 px only), which isn't on `main` yet. It isn't caused by this change, and it wasn't copied here to keep the scopes separate.

**Commands:**
| Check | Result |
| --- | --- |
| typecheck | ✅ |
| lint | ✅ |
| production build | ✅ (CSS 38.5 kB, 8.4 kB gzip; JS unchanged) |
| Vitest | ✅ 48/48 (the `main` suite) |
| Playwright, full suite, desktop/tablet/mobile | ✅ **47 passed, 0 failed, 4 skipped** (desktop-only nav and reflection tests on tablet and mobile, as on `main`) |
| safety scan / vendor integrity | ✅ / ✅ (8 React Bits originals unchanged) |

**Evidence** (`docs/reports/visual-polish-scrollbar/`):
- the six themes on desktop, mid-page;
- the settings sheet with its bar;
- before and after the live switch;
- 375 px touch emulation (native).

## Known limits
- **Safari and Firefox weren't run** (only Chromium is installed for Playwright); the routes follow each engine's documented support.
- **Overlay scrollbars:** on macOS with "Show scroll bars: when scrolling", styling `::-webkit-scrollbar` makes Chromium and Safari draw a permanent 10 px bar instead of the overlay one. That's inherent to any custom scrollbar in those engines.
- **320 px horizontal scroll** inherited from `main`, already fixed on the CP03 branch (see above).
- The CP03 screens (quiz, pause, preview) aren't on `main`. They'll get the same scrollbar when integrated, since it lives in global, theme-derived styles.
