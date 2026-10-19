/**
 * Everything the Claude Design build exposes on `window.Lympha`.
 *
 * The design system, the app's components and its screens, plus the dose engine,
 * the vendor data and the formatters, so a design can compute real doses rather
 * than invent them, and React Native's layout primitives.
 */

export * from '../../src/design';
export * from '../../src/components';
// Not in the components index: only the volume screen uses it.
export * from '../../src/components/VolumeNudge';
export * from '../../src/engine';
export * from '../../src/data';
export * from '../../src/format/units';
export * from '../../src/format/rounding';
export * from '../../src/format/recipeList';
// The state hooks read the enclosing `LymphaProvider`'s store (`./store.tsx`).
export * from '../../src/state';
export * from '../../src/screens/Root';
export * from '../../src/screens/DoseScreen';
export * from '../../src/screens/VolumeScreen';
export * from '../../src/screens/RecipeScreen';
export * from '../../src/screens/SettingsScreen';
export * from '../../src/screens/KitsScreen';
export * from '../../src/screens/FactSheetScreen';
export * from '../../src/screens/DetailScreen';
export * from './LymphaProvider';

// Layout glue. A design composes the components with the same primitives the app
// does, so its layout carries over to React Native as written.
export { ScrollView, StyleSheet, Switch, View } from 'react-native';
