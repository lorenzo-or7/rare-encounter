# Approved Visual System Report

Branch `integration/approved-features-v1`. Covers the integrated theme system (six palettes × light/dark), the scrollbar, the logotype, light mode on the quiz screens, and the Visual Answer Art System (AV-01).

## Theme compatibility (12 combinations)
| Area | Result | Evidence |
| --- | --- | --- |
| Landing, nav, settings, Lunar Slider, logotype | 12/12 captured and asserted by `lunar-slider.spec.ts` (theme and mode independent, dark default, persistence, legacy migration, no flash, keyboard, reduced motion) | captures from the Lunar branch: `visual-polish-lunar-slider/` |
| Scrollbar (Chromium, fine pointer) | 12/12, measured from pixels | `approved-features-integration/scrollbar/` |
| Preparation (Border Glow) | 12/12, desktop | `approved-features-integration/quiz-light-dark/prep-desktop-*` |
| Questions, pause, Start over, resume banner | Spectrum and Ember in both modes (light and dark) and on both devices (desktop and mobile) | `approved-features-integration/quiz-light-dark/` |

**Logotype.** The full logotype shows on the desktop nav in both modes, with the light-surface finish in light mode. The compact symbol stays on the condensed nav and on mobile, and the asset is unchanged from CI-02. **Known observation, not changed:** "RARE"'s white highlights read lighter on paper.

## Visual Answer Art System (AV-01, Design Locked v1)
| Approved requirement | Implementation |
| --- | --- |
| Hybrid Naturalism, Adaptive Art Ratio (4:3 scenes, 1:1 shapes, palettes and materials) | `QuestionArt.ratio` on the question. One ratio for all four images, applied by the frame. |
| Context-Aware Hybrid (Balanced Variety / Controlled Comparison) | `QuestionArt.comparison`, carried in the data to guide how assets are produced. Rendering is identical, so no option gets a visual advantage. |
| Compact 2×2 grid on desktop and mobile, including narrow screens | Kept at every width. Verified at 320, 360, 375 and 390 px: two rows, two columns, no horizontal scroll. |
| The whole card selectable; caption with the name only, aligned left; mark on the right | The `<button>` is the card. The caption row holds the name, then the mark. The accessible name is the caption only. |
| No tiny text | 16 px; 14 px under 360 px, the floor. Long names wrap between words or hyphenate in the page's language (the first capture broke "Mountain/s" at 320 px; fixed and recaptured). |
| Selected state, focus, Energy Pulse, Spring Press | Unchanged from CP02 (border, tint, filled mark, focus ring). |
| Stable skeleton, no layout shift | The frame owns the ratio. Loading, loaded and failed states share one box. |
| Neutral fallback; still understandable and choosable | A neutral surface with a small glyph, the name always printed. Tested by really failing every image in the browser (desktop, tablet, mobile), then choosing one. |
| Reduced motion | No skeleton breathing, no image fade. |
| No invented assets, no rewritten question text | None added or changed. The preview scenes are tagged 4:3 / Balanced Variety. |

Evidence: `approved-features-integration/answer-art/`:
- `mobile-answer-art-320/360/375/390`;
- the fallback on desktop, tablet and mobile;
- `desktop-quiz-photo`.

**Dependency:** the real image assets for the question bank don't exist yet. The system is ready for them, and `validateQuestionArt` checks each image question's data: the art spec, four options, and an image reference for each.

## Responsive and accessibility checks run
- **Widths:** 320, 360, 375 and 390 px (phone project sweeps), 768 (iPad Mini project), 1280 and 1440 (desktop project and the scrollbar run). **1024 px wasn't run as its own viewport.**
- **Keyboard paths:** the desktop project (preparation, quiz, settings, Lunar Slider), plus reduced-motion variants on all projects.
- **Not tested:** Safari and Firefox, because only Chromium is installed for Playwright. Nothing here is claimed for those engines.
