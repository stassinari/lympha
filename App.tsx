import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { fonts } from '@/design/fonts';
import TypeSpecimen from '@/dev/TypeSpecimen';

export default function App() {
  const [loaded] = useFonts(fonts);

  // Nothing in the app renders in a fallback face: the type scale names Nunito
  // families explicitly, so an unloaded font would silently fall back to system.
  if (!loaded) return null;

  return (
    <>
      <StatusBar style="auto" />
      <TypeSpecimen />
    </>
  );
}
