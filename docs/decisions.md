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
volume that comes out exact. The gap should be nearly invisible when it is small, and
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
first is the ⓘ on the Rounding screen, which explains the limit on request.

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

**Bottom sheets are the platform's own**, through `@expo/ui`: SwiftUI's `.sheet` on
iOS, Material 3's `ModalBottomSheet` on Android (`NativeSheet`). Each brings the drag
handle, scrim, dismiss gestures and screen-reader modality its platform users
expect, which a sheet drawn in React Native would only imitate.

- **iOS: tinted system glass, SwiftUI text.** On iOS 26 and 27 a short sheet
  floats inset on Liquid Glass, whose translucency the reader sets (iOS 27:
  Settings ▸ Appearance ▸ Liquid Glass). A translucent `presentationBackground`
  tints the glass and an opaque one replaces it (measured on iOS 27.0), so the
  sheet takes the card colour at 50%: steadier for a paragraph than the default
  glass, while still following the reader's setting. Its text uses the
  hierarchical styles drawn for glass. iOS 27 added no sheet API or guidance
  beyond the retuned material. The text is SwiftUI, in Nunito
  via `swiftUIFont`, because hosted React Native content cannot see the floating
  sheet's width and wraps against the wrong one.
- **Android: the card colour, React Native text.** Material's sheet is opaque and
  edge to edge, so it takes `colour.card` and the app's own type components.

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
| --- | --- | --- |
| Lotus recipes in drops per litre | Lotus is target-first: ppm as CaCO₃ | Store ppm, derive drops. Without an ideal to compare against, honest rounding is impossible at any volume but 1 L. |
| Fractional Lotus drop counts | Derived from ppm (Ultra Light: 2/2/0/2 at 1 L) | Use the schema. |
| Apax drops-first, grams = `exact × 0.3375` | Apax is grams-first; 1 g = 15 drops | Grams are the source. `0.3375` is wrong by ~5×. |
| Seven invented Apax recipes | Two ranges, 23 recipes | All shipped from the Apax data. |
| Rounding hidden "in grams mode" | The rule is the dispenser's `allow_partial` | Hidden when the dispenser allows partial doses. |
| Detail shows hardness, alkalinity, TDS | TDS is not derivable; Apax publishes no ions | See *Rounding screen*. |
| Exact-volume search up to 900 ml away | — | 25% of the requested volume. See *Exact volume*. |

**Apax is two brands, not one brand with a KONFLUX toggle.** `apax-lab-original` is
the three-bottle range (TONIK, JAMM, LYLAC; 8 recipes, the default); `apax-lab` is
the four-bottle range with KONFLUX (15 recipes). A toggle would imply the KONFLUX
range is the three-bottle range plus KONFLUX, which is false:

- Apax re-balanced the other concentrates across the range.
- Martin Wölfl's recipe is the same in both and uses no KONFLUX.
- Light and Dark Roast swap character between ranges.
- Six KONFLUX-range recipes have no three-bottle equivalent.

*Revised 2026-10-07:* the KONFLUX range was the default. The three-bottle range is
the default and comes first because it is the base set, and the chip that adds
KONFLUX reads as an addition to it. The IDs keep the research's names: they key
persisted state. On-screen names are under *Copy*.

**Apax recipes are grouped**: process, roast, brew method, varietal, barista.
Fifteen is too many for a flat list. The grouping is ours, made with the recipe
data (`src/data/sources/apax-lab.json`); Apax publishes none.

**Vendor data ships as published.** A value that breaks the vendor's own pattern
ships unchanged and is recorded as an anomaly. The Apax 4.0 g/L total is checked
against an allowlist of its two documented exceptions, so a new exception fails
loudly. The app must agree with the vendor's table, wrong values included.

**The printed Apax card is not a source.** It disagrees with the archived
calculator. The three-bottle range carries a note saying so.

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

**Rounding bands.** Every rounding message and colour comes from one band
(`band()` in `src/format/rounding.ts`), measured on the headline figure:

| Band | Off by | Colour |
| --- | --- | --- |
| On target | under 0.5% | Clear |
| Close | up to the limit (default 10%) | Clear |
| Off | above the limit, up to and including a third | Caution |
| Far off | more than a third | Error |
| Missing | a bottle rounds to zero | Error |

- **The headline figure** is, for Lotus, the larger of hardness and alkalinity; for
  Apax, the largest bottle. Each water figure combines bottles, so it is
  never further out than the furthest bottle feeding it, and is usually nearer.
- **Far off is fixed at a third**, not relative to the limit. The limit is a
  preference about when to be told; a third off is a fact about the water: it no
  longer matches the recipe. The limit's ceiling is 20%, so the two never meet.
- **Far off and Missing share a severity.** Both are a different water, not a less
  accurate one.

**Exact volume.**

- Steps outward in 25 ml increments, never below 150 ml.
- Searches both directions, nearer first. It must not favour brewing more.
- A volume qualifies when every bottle is within 0.06 of a whole unit and none is
  under half a unit.
- Range: 25% of the requested volume. A flat 900 ml is sensible from a litre and
  absurd from a cup, where it suggests a different drink.
