# Native builds and app icons

Everything in this doc is about the **app icon** — the one on the home screen — and the
native builds needed to see it. For the Phosphor glyphs used inside the UI, see
[`v1-icon-brief.md`](v1-icon-brief.md).

## Expo Go cannot show the app icon

The app icon is compiled into the iOS asset catalog and the Android `mipmap` resources at
build time. In Expo Go you are looking at Expo Go's own icon; there is no configuration
that changes this. Checking an icon means a native build.

This is also why an icon renders fine with Metro dead — icons are native resources and have
nothing to do with the JS bundle.

## The rule that will waste your afternoon

**`expo run:ios` / `expo run:android` only run prebuild when the native directory is
missing.**

`ios/` and `android/` are generated and gitignored, so the first build creates them. Every
build after that reuses whatever native config was generated the first time. Edit
`app.json` or anything under `assets/` that feeds it, run `expo run:ios`, and you will get
a clean, successful, completely stale build.

This applies to **every** native setting, not just icons: splash screen, permissions, bundle
identifier, plugins, the Android adaptive icon. If it lives in `app.json`, prebuild has to
re-run for it to reach the native project.

## Icon iteration loop

### iOS

```sh
npx expo prebuild -p ios                            # syncs app.json + assets into ios/
xcrun simctl uninstall booted dev.saverio.lympha    # only if the icon looks stuck
npx expo run:ios --no-bundler
```

Plain `prebuild` is enough and takes about 25 seconds. **Do not reach for `--clean`** unless
the native project is actually broken — it forces a full CocoaPods reinstall and a cold
compile, turning a 25-second sync into several minutes.

The uninstall is belt-and-braces. iOS caches launcher icons across reinstalls, so a changed
icon quite often keeps rendering as the old one. If an icon looks unchanged, uninstall
before concluding the build is wrong.

### Android

```sh
npx expo prebuild -p android
adb uninstall dev.saverio.lympha                    # only if the icon looks stuck
npx expo run:android --no-bundler
```

