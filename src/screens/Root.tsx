/**
 * The app: one screen, with overlays over it.
 *
 * There is no navigator. Every secondary screen is a full-bleed layer over a
 * persistent dose screen, and the handoff requires the screen underneath to move
 * in sympathy as one arrives. Coordinating an outgoing and an incoming screen is
 * awkward through a navigator and trivial with two layers, and the app has no
 * deep links, no history and no tabs to justify one.
 *
 * The cost is Android's back gesture, which each overlay wires up itself.
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Overlay } from '@/design';
import { DoseScreen } from './DoseScreen';
import { VolumeScreen } from './VolumeScreen';

export type OverlayName = 'volume' | 'recipe' | 'settings';

export function Root() {
  const [overlay, setOverlay] = useState<OverlayName | null>(null);
  const close = useCallback(() => setOverlay(null), []);

  return (
    <View style={{ flex: 1 }}>
      <DoseScreen onEditVolume={() => setOverlay('volume')} onChangeRecipe={() => {}} />

      <Overlay visible={overlay === 'volume'} from="right" onRequestClose={close}>
        <VolumeScreen onClose={close} />
      </Overlay>
    </View>
  );
}
