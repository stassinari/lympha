# Lympha

Brewing-water mineral dosing for specialty coffee. Pick your concentrate brand, pick a
recipe, say how much water you have, get the dose — offline, no accounts, iOS and Android.

The point of difference is **honest rounding**: drops are whole numbers and doses aren't,
so Lympha shows what you actually get rather than the ideal figure every vendor calculator
silently reports.

## Docs

| Document                                             | What it is                                                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [`docs/water-schema-v0.md`](docs/water-schema-v0.md) | Data model and verified vendor numbers. **Source of truth for anything numeric.**                          |
| [`docs/design-brief.md`](docs/design-brief.md)       | The brief given to Claude Design.                                                                          |
| [`docs/designs/v1/`](docs/designs/v1/)               | Design handoff. **Source of truth for pixels, not for data** — it was written without sight of the schema. |
| [`docs/plan-v1.md`](docs/plan-v1.md)                 | Implementation plan, including where the designs and the schema disagree.                                  |
| [`docs/rn-notes/`](docs/rn-notes/)                   | Notes for a web developer learning React Native, one per slice.                                            |

## Running it

```sh
npm install
npm run ios      # or: npm run android
```

Expo Go is sufficient — no dev build, no native folders.