- Stays in the unit in use.
- When nothing qualifies, says so. It never invents a suggestion.

**Volume nudge.** Shown in the Off, Far off and Missing bands. It uses the dose-row
anatomy with a bar in the band's colour, so a warning reads as part of the same
family as a dose.

**Rounding screen** (opened by "Details").

- A hero card with the headline figure, naming what it quotes. A percentage only
  where there is something to measure: On target and Missing show words.
- Target, you get and off by for every bottle, which works for every brand.
- Hardness and alkalinity only where the brand publishes ion data, in a table above
  the bottles, so the table the headline quotes sits directly under it.
- No TDS.
- **"Off by" carries the emphasis**, bold and in the band's colour; the two amounts
  are regular weight. The difference is the answer, and the amounts are the working.
- **No arrows** (removed 2026-10-07). The sign on "Off by" already shows direction.
- **Number columns are right-aligned**, headings included, with a real minus (−):
  Nunito draws the minus, plus and digits at one width, and the hyphen narrower.
- **On Lotus, bottle rows are never amber**: the limit applies to the water, so only
  Hardness and Alkalinity take band colours. A bottle 14% over in water 2% under is
  not a problem. A bottle that rounds to zero is still red. Apax bottle rows take
  band colours, since there the bottles are what the limit applies to.
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
| --- | --- | --- |
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

- **Caution** is a plain amber: the Off band.
- **Error** is vermilion, `#B8321A` light / `#EF6A4A` dark: Far off and Missing. It
  clears 4.5:1 in both schemes, so it also serves as text. Vermilion rather than
  crimson keeps it clear of Lotus's Magnesium and accent (`#B8404F`).
- **Clear** is Leaf, `#4D7A31` light / `#8DBE6A` dark. It is clear of the potassium
  teal, Apax's accent and TONIK's mint. It replaced Lotus's potassium teal
  (2026-10-05), which also failed 3:1 in light mode.

`palette.test.ts` fails if `ok` drops below 3:1 as drawn, `error` below 4.5:1, or
any status colour matches a bottle or brand colour.

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

**"Details" always shows**, including on target (decided 2026-10-05).

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
| --- | --- | --- |
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

**Five usages, six glyphs, and no more without a design decision.** The design is
text-forward, so every glyph competes with the type and the bar marks.

| Usage | Glyph |
| --- | --- |
| Settings | `GearSix`: the screen is preferences. Sliders suggest adjusting values. |
| Recipe selector | `CaretDown` |
| Settings rows that open a screen | `CaretRight` |
| Footer, Off to Missing | `Info`. `WarningCircle` would shout over gentle copy. |
| Footer, clear | `CheckCircle`: the same silhouette as `Info`, so the states swap without the row shifting. |
| Selected recipe | `Check`, left of the title. The bar marks own the right edge. |

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

---

## Copy

### Voice

- **Labels, status lines, buttons, titles and setting names are plain**: short, matter
  of fact, descriptive.
- **Anything written as a sentence is friendly**: calm, explanatory, never overselling.
  The reference is James Hoffmann: understated, not pretentious.
- **Don't explain what users already know.** They own the bottles and know drops come
  whole. Say what a number means, not how rounding works.
- **No messages about what the app can't do, and no advice on how to work.** Plain
  facts are fine.
- **No ownership of defaults**: "the 10% limit", not "your 10% limit", since the user
  may never have touched the setting.
- **Don't repeat what is already on screen.** If a title says it, the body doesn't.
- **British spelling** (millilitres, colour, -ise), with no regional idioms.
- **Contractions** are fine in sentences.
- **No "I" or "we"**, no humour and no em dashes.
- **Apostrophes are typographic** (’), never `'`.
- **Accessibility hints are third-person verbs** ("Changes the amount of water"),
  Apple's convention. A selection is an accessibility *state*, never hint text.

### Glossary

These words, with these meanings, everywhere.

| Term | Meaning | Users see it as |
| --- | --- | --- |
| Brand | The maker: Lotus Coffee Products, Apax Lab. | Brand chips, Settings |
| Range | One set of bottles from a brand. Never described as old, new or original. | `Apax`, `Apax [K]` |
| Bottle | One concentrate you add from, for every brand. | Dose rows, "3 bottles missing" |
| Recipe | A named, fixed list of amounts per litre, from a brand or an author. | Recipe card, Recipe screen |
| Author | The person or brand behind a recipe. Internal. | The name under each Lotus recipe |
| Water | How much distilled water is being made, in ml. | Volume card, Water screen |
| Target | The amount a recipe calls for at this volume, per bottle and, for Lotus, for hardness and alkalinity. Never rounded. | "14% over target", Target column |
| Dose | What is actually added: the target rounded to whole drops, or to 0.01 g. Internal. | The amounts in the dose rows |
| On target | Off by less than 0.5%. Not the same as exact. | "On target" |
| Off by | How far a dose, or a water figure, is from its target, as a percentage. | Status line, Rounding screen |
| Headline figure | The off-by the status line and Rounding screen report. Lotus: the larger of hardness and alkalinity. Apax: the largest bottle. | "14% over target on alkalinity" |
| Limit | The Rounding limit setting, `{t}`, default 10%. On Lotus it applies to hardness and alkalinity; on Apax, to each bottle. | "the 10% limit" |
| Rounding | Everything about the difference between targets and doses. Drops only: grams are treated as exact. | Rounding screen |
| Exact volume | A nearby volume where every bottle comes out within 0.06 of a whole drop. See *Exact volume*. | "400 ml is exact" |

