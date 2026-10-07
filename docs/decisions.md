# Decisions

The decisions behind Lympha, each with its reason. The code says *how*; this file
says *why*. A reversed decision is edited in place, saying what replaced it and when.
Rejected alternatives are listed so they are not proposed again.

Vendor numbers live in [`water-schema-v0.md`](water-schema-v0.md) (Lotus, data model)
and [`apax-lab-brief.md`](apax-lab-brief.md) (Apax). Outstanding work lives in
[`roadmap.md`](roadmap.md).

---

## Product

**The user and the moment.** One technically minded person at a kitchen counter at
6am, possibly in the dark, with a bottle in one hand and a phone in the other. They
own a scale and a TDS meter, and at that moment have no interest in chemistry. The
app is a task surface, measured in seconds to the answer. It does not persuade,
teach or onboard.

**Opens to the answer.** The last brand, recipe and volume survive a cold start, so
repeating yesterday's brew needs near-zero input.

**Honest rounding is the point of difference.** Drops are integers and doses are not.
Vendor calculators round silently and report the ideal: Lotus's Ultra Light is 19.6%
short on alkalinity at 1 L. Lympha shows what you actually get, and offers a nearby
volume that divides evenly. The gap should be nearly invisible when it is small, and
noticed when it is 20%.

**Scope.** iOS and Android phones (`supportsTablet: false`). Fully offline. No
accounts or sync.

**Anti-references**, for copy and design alike:

- vendor-calculator aesthetics: sliders, scatter plots, ppm charts, marketing copy
- dashboards: there is a dose to execute, not data to explore
- onboarding, tooltips, feature tours, wherever they stand between the user and the
  dose
- lab styling that implies the user must understand chemistry
- anything that needs a paragraph read before acting

These describe what the app is not *yet*, not a ban. *Revised 2026-10-07:* the list
read as never; a feature that earns its place can use any of these patterns. The
first is the ⓘ on the Rounding screen, which explains the flag limit on request.

---

## Platform and architecture

**Expo and React Native.** The UI is one bespoke visual language with no stock
controls restyled, the app has no native surface (no network, camera, background
work or push), and the dose engine is plain TypeScript.
- **Rejected: SwiftUI + Compose.** Twice the work.
- **Rejected: Flutter.** A Dart detour with no rendering need to justify it.
- **Rejected: PWA.** Fails 6am cold start, haptics, iOS offline install and store
  presence.

**One screen with three overlays, not a navigator.** Each secondary screen is a
full-bleed overlay over the Dose screen, which moves in sympathy as the overlay
enters. Layered `Animated` views make that trivial; a navigator makes it awkward.
Android back is wired by hand (`BackHandler` in `Overlay`).

**Zustand, persisted to AsyncStorage.** A small store with no provider.
- **Recipe is per brand.** Switching brand and back restores the recipe you had.
- **Concentrate units are per brand.** Lotus in drops alongside Apax in grams is a
  legitimate pairing. Both Apax ranges share one setting.
- **Water volume is global.** It belongs to the kettle, not the brand.
- **Default volume** is "Last used", or a pinned value for someone who always brews
  the same amount.

**The engine never imports React Native.** `src/engine` and `src/data` run under
Vitest in Node.

**UIScene lifecycle on iOS.** Xcode 27 builds of SDK 57's template trap at launch on
iOS 27 without it. Enabled with `expo-build-properties` → `ios.enableSceneSupport`,
which needs `expo` ≥ 57.0.23. Details in [`native-builds.md`](native-builds.md).

---

## Data

**Three layers.** Vendors state recipes in two incompatible ways: Apax is dose-first
("2.0 g/L TONIK"), Lotus is target-first ("50 ppm Mg"). The model separates:
1. what the recipe means: an optional target profile
2. what you add: component and amount at a reference volume
3. how you measure it: the dispenser, including its quantisation

The dispenser never lives inside a recipe. A dropper is `step: 1, allow_partial:
false`; a scale is `step: 0.01, allow_partial: true`; a sachet has the dropper's shape.

