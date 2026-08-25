# Lympha v1 — implementation plan

Companion to `water-schema-v0.md` (data truth) and `designs/v1/README.md` (visual truth).
Where they conflict, the schema wins on numbers, the designs win on pixels.

---

## 1. Is React Native the right tool?

**Yes, and this app is unusually well suited to it.** The reasoning, not just the verdict:

**What makes it a good fit**

- **The design is already cross-platform by decision.** The handoff says iOS and Android
  share one visual language and differ only in mechanics. Nothing in this UI is a stock
  control restyled. RN's classic weakness — making a bespoke layer feel native — doesn't
  apply, because the design isn't trying to look native in the first place.
- **Zero native surface.** Offline, no accounts, no network, no camera, no background
  work, no push. Persistence is six scalars. Everything needed (fonts, haptics, storage,
  animation) is Expo first-party. No bridge risk, no ejecting, no Podfile archaeology.
- **The interesting half is platform-independent.** The data model and dose engine are
  plain TypeScript that runs in Node. Roughly 40% of this app's value — the honest
  rounding, the clean-volume search, the quantisation — can be built and tested with no
  simulator involved. That is a very healthy shape for a first RN project.
- **Your existing skills transfer directly.** JSX, hooks, TypeScript, flexbox, npm.
  Expo removes the Xcode/Gradle cliff that makes RN miserable to start.

**Where it will actually bite you** (all in one area — typography and layout fidelity)

- **No CSS.** `StyleSheet` objects only. No cascade, no pseudo-selectors, no media
  queries, no `em` units. Theming is a context object, not a stylesheet swap.
- **RN clips glyphs to the `lineHeight` box; CSS lets them overflow.** The handoff's
  `lh 0.88` on 54px numerals shears the top off every digit. **And the clipping is
  platform-divergent** — identical code renders sheared on iOS and intact on Android, so
  tuning it against one simulator silently breaks the other. This was the spike's main
  finding; see `rn-notes/00-fidelity-spike.md`.
- **Letter-spacing is absolute px, not `em`.** Every `-0.035em` in the handoff has to be
  multiplied out per font size, and it won't track if the user scales text.
- **Font weight is selected by family name, not `fontWeight`.** `Nunito_900Black` is a
  separately loaded family; `fontWeight: '900'` gets you a synthesised fake bold.
- **StyleSheet has no cascade** — `Text` does not inherit `fontFamily` from a parent
  `View`, so the design system must expose typography as components, not style objects.
- **Reanimated is the one genuinely new mental model** — worklets running on the UI
  thread, not the JS thread. It's the best thing in the ecosystem and also the part that
  won't feel like React.

**Two risks investigated and retired** (Slice 0, evidence in `rn-notes/00-fidelity-spike.md`):

- ~~`alignItems: 'baseline'` is unsupported~~ — **wrong, it works.** Yoga implements it and
  the volume card's shared baseline renders correctly on both platforms.
- ~~Nunito may lack tabular figures~~ — **it needs none.** Parsing the shipped TTFs shows
  every digit is already 600/1000 em at every weight. No jitter risk in the value pulse.
- ~~`overflow: 'hidden'` + `borderRadius` clipping on Android~~ — **works on API 34 / RN
  0.86.** The flush 12px bar needs no workaround.

**Alternatives, briefly, so the choice is informed**

| Option | Verdict |
|---|---|
| SwiftUI + Jetpack Compose | Best typographic control, twice the work, and you'd learn two platforms shallowly instead of one properly. |
| Flutter | Strongest pixel fidelity of any option, but Dart is a real detour for a web dev and this app has no need for Flutter's rendering muscle. |
| PWA | Fails the brief: 6am cold start, haptics, offline install friction on iOS, no store presence. |

**Conclusion:** Expo + React Native. Slice 0 ran first and retired the typography risk;
the design is reproducible. Slice 4 carries one extra invariant — **`lineHeight` is never
below `1.0 × fontSize`**, and tight vertical rhythm is achieved with negative margins on a
wrapper instead.

---

## 2. Corrections the plan bakes in

Claude Design was not given the data model. These are the divergences, and how v1 resolves them.

