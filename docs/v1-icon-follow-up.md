# Icon refinements — round 2

Follow-up to `ICONS.md`, written after the first pass landed on Home. Everything here
**supersedes** the weights specified in that doc. Scope is unchanged: still six icon
usages, no new ones.

## 1. Weight rule (applies everywhere)

**Chrome and navigation → `bold`. Status → `fill`.**

At `regular`, Phosphor's strokes are hairlines next to our display type, which is very
heavy. The gear reads as too light against "Lympha", and the 16px footer icon is genuinely
faint. `bold` puts the strokes in the same weight family as the type without changing what
the icon is.

Update these from `regular` to `bold`:

- `settings` (Home, top right)
- `chevronDown` (Home, recipe selector)
- `chevronRight` (Settings, Apax Lab row)

`check` and `arrowUp` were already specified as `bold` — no change.

### Do not use `fill` for chrome

Filled glyphs are a solid shape language, and solid shapes in this app already mean
something specific: the mineral bar marks. Introducing a second one competes with the
element doing the most information work. Fill is reserved for **status only**, where the
icon represents a state rather than an action — currently just the footer.

### Do not use `duotone` anywhere

Phosphor duotone is a single colour with the secondary path at reduced opacity, so on our
cream background it renders as a washed-out ghost, not the two-tone effect it looks like in
the docs. Two-tone is also already the bar marks' job.

## 2. Footer: add the good state

The footer currently shows a green dot when everything is fine — same colour-only problem
the amber dot had. Replace with `CheckCircleIcon`, 16px, `fill`.

Add to the `glyphs` map in `components/Icon.tsx`:

```tsx
import { CheckCircleIcon } from 'phosphor-react-native';
// ...
  checkCircle: CheckCircleIcon,
```

Three constraints on this one:

- **`CheckCircle`, not plain `Check`.** It shares `Info`'s circular silhouette, so the two
  states swap at the same optical size without the row reflowing or shifting weight.
- ~~**Teal, not green.** Use the existing potassium-bar teal from the theme. A generic success
  green would be the only colour in the app outside the palette (terracotta, rose, cream,
  teal, amber).~~ **Reversed 2026-10-05.** A bottle's colour used as a state reads as that
  bottle, and the teal fails 3:1 in light mode at the mark's 80% mute. Replaced by a leaf
  green of its own (`#4D7A31` / `#8DBE6A`): see `v1-checklist.md`.
- **Quieter than the caution state.** Problems should have more presence than non-problems.
  Mute both the check and its label; leave the amber line's contrast as it is today.

Also worth checking while in here: what does **"Details"** do when nothing is off? If there's
nothing to explain, the link probably shouldn't render at all, and the good-state footer
becomes a short reassurance with no action attached. Flag rather than guess.

## 3. Rejected alternatives

Recorded so they don't get re-proposed later.

### `CaretCircleDown` for the recipe selector — rejected

Adds a bounded circle inside a card that is already a bounded shape, immediately beside the
bar mark: three competing containers in one row. More importantly it misrepresents the tap
target — the whole row is tappable, and circling the caret implies the caret is the button
and the rest of the row isn't. Plain `CaretDown` at `bold` is the correct disclosure
indicator.

### `ArrowFatLineUp` for the dose-info stats — rejected

It's a "promote / boost / level up" glyph: chunky by design, and at 14–16px it collapses
into an indistinct blob. It also overstates the message — we mean "drops are integers so we
nudged up", not "significant increase" — and it appears four times in one small table, which
would turn a quiet data readout into something that looks alarmed. Keep plain `ArrowUp`,
`bold`, amber.
