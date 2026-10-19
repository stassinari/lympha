/**
 * Native modules with nothing to do in a browser preview. Each export matches the
 * slice of the real module's API that `src/` uses.
 */

// expo-haptics
export const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy' } as const;
export async function impactAsync(): Promise<void> {}
export async function selectionAsync(): Promise<void> {}

// expo-status-bar
export function StatusBar(): null {
  return null;
}

// @react-native/assets-registry/registry, which react-native-svg's web build
// consults for bundled image assets inside an SVG. The icons have none.
export function getAssetByID(): undefined {
  return undefined;
}