**Each component keeps its vendor's unit** (drops for Lotus, grams for Apax). Lotus
drops cannot be honestly converted to grams without data nobody publishes.

**The research overrides the design handoff's numbers**, which were written without
it:

| Handoff | Research | Resolution |
|---|---|---|
| Lotus recipes in drops per litre | Lotus is target-first: ppm as CaCO₃ | Store ppm, derive drops. Without an ideal to compare against, honest rounding is impossible at any volume but 1 L. |
| Fractional Lotus drop counts | Derived from ppm (Ultra Light: 2/2/0/2 at 1 L) | Use the schema. |
| Apax drops-first, grams = `exact × 0.3375` | Apax is grams-first; 1 g = 15 drops | Grams are the source. `0.3375` is wrong by ~5×. |
| Seven invented Apax recipes | Two ranges, 23 recipes | All shipped from the Apax data. |
| Rounding hidden "in grams mode" | The rule is the dispenser's `allow_partial` | Hidden when the dispenser allows partial doses. |
| Detail shows hardness, alkalinity, TDS | TDS is not derivable; Apax publishes no ions | See *Detail screen*. |
| Clean-volume search up to 900 ml away | — | 25% of the requested volume. See *Clean volume*. |

**Apax is two brands, not one brand with a KONFLUX toggle.** `apax-lab` is the current
range (four concentrates, 15 recipes, the default); `apax-lab-original` is the
pre-KONFLUX range (three concentrates, 8 recipes). A toggle would imply the current
range is the original plus KONFLUX, which is false:
- Apax re-balanced the other concentrates across the range.
- Martin Wölfl's recipe is the same in both and uses no KONFLUX.
- Light and Dark Roast swap character between ranges.
- Six current recipes have no original equivalent.

**Apax recipes are grouped**: process, roast, brew method, varietal, signature.
Fifteen is too many for a flat list.

**Vendor data ships as published.** A value that breaks the vendor's own pattern
ships unchanged and is recorded as an anomaly. The Apax 4.0 g/L total is checked
against an allowlist of its two documented exceptions, so a new exception fails
loudly. The app must agree with the vendor's table, wrong values included.

**The printed Apax card is not a source.** It disagrees with the archived
calculator. The original-range brand carries a note saying so.

**Lotus ingest.** The calculator's `Custom Recipe` is an all-zero UI sentinel and is
excluded. Recipes store the author, not Lotus's marketing copy.

**Modelled, not shipped:**
- **Third Wave Water.** Sachets don't divide, so most volumes have no honest dose.
- **Barista Hustle.** Numbers unverified.
- **Apax limited editions.** How they combine with the standard range is
  unconfirmed.

---

## Dose behaviour

**A zero dose is omitted, not shown as 0.** The header's bar cluster omits it too,
so bar count equals bottle count.

**Rounding messaging appears only where rounding exists.** When the dispenser allows
partial doses (grams), the rounding line and the nudge are hidden.

**Units follow magnitude, with a per-brand override.** Apax at 1 L is about 60
drops, where grams are saner; at 200 ml it is about 12, where drops are fine. The
override offers drops or grams, each previewing the same dose. Millilitres would
duplicate grams.

**Clean volume.**
- Steps outward in 25 ml increments, never below 150 ml.
- Searches both directions, nearer first. It must not favour brewing more.
- A volume qualifies when every bottle is within 0.06 of a whole unit and none is
  under half a unit.
- Range: 25% of the requested volume. A flat 900 ml is sensible from a litre and
  absurd from a cup, where it suggests a different drink.
- Stays in the unit in use.
- When nothing qualifies, says so. It never invents a suggestion.

**Volume nudge.** Shown when a bottle would round to zero, or when the worst gap
exceeds "Flag rounding above" (default 10%). It uses the dose-row anatomy with an
amber bar, so a warning reads as part of the same family as a dose.

**Detail screen.**
- A hero card with the worst gap, naming the figure it quotes.
- Asked versus delivered for every bottle, which works for every brand.
- Hardness and alkalinity only where the brand publishes ion data.
- No TDS.
- ppm printed to two decimals, so the printed numbers reproduce the headline. A
  test asserts it.

