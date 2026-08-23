/**
 * Every weight the type scale can name, loaded once at startup.
 *
 * Imported by subpath rather than from the package root. The root index
 * re-exports all sixteen faces — every weight plus italics — and Metro bundles
 * whatever is reachable, so importing from it ships about 1.4MB of fonts the app
 * never renders. Nunito has no italic role in this design.
 */

import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';

export const fonts = {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
};
