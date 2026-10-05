/**
 * Makes the splash a plain page-coloured screen on both platforms.
 *
 * Lympha's splash deliberately has no image: only the page background for each
 * scheme, from `backgroundColor` and `dark.backgroundColor` on
 * `expo-splash-screen` in `app.json`. That plugin assumes there is an image, and
 * without one it leaves each platform broken in a different way. This fills in
 * the two missing steps on every prebuild, so they hold on EAS too, where the
 * native folders are regenerated from scratch and a hand edit would be lost.
 *
 * **iOS.** It generates a `SplashScreenBackground` colour set with a dark
 * variant, but only wires it into `SplashScreen.storyboard` when there is an
 * image (expo/expo#26491). Without one the storyboard keeps the template's
 * `systemBackgroundColor`: pure white in light, pure black in dark.
 *
 * **Android.** Android 12+ always draws an icon on its splash, and falls back to
 * the launcher icon if the app names none. The plugin always names
 * `@drawable/splashscreen_logo`, but deletes that drawable when there is no
 * image, so the build fails to link. The icon is pointed at a transparent
 * colour instead, which is the standard way to have no icon at all.
 *
 * **This plugin must be listed before `expo-splash-screen`.** That plugin
 * registers the storyboard's file provider as it runs, and a provider has to be
 * the last thing added to its mod, so a plugin listed after it fails prebuild
 * with "Provider must be the last mod added". The order also matters on
 * Android: mods run in reverse of the order they are added, so being listed
 * first is what makes this run after `expo-splash-screen` has written its
 * styles, and win.
 */

const { withAndroidStyles, withMod } = require('expo/config-plugins');

const COLOUR_NAME = 'SplashScreenBackground';
const SPLASH_STYLE = 'Theme.App.SplashScreen';
const ICON_ITEM = 'windowSplashScreenAnimatedIcon';

/** The view controller's root view: the one whose background is the splash. */
function rootView(xml) {
  return xml.document?.scenes?.[0]?.scene?.[0]?.objects?.[0]?.viewController?.[0]?.view?.[0];
}

function withIosStoryboardBackground(config) {
  return withMod(config, {
    platform: 'ios',
    mod: 'splashScreenStoryboard',
    action: (config) => {
      const view = rootView(config.modResults);
      if (!view) {
        throw new Error('withSplashBackground: SplashScreen.storyboard has no root view.');
      }

      // Every other colour on the root view is dropped. It carries only a
      // background, and leaving the template's alongside would be ambiguous.
      view.color = [{ $: { key: 'backgroundColor', name: COLOUR_NAME } }];

      // Interface Builder wants a named colour declared in the document's
      // resources. The value it gives is only a design-time preview; at runtime
      // the colour set in the asset catalogue wins, dark variant included.
      const resources = config.modResults.document.resources?.[0];
      if (resources) {
        resources.systemColor = (resources.systemColor ?? []).filter(
          (c) => c.$?.name !== 'systemBackgroundColor',
        );
        resources.namedColor = [
          ...(resources.namedColor ?? []).filter((c) => c.$?.name !== COLOUR_NAME),
          { $: { name: COLOUR_NAME } },
        ];
      }

      return config;
    },
  });
}

function withAndroidNoSplashIcon(config) {
  return withAndroidStyles(config, (config) => {
    const style = config.modResults.resources.style?.find((s) => s.$?.name === SPLASH_STYLE);
    if (!style) {
      throw new Error(`withSplashBackground: styles.xml has no ${SPLASH_STYLE} style.`);
    }
    style.item = [
      ...(style.item ?? []).filter((i) => i.$?.name !== ICON_ITEM),
      { $: { name: ICON_ITEM }, _: '@android:color/transparent' },
    ];
    return config;
  });
}

function withSplashBackground(config) {
  return withAndroidNoSplashIcon(withIosStoryboardBackground(config));
}

module.exports = withSplashBackground;
