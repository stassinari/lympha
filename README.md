# Lympha

Brewing-water mineral dosing for specialty coffee. Pick your concentrate brand, pick a
recipe, say how much water you have, get the dose — offline, no accounts, iOS and Android.

The point of difference is **honest rounding**: drops are whole numbers and doses aren't,
so Lympha shows what you actually get rather than the ideal figure every vendor calculator
silently reports.

## Docs

| Document                                             | What it is                                                                                               |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [`docs/roadmap.md`](docs/roadmap.md)                 | What is left before v1, and what comes after. The only to-do list.                                       |
| [`docs/decisions.md`](docs/decisions.md)             | Every product, design and engineering decision, with its reason. Check here before re-arguing one.       |
| [`docs/water-schema-v0.md`](docs/water-schema-v0.md) | Data model and verified Lotus numbers. **Source of truth for anything numeric.**                         |
| [`docs/apax-lab-brief.md`](docs/apax-lab-brief.md)   | Sources, units and anomalies behind `src/data/sources/apax-lab.json`, the only copy of the Apax numbers. |
| [`docs/native-builds.md`](docs/native-builds.md)     | Native builds, app icons and simulator selection. **Read before changing anything in `app.json`.**       |
| [`docs/designs/v1/`](docs/designs/v1/)               | The original design handoff: a picture of the intent, not a spec. Its numbers are wrong.                 |

## Running it

```sh
npm install
npm start        # Metro, in its own terminal; leave it running
npm run ios      # or: npm run android — native Debug build, installed and launched
```

`npm run ios` / `npm run android` compile a native build and install it, but deliberately
do **not** start a bundler (`--no-bundler`): the app fetches its JavaScript from the Metro
you already have running. Without Metro it opens to a black screen reading _"No script URL
provided"_ — the build is fine, there is simply nothing to run.

Android builds need **JDK 17** as `JAVA_HOME`; a newer JDK fails the Gradle build.

For JS-only work, Expo Go is still enough: `npm start`, then press `i` or `a`.

**Anything native is different.** The app icon, splash screen, permissions and plugins
all need a real build — and `expo run:ios` / `expo run:android` will _not_ pick up your
change on their own, because they only run prebuild when `ios/`/`android/` are missing.
See [`docs/native-builds.md`](docs/native-builds.md) for the loop that actually works.
