# Handoff: Lympha — coffee brewing water app

## Overview

Lympha calculates mineral concentrate doses for brewing water. The user picks a
brand and recipe, enters a water volume, and the app tells them how many drops
(or grams) of each concentrate bottle to add. The core use case is 6am, half
awake, wet hands, phone on a counter: read a number, squeeze a bottle, move on.

The organising principle throughout is **honest rounding**. Drops are whole
numbers, so the achievable dose is almost never exactly the recipe. Lympha
always shows what you will actually get, and offers a nearby volume that divides
evenly rather than silently rounding.

Two brands are modelled:

- **Lotus Water** — four bottles (Magnesium, Calcium, Sodium, Potassium), dosed in drops.
- **Apax Lab** — three concentrates (TONIK, JAMM, LYLAC), dosed in drops or grams.

Third Wave Water (sachets) was explicitly cut from v1 — sachets don't divide, so
there is no honest dose for an arbitrary volume.

## About the design files

The files in this bundle are **design references written in HTML** — prototypes
that show intended look and behaviour. They are not production code to copy.
The task is to **recreate these designs in the target codebase's environment**
(React Native / Expo was the assumed target, but any environment is fine) using
its established patterns, component library and navigation. If no environment
exists yet, pick the most appropriate one and implement the designs there.

Notably, the HTML uses inline styles exclusively and a small custom runtime
(`support.js`). Neither should be carried across — extract the *values* and the
*behaviour*, not the markup.

## Fidelity

**High fidelity.** Colours, type scale, spacing, radii and copy are final and
should be reproduced precisely. Motion is specified but deliberately simple; the
directional rules under "Interactions" matter more than the exact timings.

## Platforms

iOS and Android share **one visual language**. Nothing in this UI is a stock
control restyled, so a second visual identity would be two things to maintain.
What differs on Android is mechanics only:

| Concern | iOS | Android |
|---|---|---|
| Dismiss affordance | "Done" text button, top right | Back arrow + system/predictive back |
| Press feedback | Highlight / opacity | Material ripple |
| Number entry | System numeric keypad | Material numeric keypad (52dp keys, 16dp radius, container tint, no per-key shadow) |
| Selection chips | Filled pill, tinted when off | Material selection chip, 12dp radius, 1px outline when off |
| Switch | iOS switch (52×31, 25px knob) | Material switch (52×32 track, 24px knob with check) |
| Buttons | 44–58px pills | 48dp minimum, 24dp radius |
| Elevation | `0 3px 14px rgba(70,45,30,.06)` | `0 2px 6px rgba(70,45,30,.07)` |
| Volume screen | Full-screen push from right | Full-screen destination |

Soft corner radii are kept on Android deliberately — the radius is part of the
brand, and Material 3 treats shape as a brand axis.

---

## Screens

### 1. Dose (home)

**Purpose.** The screen the app opens on, restored to the last used brand,
recipe and volume. Everything needed to make water is visible without scrolling
or tapping.

**Layout.** Vertical stack, 18px horizontal padding, 14px gap between blocks,
60px top inset (iOS) / 16px (Android, below the system status bar).

**Components, top to bottom:**

1. **Recipe header** — one card, one tap target, opens the combined brand +
   recipe screen.
   - Card: `#FFF` light / `#211C1A` dark, radius 22px, padding 14px 16px.
   - Left: a cluster of colour bars, one per bottle in the current recipe
     (5×18px, radius 3px, 3px gap). This doubles as a bottle count — a
     three-bottle recipe shows three bars.
   - Title 17px/800, subtitle 13.5px/600 in the secondary token.
   - Right: `▾` chevron.
2. **Volume card** — radius 22px, padding 18px 20px, baseline-aligned row.
   - Label "Water" 13.5px/700 secondary.
   - Value 54px/900, letter-spacing −0.035em, line-height 0.88, tabular numerals.
   - Unit "ml" 19px/700 secondary.
   - "Edit" pill on the right: height 44px (48dp Android), radius 22px,
     `#F1E9E2` light / `#332B28` dark.