**Words are judged in context, not banned.** A word that read badly in one
string can be right in another, so there is no list of forbidden words. Two
judgements stand behind the current copy:
- **"Target" heads the Rounding screen's first column**, not "Asked", because the
  status line says "under target": the table defines the word the home screen
  uses. "Exact volume" follows from the suggestion's own words, "400 ml is exact".
- **"Original"** is not used for the three-bottle Apax range, because it implies
  the KONFLUX range superseded it.
- **"Flag" and "gap"** read as office language in the limit's name and
  explanation, which say "Rounding limit", "off target" and "surfaces it".
- **"0%" and "100%"** are not shown as the Rounding headline. "0% on target" read as
  none of it on target, and a big "100%" read as a good score.

Identifiers and comments use the glossary's terms (`target`, `exactVolume`,
`ON_TARGET`), so code and screen describe the same thing in the same words.

### Contested strings

**Apax ranges are `Apax` and `Apax [K]`.** The three-bottle range is plain `Apax`
and comes first; `[K]` is Apax's own shorthand for the KONFLUX addition, so the
brackets stay square. Screen readers hear "Apax with KONFLUX" (`spokenShortName`),
because brackets are read aloud. Long names, in Settings ▸ Bottles: "Apax Lab" and
"Apax Lab with KONFLUX". "Original" is retired: it implies the KONFLUX range
superseded it. The note *"From Apax Lab’s last three-bottle calculator, so a few
amounts differ slightly from the card that comes with the set."* sits under the
`Apax` chip only.

**One Apax Lab unit setting and screen** for both ranges: same bottles, same scale.
The unit screen is titled "Apax Lab".

**"By barista"** heads the barista recipes, last in the list.

**Close and Off share their words** (`14% over target`). The status mark's colour
carries the difference, so a large gap is noticed without the sentence raising its
voice. **Far off is longer** (`…at this volume`), which makes it louder and names
the volume as the cause, as the Missing line does.

**The Rounding screen is titled "Rounding"**, naming its subject as Water, Recipe
and Settings do. The footer link stays "Details".

**The headline names what it quotes**: `over target on alkalinity`, `on TONIK`.
Figures showing the same signed whole percentage are tied and all named: two
joined with "and", three or more as "{k} bottles".

**The Rounding headline is words at the extremes**, in the status line's own words,
at Large Title size (`headlineWords`) because a word is far wider than a figure:
`On target`, `No {bottle}`, `{n} bottles missing`. Between them it is `{n}%` with
`{under|over} target on {label}`, the label wrapping beside the figure, not under
it, until accessibility text sizes leave no room.

**Every band has a headline sentence**, because the card always needs a body. On
target is *"That’s as close as drops get."* for both brands, since on target is
not exact. Missing, one bottle: *"It rounds to zero drops at this volume, so none
goes in."*, since the headline names it. Several: *"{A}, {B} and {C} round to zero
drops at this volume."* Far off states the consequence: *"…enough that the water no longer
matches the recipe."*

**The blend note** (*"Alkalinity comes from Sodium and Potassium together, so it’s
closer to target than Potassium alone."*) explains a Lotus table where a bottle is
further out than the headline. It is shown only when that is visibly so, and never
with a bottle missing. The bottles are read from the ion data, not hard-coded.
"Cancel out" is retired: the bottles don't oppose each other.

**The limit ⓘ** on the Rounding card, in every band, opens a short sheet titled
`{t}% limit`. It says what the limit applies to, which differs by brand:

- Lotus: *"Hardness and alkalinity can each be up to {t}% off target before Lympha
  surfaces it. You can change this in Settings, under Rounding limit."*
- Apax: *"Each bottle can be up to {t}% off target before Lympha surfaces it. You
  can change this in Settings, under Rounding limit."*

It names the setting by its label, so the two must stay in sync. The setting is
**"Rounding limit"**, *"How far off target is still close enough."*, which names
neither water nor bottles so it is true for both brands.

**The suggestion card is plain**, since it appears mid-task in a narrow card: a
title, then at most the band's sentence and either "{ml} ml is exact." or "No exact
volume nearby."

**The drops preview on the unit screen** carries its bottle's miss (`3 drops of
TONIK for 350 ml, 14% over`), so the cost of choosing drops is visible where the
choice is made.

**Removed, and not to be re-added:**

- The unit screen's "Drops are the least precise" callout: advice on how to work.
- Apax's "lists what's in each bottle but not how much" note on the Rounding
  screen: a message about what the app can't do.
- The suggestion card's "Too little to measure in drops.": it repeated the title.
- A caption under the volume presets. The `ml` beside the value suffices, and each
  preset is announced as "250 millilitres".
- A footnote at the end of the Bottles list about brands not yet supported.
