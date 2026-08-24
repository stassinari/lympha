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
 * "Opens to the answer" is a non-negotiable in the brief, and rendering a frame
 * early breaks it in the most annoying way possible: the app appears showing
 * 1000 ml, then snaps to yesterday's 350 once storage comes back.
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
