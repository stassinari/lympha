## Lympha conventions

Lympha is a React Native phone app (iOS and Android) for dosing mineral
concentrates into coffee water. These components are its real code, rendered in
the browser through react-native-web, so a design built from them carries over
to the app as written. Design for a 390×844 phone, iOS look.

### Setup

Wrap everything in `LymphaProvider`. It supplies the theme, the safe area and the
page background; outside it, components fall back to dark and `Screen` has no
insets to read.
Design light and dark: the app follows the device and is dark-first.

A screen is `Screen` with no horizontal padding, its header, then a scroller
that pads the content. The header owns its inset so a card's shadow is not
clipped by the scroller's edge.

```jsx
const { LymphaProvider, Screen, ScreenHeader, ScrollView, space } = window.Lympha;
<LymphaProvider scheme="dark" insets={{ top: 59, bottom: 34 }} style={{ width: 390, height: 844 }}>
  <Screen horizontalPadding={0}>
    <ScreenHeader title="Settings" onClose={() => {}} />
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: space.screenH,
        paddingTop: space.belowHeader,
        gap: space.rows,
      }}
    >
      …
    </ScrollView>
  </Screen>
</LymphaProvider>;
```

The dose screen is headed by `AppHeader` (wordmark and settings) instead of
`ScreenHeader`.

### Styling

React Native style objects, no CSS classes. Lay out with `View` (a flex column
by default), `padding` and `gap`, never margins tuned by eye. Values come from
the tokens on `window.Lympha`:

- `space`: `rows` 9, `blocks` 14, `screenH` 18, `cardV` 18, `cardH` 20,
  `belowHeader` 8, `tight` 6, `snug` 8, `loose` 20, plus `rowInk` and `labelGap`.
- `radius`: `key` 6, `control` 16, `row` 20, `card` 22, `pill` 999.
- `HEADER_BAND` 64: every screen's header strip; content starts `space.belowHeader`
  below it.
- Colours: read `useTheme().colour` inside a component: `background`, `card`,
  `control`, `controlSelected`, `text`, `textSecondary`, `textOnCard`,
  `textWarning`, `divider`, `ok`, `warning`, `error`. Never a hex.

**Type is components, never `fontFamily` or `fontSize`.** Each role fixes family,
size, line height and tracking: `Hero`, `Volume`, `DoseValue` (numerals),
`HeadlineWords`, `ScreenTitle`, `RowTitle`, `CardTitle`, `Body`, `BodyRegular`,
`HeadlineSubject`, `ActionText`, `Caption`, `SectionHeader`, `CardLabel`,
`UnitLabel`, `VolumeUnit`, `Wordmark`. Colour them with `tone`: `primary`,
`secondary`, `onCard`, `warning`, `error`, `ok`. A new size is a new role, not a
style override.

### Rules the design rests on

- **Bottle colour is identity, drawn only as a flush 12px leading bar**
  (`BarRow`, `BarCluster`); never a fill, tint or text colour, never bordered.
  Resolve with `resolveBarColour(component.colour, scheme)`.
- Colour never carries meaning alone: a name and a number are always present.
- Links and active states use the brand accent:
  `resolveAccent(getBrand(id).accent, scheme)`.
- Status colours (`ok`, `warning`, `error`) belong to no bottle; problems have
  more presence than the clear state.
- Six icons, through `Icon`: `settings`, `chevronDown`, `chevronRight`, `info`,
  `check`, `checkCircle`. Chrome is `bold`, status is `fill`.
- Copy is plain for labels, calm and friendly for sentences; British spelling,
  typographic apostrophes, no em dashes, no "I" or "we".
- `guidelines/decisions.md` holds every decision and its reason. Read it before
  proposing something new.

### Real numbers only

Doses, units and percentages come from the vendors' published data. Never invent
them; compute them with the app's engine:

```jsx
const { computeDose, getRecipe, componentMap, roundingSummary, DoseRow, View, space } =
  window.Lympha;
const dose = computeDose(getRecipe('lotus-raos-recipe'), 1000, componentMap);
<View style={{ gap: space.rows }}>
  {dose.lines.map((line) => (
    <DoseRow key={line.component.id} line={line} />
  ))}
</View>;
// roundingSummary(dose, 0.1) → { status, text } for RoundingLine
```

Brands: `brands`, `getBrand`. Recipes: `recipes`, `recipesForBrand(brandId)`.
Each component's `.prompt.md` explains why it is built the way it is; keep to it.