**Marking a bottle as added.** Tapping a dose row toggles it, with a light haptic.
Changing volume, brand or recipe clears all marks. A done row recedes rather than
disappearing, so the list keeps its shape:
- Its surface takes the sunken chip tone.
- Its content dims to 62%, on the content wrapper only. A group alpha over the card
  and its shadow composites badly on Android.
- It is struck through and slides 6px.

62% puts the 13.5px alternative-dose caption at 4.36:1 in light mode, just under AA
(decided 2026-10-05: it reads fine on device).

**Volume entry uses the system numeric keypad**, via an offscreen `TextInput`.
- **Rejected: a custom keypad grid.** More to maintain, and it loses haptics, key
  repeat and accessibility.
- **The first keystroke replaces the value.** An untouched value sits in a
  selection band with no caret; the caret appears with the first keystroke.
- **Screen readers** hear "Selected. Type to replace the volume".
- **The band is positioned from the digits' cap box** (`capBlockBox()`), not drawn
  as a text background. A text background fills the line box, which iOS does not
  centre on digits: at 72pt Black it leaves 1px above and 25px below.

---

## Visual design

**One visual language on both platforms; only mechanics differ.**

| | iOS | Android |
|---|---|---|
| Dismiss | "Done", top right | Back arrow, system and predictive back |
| Press feedback | Highlight/opacity | Material ripple, except surfaceless controls |
| Depth | Shadow | `elevation` |

Android keeps the soft corner radii: shape is part of the brand.

**Bottle colour is the identity system.** Bars use each brand's published label
colours, so the user matches the bottle in their hand without reading.
1. Colour never carries meaning alone: name and number are always present.
2. Colour appears only as a flush 12px leading-edge bar. It is never a fill, tint
   or text colour, so contrast holds whatever colours a future brand ships. An inset
   bar reads too quietly.
3. Light and dark use different values of the same hue, with the same geometry.
4. **No bar has a border, however pale.** The bar is decorative, because the name and
   number carry the meaning. The 3:1 non-text contrast rule does not apply, so Sodium
   ships flush at its published `#F0DADC`.
5. Each brand has a separate text-safe **accent** for links and active states. A bar
   colour may fail as text: Apax's mint fails AA on white.

**KONFLUX and LYLAC colours** were agreed with the designer, not taken from the
handoff: KONFLUX `#BE4C7C` / `#DA6FA6`, LYLAC `#B098D8` / `#CBB6EA` (light / dark).
Live values are in `src/data/apax.ts`.

**Status colours belong to no bottle.** A bottle colour used as a state reads as that
bottle.
- **Caution** is a plain amber.
- **Clear** is Leaf, `#4D7A31` light / `#8DBE6A` dark. It is clear of the potassium
  teal, Apax's accent and TONIK's mint. It replaced Lotus's potassium teal
  (2026-10-05), which also failed 3:1 in light mode.

`palette.test.ts` fails if `ok` drops below 3:1 as drawn, or matches any bottle or
brand colour.

**Problems have more presence than non-problems.** The clear state is muted; caution
is not.

**Header: the wordmark alone.** "Lympha" in Figtree 600, 16px, +0.015em, secondary
tone: the only text not in Nunito. 16px is far enough from the 24pt page titles to
read as a different kind of thing. **Rejected: a `(Ly)` mark beside the wordmark**
(2026-10-05). The header band has room for a ~24pt glyph without moving anything.

**Top-right is app chrome; bottom-right acts on this brew.** Settings is a gear at the
top right of the dose screen, matching every overlay's top-right action. The footer
holds only the status, the rounding line and **Details**.

**The footer is one full-width tap target for Details**, with no surface: no card,
border, chevron or background. A brief dim confirms the press on both platforms. A
ripple on a surfaceless control either draws a rectangle the design doesn't have or
spans the screen.

**"Details" always shows**, including when the rounding is clean (decided 2026-10-05).

**Text-only buttons are weight 700**, using the `action` role. It is `body` with a
heavier weight, so it keeps `body`'s baseline.