| # | Design bundle says | Truth (schema) | Resolution |
|---|---|---|---|
| 1 | Lotus recipes are drops-per-litre (`{mg:4, ca:7, na:6, k:4}`) | Lotus is **target-first**: recipes are ppm as CaCO₃; drops are derived | Store ppm. Derive drops. **This matters a lot** — with drops hardcoded there is no ideal to compare against, so the app's headline feature (honest rounding) is arithmetically impossible at any volume other than 1 L. |
| 2 | Lotus "Light and Bright" = 3/5/4/3 drops | 0 / 60 / 0 / 25 ppm → 0/7/0/6 drops at 1 L | Use schema. Magnesium and Sodium are genuinely absent from that recipe and get **omitted from the list**, per the design's own zero-dose rule. |
| 3 | Lotus "Ultra Light" = `{mg:2, ca:3, na:1.4}` | 15/20/0/10 ppm → 2/2/0/2 drops | Use schema. (A fractional drop count was never physical.) |
| 4 | Apax is drops-first; grams via `exact * 0.3375` | Apax is **dose-first in grams**; 1 drop ≈ **0.0667 g** (15 drops/g, from their own table) | Invert it: grams are the source, drops are derived. `0.3375` appears to be a Lotus drop volume misapplied to Apax — using it would be wrong by ~5×. |
| 5 | Seven Apax recipes with invented ratios | **Superseded** by `apax-lab-brief.md`: Apax is *two* ranges — 15 current recipes (4 concentrates incl. KONFLUX) and 8 pre-KONFLUX ones (3 concentrates), 23 in total | All shipped, mapped from `apax-lab-recipes.json`. The schema's own "Washed processed" (2.7/0.3/1.0) came from the printed card, which the brief rules out as a source; the archived calculator gives 2.5/0.5/1.0. |
| 6 | Rounding messaging "suppressed in grams mode" | The real rule is the dispenser's `allow_partial` / `step` | Generalise: suppress when the active dispenser allows partial doses. Same behaviour today, correct for future brands. |
| 7 | Detail screen shows Hardness / Alkalinity / **TDS** | TDS is not derivable; Apax publishes no ion quantities at all | Per your call: universal **asked vs delivered per bottle** table, plus a GH/KA block only where ion data exists. No TDS. |
| 8 | Third Wave Water cut from v1 | Schema models sachets as `step:1, allow_partial:false` | Cut from v1 content, **kept in the type system** so it's a data addition later, not a refactor. |
| 9 | — | Barista Hustle numbers unverified, "do not ship" | Types support `prepared` components; no BH data ships. |
| 10 | Clean-volume search may look **up to 900 ml away** | — | Changed to **25% of the requested volume**. A flat allowance is sensible from a litre and absurd from a cup: it produced "Use 800 ml" for someone asking for 350, which is a different drink rather than a nudge. Where nothing qualifies, the card says so — which the design already required. |

---

## 3. Architecture

```
app/
  index.tsx                 single screen + three overlays
src/
  data/                     brands.json, components.json, recipes.json  (+ zod schemas)
  engine/                   PURE TypeScript, no RN import anywhere
    resolve.ts              target-first (ppm) -> dose units
    scale.ts                reference volume -> target volume
    quantise.ts             dispenser step / allow_partial -> delivered + error
    profile.ts              delivered ion / CaCO3 totals, where data exists
    cleanVolume.ts          the +/-25ml both-directions search
    units.ts                magnitude-based display unit choice
  design/                   tokens, typography, useTheme
  components/               Card, ColourBar, DoseRow, Pill, Chip, ...
  screens/                  Dose, Volume, BrandRecipe, Settings, Detail
  state/                    store + AsyncStorage persistence
docs/rn-notes/              one "notes for a web dev" file per slice
```

**Key decisions**

- **Expo managed workflow**, TypeScript strict. No native modules in v1.
- **One screen, three overlays** rather than a navigator. All three secondary screens are
  full-bleed overlays over a persistent Dose screen, and the design requires the *underlying*
  screen to transform in sympathy (`translateY(14px) scale(.97)` etc). That coordination is
  awkward through a navigator and trivial with two Reanimated layers. Cost: Android hardware
  and predictive back must be wired by hand. Fallback if it gets ugly: `@react-navigation/stack`
  with custom `cardStyleInterpolator`.
- **Zustand** for state (tiny, hooks-native, no provider ceremony), persisted to
  **AsyncStorage** — six scalars, Expo Go compatible, no dev build needed.
- **Engine is import-clean of React Native**, so it runs under a plain Node test runner and
  stays fast.

---

## 4. Slices

Each slice is independently verifiable and ends with a learning note in `docs/rn-notes/`.

### Slice 0 — Fidelity spike ✅ *done*
Findings and evidence in `rn-notes/00-fidelity-spike.md`. Architecture unchanged; Slice 4
gains a `lineHeight >= fontSize` invariant and a tightened-numeral wrapper primitive.

### Slice 1 — Skeleton
Expo + TS strict, ESLint/Prettier, test runner, path aliases, folder structure, fonts,
light/dark token module wired to `useColorScheme`.

### Slice 2 — Data model and content *(pure TS)*
Types mirroring `water-schema-v0`: Brand, Component, Dispenser, Recipe, Addition.
Zod schemas. Lotus content: 4 components with `ions_per_dose_unit_per_litre`, 7 recipes as
ppm CaCO₃ (excluding the `Custom Recipe` sentinel), attribution stored, not marketing copy.
Apax content mapped from `apax-lab-recipes.json`. Build-time invariant tests.

