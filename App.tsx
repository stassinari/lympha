import { useCallback } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, ThemedStatusBar } from '@/design';
import { fonts } from '@/design/fonts';
import { Root } from '@/screens/Root';
import { useHydrated, useStore } from '@/state';

/**
 * Hold the splash until both the fonts and the stored state are ready.
 *
 * The app opens to the last brew. A frame rendered before storage resolves shows
 * the default 1000 ml, then snaps to the stored volume.
 */
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden, or unavailable. Nothing to recover from.
});

export default function App() {
  const [fontsLoaded] = useFonts(fonts);
  const hydrated = useHydrated();
  const mode = useStore((s) => s.mode);

  const ready = fontsLoaded && hydrated;

  // Hides on the frame that first paints real content, rather than one earlier.
  const onLayout = useCallback(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider onLayout={onLayout}>
      <ThemeProvider mode={mode}>
        <ThemedStatusBar />
        <Root />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