3. **Dose rows** — one per bottle, 9px gap.
   - Row: radius 20px, `overflow: hidden`, `display: flex; align-items: stretch`.
   - **Colour bar: a flush 12px-wide full-height block on the leading edge.**
     This is the identity system — see "Bottle colour" below. It must touch the
     card edge; an inset bar was tested and reads too quietly.
   - Content: padding 18px 20px. Name 20px/800, letter-spacing −0.01em.
     Optional subtitle 13.5px/600 secondary (the same dose in the other unit).
   - Value 40px/900, tabular numerals; unit label 13px/700 secondary.
4. **Rounding line** — pinned to the bottom, 8px horizontal padding.
   - 9px dot: green `#78A566` when rounding is under the threshold, amber
     `#D99A4E` when over or when a bottle would round to zero.
   - Text 14.5px/600 secondary, e.g. "Rounds clean — 3% under target".
   - Trailing "Details" link in the brand accent.

### 2. Volume

**Purpose.** Enter or pick the water volume.

**Entry animation: pushes in from the right** (the Edit control that opens it
sits mid-screen).

**Layout.** Full-screen. Big value at top (72px/900, tabular, with a 3px accent
caret bar that blinks at 550ms), preset row, optional nudge card, keypad pinned
to the bottom.

- **Presets**: 250 / 350 / 500 / 1000 ml, four equal pills, height 52px,
  radius 16px (24dp Android). Selected preset inverts to the foreground colour.
- **Keypad**: the **system numeric keypad**, not a bespoke grid. A custom grid
  was built and rejected — it added maintenance and lost haptics, key repeat and
  accessibility for nothing.
- **Nudge card** (see below) appears above the keypad, animating its height.

### 3. Volume nudge (state, not a screen)

Appears inside the volume screen when either:
- a bottle would round to **zero** at this volume, or
- the worst per-mineral gap exceeds the flag threshold (default 10%).

It reuses the **dose row anatomy** — same radius, same flush 12px bar — with an
amber `#D99A4E` bar, so a warning is visibly the same family as a dose.

- Title 17px/800, e.g. "Potassium would round to zero".
- Body 14.5px/600 secondary: what happens at this volume, and the nearest volume
  that divides evenly.
- Primary button "Use 300 ml", secondary "Keep 250".
- **If no nearby volume fixes it**, the card says so plainly and offers only a
  dismiss ("Got it"). It never invents a suggestion.

### 4. Brand + recipe (one screen)

**Purpose.** Choose brand and recipe in one place. These were separate screens
early on and merged — brand alone is never the user's goal.

**Entry animation: drops down from the top** (the header that opens it is at the
top of the dose screen).

- **Brand chips** in a horizontal row: filled + inverted when selected. Each
  chip carries a mini colour cluster (4×15px bars) so the palette identifies the
  brand before the name is read.
- **Recipe rows**: name 18px/800, optional subtitle ("Last used yesterday",
  "Rounds hard below 1400 ml" in the warning token). Right-aligned bar cluster
  (5×20px) showing that recipe's bottles — Apax's "Light roasted" shows two.
- Selected recipe carries a 2px outline in the foreground colour.
- Footer note: "Switching brand keeps your volume."

### 5. Settings

**Purpose.** Appearance, units, brewing defaults, bottles. Deliberately short —
anything longer is a sign the main screen is under-decided.

**Entry animation: rises from the bottom** (the entry point sits bottom-right).

Sections, each with a 13.5px/800 secondary uppercase header:

- **APPEARANCE** — segmented control: System / Light / Dark. Default System.
- **UNITS** — Water (millilitres) and Concentrate. Concentrate units are
  **per brand**, not global: Lotus in drops while Apax is in grams is a
  legitimate pairing, and one global switch would force a wrong answer on one of
  them. Water volume stays global — that's the kettle, not the brand.
- **BREWING** — Default volume (Last used); Flag rounding above (10%); Suggest a
  cleaner volume (toggle, on).
- **BOTTLES** — one row per brand with its colour cluster; "Add a brand".

### 6. Unit override

Reached from Settings › Units › Concentrate. Two options only — **drops** and
**grams** — each previewing the *same dose* in that unit so the choice is made
against real numbers. Millilitres was removed as redundant with grams.

Includes an amber callout, in the dose-row anatomy: "Drops are the least
precise — dropper size varies between bottles. If you own a scale, grams will
get you closer to the recipe than counting will." (Flagged by the client as
under review; keep the callout pattern regardless of whether this copy ships.)

