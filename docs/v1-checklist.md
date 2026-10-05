# Before v1 rolls out

Everything that stands between the current TestFlight build and something worth handing to people who did not help build it. Grouped by kind, not by priority — priority is Saverio's call.

Verified on device 2026-08-25: haptics land and read as pleasant rather than noisy, the screen transitions do the job of tying the screens together, and cold start is effectively instant.

---

## Bugs

- [x] **The volume numeral is clipped on its right edge.** Fixed, and the suspected cause was the actual one: RN applies `letterSpacing` after *every* character where CSS applies it *between* them, so a negatively-tracked box measures exactly one tracking unit narrower than its own ink — 2.88px at `hero`.

      Fixed in the type system, not on the screen. `trackingInset()` in `metrics.ts` gives that trailing unit back as right padding, every role carries its own value, and `AppText` applies it to all of them — so `volume`, `doseValue`, `screenTitle`, `rowTitle` and `cardTitle` are fixed too, having all been latently clipped by smaller amounts. It is scaled by the reader's text size in `useTrackingInset`, because RN scales `letterSpacing` but not padding: baked into the static style it would have been correct at 1× and short by the same proportion at every size above.

      **Small visual consequence:** two gaps widen to the values the design actually specifies. `ml` sits 1.9px further from the volume numeral and 0.8px further from a dose value, because those `marginLeft: 6` gaps were previously being eaten by ink overhanging its own box. Checked on device 2026-10-05 and accepted as they are.
- [x] **Volume entry is awkward to correct.** Done. The behaviour was already right — first keystroke replaces — so only the cue changed. An untouched value now renders inside a padded selection band with **no caret**. The caret appears and starts blinking on the first keystroke, once there is genuinely an insertion point. VoiceOver/TalkBack get the same information in words: the hint reads "Selected. Type to replace the volume".

      Note the field is the offscreen `TextInput` that summons the keypad, and it holds no text while the committed volume is on screen — so there is no UIKit selection to call `selectAll` on and none would be visible if there were. The band is drawn, which is the only place it can come from in this architecture.

      The first attempt used the `Text`'s own background, which looked right on Android and sat visibly low on iOS. A text background fills the *line box*, and a line box is never centred on its marks: at 72/78 Black digits iOS leaves **1.03px above and 25.42px below**, because it pins the space under the baseline to the font's descent and digits have no descenders to fill it. Android splits the slack and lands at 11.14/15.31, near enough to look deliberate. No line height fixes it — the descent belongs to the font.

      So the band is now positioned from `capBlockBox()`, the rect the digits actually occupy, and is symmetric about them on both platforms by construction. It is absolutely positioned, so it contributes nothing to layout — the value cannot be wrapped in a `View` to carry a background, because the row is baseline-aligned and a `View` has no text baseline. Padding is proportional to font size (7% horizontal, 10% vertical) so it holds up at large text sizes. Its width is measured with `onLayout`, the one part metrics cannot supply, so the band lands a frame after the digits — invisible behind a screen that takes ~390ms to arrive.

---

## Design

- [x] **A completed dose row fades away rather than receding.** Done. The surface now drops to the sunken chip tone (`colour.control`) instead of the page background: 1.20 against the card either scheme, against 1.06 before, so the row reads as *lowered* rather than deleted. Content dims to 62% on the content wrapper alone — never a group alpha over the card and its shadow, which is what composited badly on Android. Strike-through, the 6px slide and the geometry are all unchanged, so the list keeps its shape.

      One number to check on device: primary text at 62% over the chip tone is 4.36:1 in light mode. The row title is 20px/800 so its threshold is 3:1 and it is fine; the *alternative-dose caption* is 13.5px, where AA wants 4.5:1. Raising the dim to 64% gives 4.62:1 and is a one-token change if that caption matters more than the exact value. **Decided 2026-10-05: stays at 62%.** It reads fine on device.
