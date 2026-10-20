# Design sync — notes

Syncs `src/design` and `src/components` to the private Claude Design project
"Lympha" (`config.json` → `projectId`).

## How the build works

- The components are React Native. `.design-sync/web/build.mjs` (`buildCmd`)
  bundles them for the browser through react-native-web into
  `.design-sync/.cache/web-pkg/`, which the converter then treats as an ordinary
  web React package. Substitutions are listed in its header.
- `src/state/store.ts` resolves to `web/store.tsx`: a store per
  `LymphaProvider`, seeded by its `state` prop and never persisted, built from
  the same `src/state/actions.ts` as the app's.
- `react-native` resolves to `web/react-native.ts`, which reports `Platform.OS`
  as `ios`: the iOS look is the reference for design work.
- `web/docs.mjs` writes each component's doc (→ `.prompt.md`) from its source
  comments, its type spec and its preview's exports, and for a screen, its
  whole source file. A preview change reaches
  the docs only on a full build (`buildCmd`, then `package-build.mjs`).
- The bundle also exports the screens, the state hooks, the dose engine, the
  vendor data, the formatters and RN's `View` / `ScrollView` / `StyleSheet` /
  `Switch`.
- react-native-web's stylesheet element is renamed to `lympha-stylesheet` in the
  build: its default id matches the render check's `[id^="r"]` root selector and,
  being empty markup, reads every card as unrendered.
- Playwright's Chromium lives in `.ds-sync/node_modules`, so validate and capture
  need `PLAYWRIGHT_BROWSERS_PATH=0 NODE_PATH=.ds-sync/node_modules`.

## Authoring previews

- Import only from `'lympha'`. `react-native` is not resolvable from a preview.
- Every export is self-contained JSX: no helpers, no comments between exports,
  no TypeScript `!`. Each export is copied verbatim into the doc as an example
  for the design agent.
- Numbers come from the engine and vendor data (`computeDose`, `getRecipe`,
  `componentMap`, `roundingSummary`, `recipeSubtitle`, `getRange`), never
  invented.
- The configured provider is `LymphaProvider scheme="light"`, which paints the
  page background. A dark cell wraps itself in
  `<LymphaProvider scheme="dark" style={{ padding: space.blocks }}>`.
- Width a phone screen's content at 354 (390 less two 18pt insets).
- A screen preview is a whole phone: `LymphaProvider` with
  `insets={{ top: 59, bottom: 34 }}`, `style={{ width: 390, height: 844 }}` and
  the brew in `state`. Its card declares `viewport: "438x892"` in `config.json`
  (the phone plus the card's 24px padding); the 900×700 default crops the
  bottom of the screen.
- A pill or other `alignSelf: 'stretch'` control fills a column; put it in a
  `flexDirection: 'row'` view to show its natural width.
- Review sheets are scaled to about three quarters.
- Run Prettier on a preview before capturing it: grades are keyed to the
  source, so formatting afterwards clears them.
- Range ids for `getRange`: `lotus`, `apax-lab`, `apax-lab-original`. Use
  `getRange(id)?.accent.light`, not `!`.
- `LymphaProvider` feeds `insets` straight into the safe-area contexts:
  `SafeAreaProvider` on the web measures the browser and overwrites them.
- The volume presets are not exported; the SettingsRow and Pill previews
  restate `[250, 350, 500, 1000]`.
- `DoseProgress` draws nothing at `done={0}`, so no preview cell uses it.
- `NumberField` holds focus in its own state, so only the resting value can be
  previewed: the selection band and caret appear only on a tap. No preview uses
  `autoFocus`, which would steal focus from the canvas.
- `HiddenInput` draws nothing and is mapped out of the cards in `config.json`.

## Known render warns

- `VolumeNudge` enters with a 380ms fade; the capture screenshots before it
  lands, so its cells capture blank. Verified separately by rendering
  `VolumeNudge.html` and waiting 1s before the screenshot.

## Re-sync risks

- **Converter assumptions.** `web/build.mjs` stubs or substitutes `expo-haptics`,
  `expo-status-bar`, the RN asset registry, `NativeSheet` and RN's
  `TurboModuleRegistry`, and renames react-native-web's stylesheet id. A new
  native module in `src/`, or a react-native-web or react-native-svg upgrade,
  can break the bundle or the render check.
- **Restated values.** The SettingsRow and Pill previews restate the volume
  presets; a change to them in the app leaves both stale.
- **Store shape.** `web/store.tsx` mirrors `src/state/store.ts`'s exports
  (`useStore`, `useHydrated`, `Store`). A new export there, or a screen using
  `useStore.getState()`, needs the same in the web store.
- **Stand-ins.** `web/NativeSheet.tsx` imitates the iOS sheet; it is not the
  platform's own.
- **Web text metrics.** Type renders through CSS, where line-height slack splits
  evenly as on Android, while the metric helpers answer for iOS. Optical
  centring can sit a pixel or two off the device.
- **Only iOS is shown.** Android's back chevron, chip outline and 48dp targets
  never appear in Design.
- **Toolchain.** Built with Node 24, esbuild 0.28, react-native-web 0.21.
  Chromium is in `.ds-sync/node_modules`, which is gitignored; a fresh clone
  reinstalls it (about 570 MB).
