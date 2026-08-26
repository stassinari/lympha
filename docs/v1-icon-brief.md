# Icon system handover — Lympha

We're replacing the hand-drawn `View`-based icons with Phosphor. This doc is the complete
scope. **Do not add icons beyond this list.** The design is deliberately text-forward; the
rounded display type and the coloured bar marks carry the identity, and every extra glyph
competes with them. Six usages in the whole app is the intended number, not a starting point.

## Install

```sh
npx expo install phosphor-react-native react-native-svg
```

(If this isn't an Expo project, use your package manager directly — `react-native-svg` needs
a pod install on iOS.)

## Wrapper component

Create `components/Icon.tsx`. Everything in the app imports from here, never from
`phosphor-react-native` directly, so swapping the library later is a one-file change.

```tsx
import {
  GearSixIcon,
  CaretDownIcon,
  CaretRightIcon,
  InfoIcon,
  CheckIcon,
  ArrowUpIcon,
} from 'phosphor-react-native';
import type { IconWeight } from 'phosphor-react-native';
import { colors } from '@/theme';

const glyphs = {
  settings: GearSixIcon,
  chevronDown: CaretDownIcon,
  chevronRight: CaretRightIcon,
  info: InfoIcon,
  check: CheckIcon,
  arrowUp: ArrowUpIcon,
} as const;

type IconName = keyof typeof glyphs;

export function Icon({
  name,
  size = 24,
  color = colors.ink,
  weight = 'regular',
}: {
  name: IconName;
  size?: number;
  color?: string;
  weight?: IconWeight;
}) {
  const Glyph = glyphs[name];
  return <Glyph size={size} color={color} weight={weight} />;
}
```

Import icons by name as above — **not** `import { ... } from 'phosphor-react-native'` inside
feature components, and never a namespace import, which defeats tree-shaking.

## Changes by screen

### 1. Home

- **Top right:** replace the hand-drawn sliders with `settings` at 24px, `regular`.
  The sliders glyph promises "adjust values" but the screen behind it is preferences
  (appearance, units, defaults). `GearSixIcon` is the honest signal and its rounder
  silhouette sits better with the type.
- **Recipe selector row:** replace the drawn chevron with `chevronDown`, 24px, `regular`,
  muted ink.
- **Footer status:** replace the orange dot with `info` at 16px in the existing amber.
  The dot currently carries "caution" in colour alone — invisible in greyscale and to
  colour-blind users. Use `info`, **not** `WarningCircle`; the copy is deliberately gentle
  and a warning glyph would shout.

### 2. Recipe picker

- **Selected row:** the thin outline border is the weakest signal in the app, especially
  next to the unmistakable dark fill on the brand tabs above. Add `check` at 20px, `bold`,
  to the **left of the title**. The bar marks occupy the right edge — don't crowd them.
- Border can stay or go; test both.

### 3. Dose info ("What you'll get")

- Replace the `^` **text characters** next to rounded values (Calcium 3, Sodium 2, Hardness,
  Alkalinity) with `arrowUp` at 14–16px, `bold`, in the amber.
- These are currently icons faked with a text glyph — wrong weight, wrong optical centre,
  sitting off the baseline. This is the highest-value fix in the app.
- Arrow, not caret: caret reads "expand/collapse", arrow reads "rounded up", which is
  what we mean.

### 4. Volume input

- **No icons.** Presets are numbers so they stay text, "Got it" is clearer as a word than
  an X, and the pink highlight already reads as an active field.

### 5. Settings

- **Apax Lab row:** `chevronRight`, 20px, `regular`, muted ink.
- **No leading icons on rows.** iOS Settings does this, but our rows sit under explicit
  section headers with unambiguous labels — five glyphs would add five decisions and
  zero information.
- **Fix an inconsistency while here:** Water and Lotus Coffee Products show a value with no
  chevron; Apax Lab shows a value *with* one. If all three open a picker, all three need
  `chevronRight`. If the first two cycle in place on tap and only Apax Lab pushes a screen,
  the asymmetry is technically correct but too subtle to read — flag it rather than
  silently guessing.

## Explicitly out of scope

- The four-bar recipe marks. These are a custom glyph doing real information work (bar count
  and colour map to the minerals in each recipe). Keep Phosphor away from them entirely.
- Tab bar / navigation icons — there's no tab bar.
- Leading icons on any list row.
- Any icon not in the `glyphs` map above. If a new screen seems to need one, raise it
  rather than adding it.

## Brand mark

Separately, the four-bar mark should stop being hand-drawn `View`s. Add
`react-native-svg-transformer` so it can live as `assets/logo.svg` and be imported as a
component. This is independent of the Phosphor work and can land in its own change.
