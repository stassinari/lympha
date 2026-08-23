import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/design';
import { fonts } from '@/design/fonts';
import { DoseScreen } from '@/screens/DoseScreen';

export default function App() {
  const [loaded] = useFonts(fonts);

  // Nothing renders in a fallback face: the type scale names Nunito families
  // explicitly, so an unloaded font would silently fall back to system.
  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      {/* Follows the device until Slice 6 gives the setting somewhere to live. */}
      <ThemeProvider mode="system">
        <StatusBar style="auto" />
        <DoseScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
