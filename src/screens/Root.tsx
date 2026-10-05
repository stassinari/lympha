/**
 * The app: one screen, with overlays over it.
 *
 * There is no navigator. Every secondary screen is a full-bleed layer over a
 * persistent dose screen, and the screen underneath moves in sympathy as one
 * arrives. Coordinating an outgoing and an incoming screen is
 * awkward through a navigator and trivial with two layers reading one progress
 * value, and the app has no deep links, no history and no tabs to justify one.
 *
 * The cost is Android's back gesture, wired up here.
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { OverlayLayer, Underlay, useAndroidBack, useOverlayTransition } from '@/design';
import type { OverlayDirection } from '@/design';
import { DetailScreen } from './DetailScreen';
import { DoseScreen } from './DoseScreen';
import { RecipeScreen } from './RecipeScreen';
import { SettingsScreen } from './SettingsScreen';
import { VolumeScreen } from './VolumeScreen';

export type OverlayName = 'volume' | 'recipe' | 'settings' | 'detail';

/** Each screen enters from its trigger: the recipe card and the settings glyph are
 *  both at the top, Edit is mid-screen on the right, and Details is the footer.
 *  The direction is not decoration — it is what tells you which thing you
 *  touched, so it follows the control. */
const DIRECTION: Record<OverlayName, OverlayDirection> = {
  recipe: 'top',
  volume: 'right',
  settings: 'top',
  detail: 'bottom',
};

export function Root() {
  const [overlay, setOverlay] = useState<OverlayName | null>(null);
  const close = useCallback(() => setOverlay(null), []);

  const { progress, mounted } = useOverlayTransition(overlay !== null);
  useAndroidBack(overlay !== null, close);

  // Held through the exit, so the closing screen keeps its identity and its
  // direction all the way out.
  const [leaving, setLeaving] = useState<OverlayName | null>(null);
  if (overlay !== null && overlay !== leaving) setLeaving(overlay);

  const active = overlay ?? leaving;
  const from = active ? DIRECTION[active] : 'bottom';

  return (
    <View style={{ flex: 1 }}>
      <Underlay progress={progress} from={from} hidden={overlay !== null}>
        <DoseScreen
          onEditVolume={() => setOverlay('volume')}
          onChangeRecipe={() => setOverlay('recipe')}
          onOpenSettings={() => setOverlay('settings')}
          onOpenDetails={() => setOverlay('detail')}
        />
      </Underlay>

      {mounted && active ? (
        <OverlayLayer progress={progress} from={from} modal={overlay !== null}>
          {active === 'volume' ? <VolumeScreen onClose={close} /> : null}
          {active === 'recipe' ? <RecipeScreen onClose={close} /> : null}
          {active === 'settings' ? <SettingsScreen onClose={close} /> : null}
          {active === 'detail' ? <DetailScreen onClose={close} /> : null}
        </OverlayLayer>
      ) : null}
    </View>
  );
}