Android caches launcher icons too, and additionally refuses to install over an app signed
with a different key — a locally built debug APK cannot update an EAS build. That surfaces
as `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, and the fix is the uninstall above.

Note the launcher caches the **workspace** icon separately from the **app drawer** icon, so
a stale dock icon alongside a correct drawer icon is a cache artefact, not a bug in the
asset.

## Why `--no-bundler`, and why the app is black without Metro

`--no-bundler` stops the Expo CLI starting its own Metro. Saverio runs `npm start` himself;
an agent-owned Metro takes port 8081 and pushes his to 8082, after which the simulators talk
to the wrong bundler and every change appears not to apply.

The trade-off is that a Debug build contains **no JavaScript at all**. The Xcode build phase
sets `SKIP_BUNDLING=1` for Debug and the app fetches its bundle from `localhost:8081` at
launch — that is what makes Fast Refresh possible instead of a full recompile per keystroke.
With no Metro running you get a redbox reading *"No script URL provided"* over a black
screen. The build is fine; there is simply nothing to run.

For an app that needs nothing else on the machine, build Release — Metro runs once at build
time and the bundle is embedded:

```sh
npx expo run:ios --configuration Release
npx expo run:android --variant release
```

Worth doing occasionally regardless: release builds are minified and drop the dev overlay,
so they are the only honest measure of startup performance.

## Icon asset requirements

### iOS

Configured via `ios.icon` pointing at an Icon Composer `.icon` directory (supported in SDK
54+). Dark and tinted variants are handled inside Icon Composer, so no separate files are
needed. Prebuild copies the bundle to `ios/Lympha/app.icon` and sets
`ASSETCATALOG_COMPILER_APPICON_NAME`.

To confirm it really compiled rather than silently falling back to a PNG, look for
`app.iconstack` and the `IconImageStack` asset type:

```sh
xcrun --sdk iphonesimulator assetutil --info <App>.app/Assets.car | grep -i iconstack
```

Note that a layer with `"glass": true` and `"fill": "none"` has no colour of its own — its
appearance comes from the glass material and the substrate beneath it. Raising that layer's
opacity will not make it more brand-coloured; give it an explicit fill instead.

The fallback `icon.png` stays in `app.json` — it is still used to generate Android's legacy
`ic_launcher`. It must be 1024×1024 and **fully opaque**: iOS applies its own mask, and
transparent pixels render as black artefacts.

### Android

Adaptive icons are three layers on a **108dp** canvas, of which the launcher masks away
everything outside a shape you do not control. Only the central **66dp** is guaranteed to
survive; the outer 18dp per side is reserved for masking and parallax effects.

At the native **432×432** export size (108dp at xxxhdpi, so 4px per dp), that means:

| File | Canvas | Alpha | Content |
| --- | --- | --- | --- |
| `android-icon-foreground.png` | 432×432 | transparent except the mark | mark ≤ **264×264**, centred |
| `android-icon-monochrome.png` | 432×432 | transparent except the mark | same silhouette, filled solid black |
| background | — | — | use `adaptiveIcon.backgroundColor`, not a PNG, when it is a flat colour |

Two mistakes that are easy to make and hard to spot:

- **The foreground is not the iOS icon.** The mark occupies ~82% of the iOS square quite
  happily, but at that scale on Android the edges are sliced off by the mask. It needs to be
  visibly over-padded in the file to look correct on the device.
- **The monochrome layer is a stencil, not a variant.** Android discards its colours and
  uses only the **alpha channel**, tinting the result to the user's wallpaper. A fully
  opaque image — for instance a copy of the full icon, background and all — makes the whole
  square the shape, so themed icons render as a solid tinted blob.

Verify an export before building:

```sh
magick identify -format "%wx%h opaque=%[opaque] bbox=%@\n" assets/android-icon-*.png
```

`opaque=False` and a bounding box within 264px are what you want.

## Which simulator or emulator gets used

Expo has no preference of its own; it defers to the platform tools.

| Key | Resolution order |
| --- | --- |
| `i` | first **booted** simulator → else `defaults read com.apple.iphonesimulator CurrentDeviceUDID` → else first in `simctl list` |
| `a` | `adb devices` (booted) concatenated with `emulator -list-avds`, then `devices[0]` — Expo does no sorting, so it is the emulator's alphabetical order |
| `shift+i` / `shift+a` | interactive picker, bypasses all of the above |

Consequences worth knowing: on iOS, whatever simulator you last used becomes the default,
so boot the one you want first (`xcrun simctl boot <udid>`) or pass `--device <udid>`. On
Android, with nothing booted, the **alphabetically first** AVD wins. Name AVDs with that in
mind — `Pixel_10_…` sorts before `Pixel_3a_…`, and a single-digit model needs zero-padding
(`Pixel_09_…`) to keep its place.

Current defaults: **iPhone 18 Pro on iOS 27.0** and **`Pixel_10_Pro_API_37`** (Android 17).
No Pixel 11 device profile shipped with Android Studio 2026.2; when one does, it is a new
AVD on the same API 37 image.

**Xcode 27 has no `Simulator.app`.** It was replaced by **DeviceHub**, at
`/Applications/Xcode.app/Contents/Applications/DeviceHub.app`, so `open -a Simulator` fails.
`simctl` is unchanged and still drives everything.

## Toolchain

**Expo SDK 57 requires Xcode 26.4 or later.** Older Xcode fails with 17 errors of the form
`'weak' must be a mutable variable` from `expo-modules-jsi` and `expo-modules-core`, because
`weak let` (SE-0481) is not implemented in the Swift shipped before 26.4. No pod
configuration works around it — the compiler simply lacks the feature. Xcode 27.0 builds
cleanly (verified 2026-10-05, 0 warnings).

**Xcode 27 builds crash on iOS 27 unless the app uses the UIScene lifecycle.** The crash is
an immediate `EXC_BREAKPOINT` in `_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`.
SDK 57's template still generates an `AppDelegate` that creates its own `UIWindow`, so it
needs Expo's opt-in, configured in `app.json`:

```json
["expo-build-properties", { "ios": { "enableSceneSupport": true } }]
```

This needs `expo` ≥ 57.0.23. Verify after prebuild that `Info.plist` has a
`UIApplicationSceneManifest` pointing at `EXExpoAppSceneDelegate`. SDK 58 adopts scenes by
default, so remove the option on upgrade.

Gradle needs **JDK 17** — React Native's Gradle plugin declares `jvmToolchain(17)`, and
`java` on this machine otherwise resolves to Homebrew's JDK 26. Do not point `JAVA_HOME` at
Android Studio's bundled runtime: it changes JDK version whenever Studio updates. Use
Homebrew's keg-only formula and set it in `~/.zshenv`, so non-interactive shells (Gradle,
Expo) see it too:

```sh
brew install openjdk@17
# in ~/.zshenv
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

Use the **formula**, not the `zulu@17` cask. Casks ship a `.pkg` that needs root, and this
account is not a sudoer; running `brew` as another user leaves `admin`-owned files in
`/opt/homebrew` that break later upgrades. Skip the `sudo ln` that brew suggests too —
it only registers the JDK with `/usr/libexec/java_home`, and `JAVA_HOME` makes that
unnecessary.

`sdkmanager` is deprecated; `cmdline-tools/latest/bin/android sdk list|update` replaces it.

macOS's `/usr/bin/git` is an Xcode shim, so installing or updating Xcode invalidates the
accepted licence and takes **git** down with it until you run `sudo xcodebuild -license
accept`.