### 7. Rounding detail ("What you'll get")

Reached from "Details" on the dose screen.

- Hero card in dose-row anatomy with an amber bar: worst gap as a large
  percentage (44px/900) plus a plain-language explanation.
- A three-row table: Measure / Asked / Get, for Hardness, Alkalinity, TDS.
  The offending row's "Get" value is in the warning colour.
- A closing card offering the clean volume, with "Switch to 1400 ml" and
  "Brew it".

> Note from the client: the exact chemistry this screen displays is still to be
> confirmed against what is actually computable. Treat the *layout* as final and
> the *measures shown* as provisional.

---

## Bottle colour system

Each brand's own published label colours identify its bottles, so the user
matches the sticker in their hand rather than reading a word. Rules:

1. **Colour never carries meaning alone.** Name and number are always present —
   for colour-blind users and for very pale labels.
2. **Colour appears as a flush 12px edge bar, never as a fill or a tint.** No
   coloured row backgrounds and no coloured body text: contrast stays a solved
   problem regardless of what colour a future brand ships.
3. **Light and dark use different values of the same hue** (dark mode lifts
   saturated colours, keeps pale ones solid) but the same geometry.
4. **A brand with no sampleable colours degrades to neutral slate.**

### Lotus Water

| Bottle | Light | Dark |
|---|---|---|
| Magnesium | `#B8404F` | `#E4707E` |
| Calcium | `#EBB093` | `#EBB093` |
| Sodium | `#F0DADC` (+ `#DFC0C3` inner edge on white) | `#EBD3D5` |
| Potassium | `#4E9E98` | `#5AB3AC` |
| Brand accent (text-safe) | `#B8404F` | `#E4707E` |

### Apax Lab

| Bottle | Light | Dark |
|---|---|---|
| TONIK | `#6FB87F` | `#93CFA0` |
| JAMM | `#E86A58` | `#FA8B7C` |
| LYLAC | `#B9A3D6` | `#D6C7E8` |
| Brand accent (text-safe) | `#2F7A45` | `#93CFA0` |

**Accent vs bar colour are separate tokens.** A bar colour may be too light to
use as text (Apax mint fails AA on white), so each brand carries a distinct
text-safe accent for links and active states.

---

## Interactions & behaviour

### Navigation motion — screens enter from the direction of their trigger

This is the governing motion rule:

| Screen | Trigger location | Enters from | Transform |
|---|---|---|---|
| Brand + recipe | Header, top of screen | Top | `translateY(-100%)` → `0` |
| Volume | Edit button, mid-screen right | Right | `translateX(100%)` → `0` |
| Settings | Bottom of screen | Bottom | `translateY(100%)` → `0` |

Timing: 380–400ms, `cubic-bezier(.22, 1, .36, 1)`.

The underlying dose screen responds in the matching axis — `translateY(14px)
scale(.97)` when the recipe screen comes down, `translateY(-14px) scale(.97)`
when settings comes up, `translateX(-16px) scale(.97)` when volume pushes in —
fading over 240ms.

### Other motion

- **Value change**: dose numbers and the volume pulse to `scale(1.05)` for 150ms
  on `cubic-bezier(.3, 1.6, .5, 1)` when recomputed.
- **Colour change**: bars transition `background` over 350ms on brand or recipe
  switch, so the palette morphs rather than cuts.
- **Nudge card**: animates `max-height` (0 → 260px) over 380ms with opacity over
  280ms.
- **Dose row marked as added**: opacity to 0.42, `translateX(6px)`, strike-
  through, 280ms. The progress strip above the rows fills in the brand accent.
- **Caret**: 550ms blink, `steps(1, end)`.

### Behaviour rules

- Tapping a dose row toggles it as added; changing volume, brand or recipe
  clears all added marks.
- The rounding line and the nudge are **suppressed entirely in grams mode** —
  grams don't round to whole units, so drop-rounding messaging would be a lie.
- Clean-volume search: step ±25ml outward from the current volume, up to 900ml
  away, minimum 150ml; accept the first volume where every bottle lands within
  0.06 of a whole drop and no bottle is under half a drop. Search **both**
  directions — a smaller honest volume is often the better answer.