**Content starts 8pt below the header on every screen** (`space.belowHeader`). A
ScrollView clips to its bounds, so a card flush with its top loses the top of its
shadow. Applying it everywhere keeps a shared content start line across screens.

**No designed splash.** Cold start is effectively instant, and a designed splash
would be more jarring than none. The splash is each scheme's page background, and
follows the *system* appearance because it draws before JavaScript runs. It is held
until fonts and stored state are ready, so a default volume never flashes.

**App icon: `(Ly)` on `#241E1C`.**
- **iOS:** an Icon Composer bundle (`assets/app.icon`) with light, dark and tinted
  variants.
- **Android:** an adaptive icon on a flat colour, with a monochrome layer for themed
  icons. The brackets sit ~4dp from the circle mask, inside the safe zone: accepted.

---

## Typography

**Nunito throughout**, apart from the wordmark. It has rounded terminals and very
heavy numerals. **Rejected: monospace anywhere.** Nunito's figures are tabular by
default; `onum` is never enabled.

**CSS type values are translated, not ported.**
- Each role is a component fixing family, size, line height and tracking.
- Line height never goes below the font's floor; tight rhythm comes from padding
  computed from font metrics (`inkInsets`).
- Tracking is converted to px per role.
- `trackingInset` restores the trailing tracking unit as right padding, because RN
  applies `letterSpacing` after every character, not between them.
- Values derived from the type scale are read at the user's text size.

The platform facts behind these are in `AGENTS.md`.

---

## Motion

**A screen enters from the direction of the control that opens it.**

| Screen | Control | Enters from |
|---|---|---|
| Brand + recipe | Header card, top | Top |
| Volume | "Edit", mid-screen right | Right |
| Settings | Gear, top right | Top |

**Timings:**
- Transitions take 380–400ms on `cubic-bezier(.22, 1, .36, 1)`. The dose screen
  shifts 14–16px on the same axis and scales to 0.97.
- A recomputed value pulses for 150ms.
- Bar colours morph over 350ms on a brand or recipe change.
- The nudge animates its height.

---

## Icons

**Phosphor, behind one wrapper** (`src/design/primitives/Icon.tsx`). Nothing else
imports the library.

**Six usages, seven glyphs, and no more without a design decision.** The design is
text-forward, so every glyph competes with the type and the bar marks.

| Usage | Glyph |
|---|---|
| Settings | `GearSix`: the screen is preferences. Sliders suggest adjusting values. |
| Recipe selector | `CaretDown` |
| Settings rows that open a screen | `CaretRight` |
| Footer, caution | `Info`. `WarningCircle` would shout over gentle copy. |
| Footer, clear | `CheckCircle`: the same silhouette as `Info`, so the states swap without the row shifting. |
| Selected recipe | `Check`, left of the title. The bar marks own the right edge. |
| Rounded-up values on Detail | `ArrowUp`, not a caret: a caret reads as expand/collapse. |

**Weights: chrome is `bold`, status is `fill`, nothing is `duotone`.**
- Phosphor's `regular` is a hairline beside type this heavy.
- Solid shapes already mean the bar marks, so `fill` is reserved for status.
- Duotone renders as a washed-out ghost on the cream background.

**Every icon is decorative** and hidden from screen readers. The meaning is on the
surrounding control or adjacent text.

**No icons on:**
- the volume screen
- the leading edge of list rows
- the recipe bar marks, which encode count and colour and are hand-drawn

**Rejected:**
- **`CaretCircleDown` for the recipe selector.** A third container in one row, and
  it implies only the caret is tappable.
- **`ArrowFatLineUp` on Detail.** A "boost" glyph that blurs at 14–16px and makes a
  quiet readout look alarmed.

---

## Copy

**Settled so far:**
- **No caption under the volume presets.** The `ml` beside the value suffices, and
  each preset is announced as "250 millilitres".
- **The Bottles list ends on the last brand.** It has no footnote about features not
  yet built.
- **The original Apax range is labelled "Apax Lab (Original 3-drop)"**, with the note
  *"Taken from the latest version of the official Apax Lab calculator. Differs
  slightly from supplied card."*