### Slice 3 — Dose engine *(pure TS, test-first)* ← the heart of the app
`resolve → scale → quantise → report`. Plus `cleanVolume` and magnitude-based unit choice.
Golden tests come straight out of the schema, which is unusually generous here:
- Both Lotus formulations must agree: `ppm × (vol/4500) × 0.56 × (2 if monovalent)`
  ≡ `ppm / 8.04` (divalent) and `ppm / 4.02` (monovalent). *(Verified by hand — they do.)*
- The quantisation table at 1 L: all seven recipes' drop counts and GH/KA errors,
  including Ultra Light at −19.6% alkalinity.
- Rao's at 250 ml drops potassium to **zero** — the zeroed case.
- Apax: the 4.0 g/L envelope holds except for the two published exceptions, and
  validation is on grams — a valid 4.0 g/L recipe can total 61 drops, so drop totals are
  not an invariant.

### Slice 4 — Design system
Tokens (light / dark / semantic), type scale with letter-spacing multiplied out per size,
platform-conditional shadow vs elevation, primitives: Card, ColourBar, Pill, Chip, SectionHeader.

### Slice 5 — Dose screen, static
Engine → UI with fixed state. Recipe header + bar cluster, volume card, dose rows, rounding line.
First time the real numbers appear on a phone.

### Slice 6 — State and persistence
Store shape per the handoff (`mode, volume, brandId, recipeId, units per brand, suggest,
flagAbove`, ephemeral `done`). AsyncStorage rehydration. "Opens to the answer" verified by
killing and relaunching the app.

### Slice 7 — Volume screen
System numeric keypad via an offscreen `TextInput` (`keyboardType="number-pad"`), presets,
blinking caret, nudge card with animated height, push-from-right. Nudge only when a bottle
zeroes or the worst gap exceeds `flagAbove`; never invents a suggestion when none exists.

### Slice 8 — Brand + recipe screen
Drops from top. Brand chips with mini colour clusters, recipe rows with bar clusters and
selection outline, "Switching brand keeps your volume."

### Slice 9 — Settings + unit override
Rises from bottom. Appearance segmented control, **per-brand** concentrate units, brewing
defaults, bottles list. Unit override screen previewing the same dose in both units.

### Slice 10 — Detail screen
Per your decision: hero card with worst gap, universal asked-vs-delivered-per-bottle table,
GH/KA block only for brands with ion data, no TDS, closing clean-volume card.

### Slice 11 — Motion
Reanimated: three directional transitions with the coordinated underlying transform
(380–400ms, `cubic-bezier(.22,1,.36,1)`), 150ms value pulse, 350ms colour-bar morph,
row-done strike-through, progress strip. Haptics on dose-row tap.

### Slice 12 — Platform and accessibility pass
Android ripple, Material chip/switch geometry, predictive back, elevation values.
TalkBack/VoiceOver labels, dynamic type behaviour, confirm colour is never load-bearing alone.

### Slice 13 — Ship prep
Icon, splash, EAS build config, TestFlight + Play internal track.

---

## 5. Open items

1. ~~Apax recipe numbers~~ — delivered as `docs/apax-lab-brief.md` and
   `docs/apax-lab-recipes.json`, and shipped in Slice 2. Three consequences worth carrying
   forward:
   - **KONFLUX has no published label colour.** It post-dates the design handoff, so it
     takes the handoff's documented fallback of neutral slate. Needs a real value.
   - **Three brands, not two**, and two of them are the same vendor. The brand chip row and
     the "Bottles" settings section were designed for two.
   - **Fifteen recipes in one range**, grouped process / roast / brew-method / varietal /
     signature. The Brand + recipe screen was designed as a flat list of five to seven; it
     needs section headers.
2. ~~Nunito tabular figures~~ — resolved by Slice 0: Nunito's default figures are already
   tabular, no feature needed.
3. ~~The headline rounding percentage could not be reproduced from the detail screen~~ —
   fixed 2026-08-25. The figure was computed from full-precision ppm while the table printed
   one decimal, so Rao's at 1500 ml showed 7% where the printed numbers gave 6%. The ppm
   column now prints two decimals, every row carries its own gap, the hero names which
   figure it is quoting, and a test asserts that the printed numbers reproduce the headline.
4. **Non-zero starting water** — parked in the schema, out of v1, but it's the most likely
   thing to change the engine's shape later. Engine signatures should not assume zero TDS input.
5. **Everything else still outstanding lives in `docs/v1-checklist.md`** — bugs, design and
   copy work, release mechanics, and what is deliberately held back for 1.1. One list rather
   than two that drift apart.