- [x] **Remove the border on Sodium's colour bar.** Done, and the darkening transform is **not** the replacement — it was dropped. The bar is a decorative echo of the label, not information: the row's name and number carry the meaning, so the 3:1 rule does not apply to it. `edgeOnLight` is therefore gone from the model entirely — `BottleColour`, `SchemeColour`, `resolveBarColour`, `BarRow` — rather than left in place unused. Sodium ships at its published `#F0DADC`, flush and unbordered like every other bar, and no display transform replaces it.
- [x] **Wordmark in Figtree.** Done. The header mark is the one thing in the app not set in Nunito: Figtree 600 SemiBold, 16px, tracked +0.015em, secondary tone. It was first set at 20px, which sat 4pt off the 24pt page titles and read as a near-miss; 16 is far enough away to read as a different kind of thing. Only the 600 face is loaded, and `FIGTREE` in `metrics.ts` describes only that face, so naming any other Figtree weight throws at construction rather than rendering a synthesised bold.

      Size and tracking are still first-look values rather than considered ones, but they are now pure design changes — verified that editing either breaks no test.
- [x] **The top of the recipe card's shadow is sliced off.** Fixed. A ScrollView clips to its own bounds, so a card that starts flush with the scroller's top edge loses the top of its shadow. Faintly visible on Android; on iOS the clipped part is too faint to see. Home's recipe card had it, and so did Details' headline row. Settings and Units start with a text label, which casts no shadow.

      The fix is `space.belowHeader` (8pt), top padding inside the scroller, and it goes on **every** screen whose content starts directly under the header, not only the two that clipped. Otherwise Home's card and Settings' first label would sit 8pt apart again, and the shared content start line from `HEADER_BAND` is what stops pages jumping as you navigate. Recipes' brand-chip row takes the same token. Volume keeps its own deliberate 20pt.
