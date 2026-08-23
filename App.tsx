import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fonts } from '@/design/fonts';
import Gallery from '@/dev/Gallery';

export default function App() {
  const [loaded] = useFonts(fonts);

  // Nothing renders in a fallback face: the type scale names Nunito families
  // explicitly, so an unloaded font would silently fall back to system.
  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Gallery />
    </SafeAreaProvider>
  );
}
