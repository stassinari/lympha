/**
 * `react-native` for the Claude Design build: react-native-web, reporting iOS.
 *
 * The components branch on `Platform` for chip shape, target size and the header's
 * dismiss control. Reporting `web` would send every `Platform.select` to its
 * `default`, which in `cardShadow` is no shadow at all. iOS is the reference look
 * for design work, so the build answers as iOS.
 *
 * react-native-web's own internals import their `Platform` by relative path, so
 * this override reaches app code only.
 */

import { Platform as WebPlatform } from 'react-native-web';

export * from 'react-native-web';

type Spec<T> = { ios?: T; native?: T; default?: T; [os: string]: T | undefined };

/**
 * react-native-svg's index imports its native module specs even on web, where
 * nothing calls them. Metro tolerates the missing export; esbuild does not.
 */
export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: () => null,
};

export const Platform = {
  ...WebPlatform,
  OS: 'ios' as const,
  select<T>(spec: Spec<T>): T | undefined {
    if ('ios' in spec) return spec.ios;
    if ('native' in spec) return spec.native;
    return spec.default;
  },
};