- A component whose dose is zero for a recipe is **omitted from the list**, not
  shown as 0. The header bar cluster drops to match.

---

## State

```
mode:        'system' | 'light' | 'dark'      // default 'system'
volume:      number                            // ml, persisted
brandId:     'lotus' | 'apax'                  // persisted
recipeId:    string                            // persisted per brand
units:       { [brandId]: 'drops' | 'grams' }  // per brand, persisted
suggest:     boolean                           // default true
flagAbove:   number                            // default 0.10
done:        { [bottleKey]: boolean }          // ephemeral, cleared on any change
entry:       string | null                     // keypad buffer
```

### Dose maths

```
exact  = dosePerLitre * volume / 1000     // in drops
drops  = round(exact)
gap    = |drops − exact| / exact
grams  = exact * 0.3375                   // 1 drop ≈ 0.3375 ml/g; confirm per brand
```

A bottle is "zeroed" when `drops === 0 && exact > 0`.

---

## Design tokens

### Light

| Token | Value |
|---|---|
| Background | `#FBF8F4` |
| Card | `#FFFFFF` |
| Chip / control | `#F1E9E2` |
| Text | `#241E1C` |
| Secondary text | `#7D6D66` |
| Warning text | `#96632F` |
| Card shadow | `0 3px 14px rgba(70,45,30,.06)` (iOS) / `0 2px 6px rgba(70,45,30,.07)` (Android) |

### Dark

| Token | Value |
|---|---|
| Background | `#161211` |
| Card | `#211C1A` |
| Chip / control | `#332B28` |
| Segmented selected | `#463C37` |
| Text | `#F4EFEB` |
| Secondary text | `#9C8D85` |
| Body-on-card text | `#B6A79F` |
| Divider | `#2C2523` |

### Semantic

| Token | Value |
|---|---|
| OK / rounds clean | `#78A566` |
| Warning / rounding | `#D99A4E` |

All secondary tokens above meet WCAG AA at 14px against their intended
background — this was verified and previously failed with lighter values, so
don't lighten them.

### Typography

**Nunito** throughout — 400/600/700/800/900. Rounded terminals, very heavy
numerals. No monospace anywhere (an explicit client rejection).

| Role | Size / weight |
|---|---|
| Screen title | 24px / 900, ls −0.02em |
| Hero number (volume) | 54–76px / 900, ls −0.035…−0.04em, lh 0.86–0.88 |
| Dose value | 40px / 900, lh 1 |
| Row title | 19–20px / 800, ls −0.01em |
| Card title | 17px / 800 |
| Body | 14.5–15px / 600, lh 1.5 |
| Secondary / caption | 13.5px / 600 |
| Section header | 13.5px / 800, uppercase |

All numerals use `font-variant-numeric: tabular-nums`.

### Spacing & shape

Gaps 8 / 9 / 14 / 20px · screen padding 16–18px horizontal · radii 6 (keys) /
12 (Android chips) / 16 / 20 (rows) / 22 (cards) / pill for buttons ·
colour bar exactly 12px wide, full row height, flush to the leading edge.

---

## Assets

None. No images, no icon set — chevrons and arrows are text glyphs (`▾ ‹ ← ✓ ⌫`)
and should be replaced with the target platform's icon set. Nunito is a Google
Font. The device frames in the HTML (`ios-frame.jsx`, `android-frame.jsx`) are
presentation scaffolding only and must not be ported.

---

## Files in this bundle

| File | What it is |
|---|---|
| `Lympha.dc.html` | All design turns, newest first. **Turn 9** is Android; **turn 8** settings + unit override; **turn 7** the v1 iOS screens (native keypad, Apax); **turn 6** volume/rounding/nudge; **turn 5** the colour-bar exploration that produced the final `5a` treatment. Earlier turns are rejected directions kept for context. |
| `Lympha Prototype.dc.html` | Interactive prototype with real dose maths, live rounding, brand/recipe switching, appearance and per-brand units. The reference for behaviour and motion. |
| `ios-frame.jsx`, `android-frame.jsx`, `support.js` | Presentation scaffolding. Do not port. |
| `original-brief.md` | The client's original brief. |

To view: open either `.dc.html` in a browser.