- [x] **Text-only buttons a step heavier.** Done. "Done" (iOS headers) and "Details" (the dose screen's footer) move from 600 to 700 through a new `action` type role, `body` in everything but weight, so they still share a baseline with the sentence beside them. These are the only two text-only controls in the app.
- [x] **The clear-state check borrowed Lotus's potassium teal.** Fixed, reversing the decision in `v1-icon-follow-up.md`. A bottle colour used as a state reads as that bottle: next to Lotus's teal bar the check looked like part of the dose list, while the caution state beside it is a plain amber that belongs to no bottle. The teal also **failed contrast**: drawn at the mark's 80% mute it was 2.34:1 against the light page, under WCAG's 3:1 for meaningful graphics.

      `ok` is now **Leaf**, `#4D7A31` light / `#8DBE6A` dark, chosen on device 2026-10-05 over moss, sage and a hueless neutral. As drawn it is 3.30:1 light and 5.89:1 dark. At hue ~96° it is clear of the potassium teal (~175°), Apax's forest accent (~138°) and TONIK's mint (~133°). Apax's accent is the one that matters most, because it colours the "Details" link beside the check. `palette.test.ts` fails if `ok` drops under 3:1 as drawn, or becomes any bottle's or brand's colour again.
- [x] **"Details" always shows, even when the rounding is clean.** Decided 2026-10-05: keep it. `v1-icon-follow-up.md` raised the question.

- [x] **Settings button placement.** Done. Settings has left the footer for a slim header row on the dose screen — quiet `Lympha` wordmark left, sliders glyph right, 44pt target via `hitSlop` so the row stays slim and the glyph stays on the cards' content edge. The footer keeps status dot, rounding line and **Details** only.

      This gives the app a rule it was missing: **top-right is app chrome, bottom-right acts on this brew.** Every overlay screen already put its action top-right, so the dose screen was the exception rather than the precedent. Consequence handled: the Settings overlay now enters from the **top** rather than the bottom, because entry direction is what tells you which control you touched, so it has to follow the control.

      Separately, the footer is now a full-width tap target for Details — ~47pt band from padding plus an equal negative margin, so **nothing moves**. No card, border, chevron or resting background; "Details" stays the only coloured element and a brief dim confirms the press. That dim is on both platforms: this control has no surface, and a Material ripple either draws a rectangle where the design says there is nothing or spills the width of the screen (`Touchable`'s new `pressDim`, deliberately narrow — anything with a surface keeps the ripple).
- [x] **KONFLUX has no published label colour.** Done. A real value was agreed with the designer — `#BE4C7C` light / `#DA6FA6` dark — replacing the neutral-slate fallback. LYLAC was revised in the same pass (`#B098D8` / `#CBB6EA`) so the two sit together. Both clear the white card by a wider margin than Sodium's bordered bar, so neither needs an `edgeOnLight`.

---

## Copy

- [x] **Drop "millilitres" beneath the volume presets.** Done. The `ml` beside the value and the `"250 millilitres"` accessibility label on each preset both stay — the caption was the only redundant copy, and a screen reader still hears the unit.
- [x] **Drop "Adding your own concentrates is not in this version."** Done. The Bottles list now ends on the last brand row.
- [ ] **A full copywriting round.** Every string, read as a set rather than one at a time.

---

## Release

- [x] **App icon.** Done: the "(Ly)" mark on `#241E1C`. iOS uses an Icon Composer bundle (`assets/app.icon`); Android uses an adaptive icon with a flat background colour. Verified 2026-10-05 on iPhone 18 Pro / iOS 27 (light, dark, tinted) and Pixel 10 Pro / Android 17 (the circle mask). The compiled iOS asset is the layered `app.iconstack`, not the PNG fallback.

      On Android the brackets come within ~4dp of the circle's edge. They are inside the safe zone and not clipped, and accepted as-is for now. Android's themed (monochrome) icon checked on device and working.
- [x] **iOS 27 crashed on launch.** Fixed. Built with Xcode 27, the app trapped in UIKit's `_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`, because the iOS 27 SDK requires the UIScene lifecycle and SDK 57's template still generates an `AppDelegate` that owns its window. Fixed with Expo's official opt-in (expo/expo#46664): `expo` ≥ 57.0.23 plus `expo-build-properties` with `ios.enableSceneSupport: true`. **Remove the setting when moving to SDK 58**, which adopts scenes by default.
- [x] **Splash: no design, but the page's own colour.** Cold start is effectively instant, and Saverio's judgement on device is that a designed splash would be *more* jarring than none. Recorded as a decision so it is not mistaken for an oversight later. The native splash is still held until fonts and stored state are ready, which is what keeps the app from flashing a wrong volume.

      "No design" had been leaving it at Expo's default, which **flashed white in dark mode on Android**; iOS jumped from pure black to the app's near-black. The splash is now plain `background` for each scheme (`#FBF8F4` light, `#161211` dark), set on `expo-splash-screen` in `app.json`; `palette.test.ts` fails if those drift from `palette.ts`. On iOS that needs `plugins/withSplashBackground.js` too, because `expo-splash-screen` only wires its colour into the storyboard when there is an image (expo/expo#26491). The splash follows the *system* appearance, not the in-app setting: it is drawn before any JavaScript can read the stored preference.

---

## Explicitly not v1

- **A brand selector as its own screen, with a fact sheet per brand.** The
  "Bottles" section in Settings is a useful short description of what each brand
  is, and the idea is worth expanding into a real page — but the bottom of
  Settings is the wrong home for it.
  The UX rationale is that **recipe changes far more often than brand**. So the
  recipe picker stays as the frequent path, and brand selection grows into a
  separate full-page thing that can afford to explain itself. Too large for v1;
  1.1 or later.
- **Non-zero starting water.** Parked in the schema and out of v1, but the most
  likely thing to change the engine's shape later. Engine signatures should not
  assume zero TDS input.
