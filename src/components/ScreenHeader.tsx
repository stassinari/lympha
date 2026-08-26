/**
 * The bar at the top of every screen that covers another.
 *
 * One component rather than the same twenty lines in five files, because what it
 * encodes is a platform convention and conventions have to be applied
 * identically or they are not conventions. iOS dismisses with a text control on
 * the trailing edge; Android dismisses with a back affordance on the leading
 * edge and expects the system gesture to do the same thing. Neither platform
 * gets the other's, and no screen gets a vote.
 *
 * It is also where the header's accessibility lives: the title carries the
 * heading role — which is what makes rotor and reading-control navigation land
 * somewhere useful — and the dismiss control is given a target that clears the
 * platform minimum despite being drawn as a 20px glyph.
 */

import { Platform, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Body, Icon, ScreenTitle, Touchable, resolveAccent, space, useTheme } from '@/design';
import { useBrand } from '@/state';

/**
 * Android's back affordance: the trailing chevron turned through half a turn.
 *
 * The set ships one caret and it points right. Phosphor's caret is symmetric
 * about its point, so a half turn is the drawing the library would call
 * `CaretLeft` — which keeps the app's icon count at six rather than adding a
 * seventh name for a shape it already has. Same 20pt as the settings rows, so
 * every caret in the app is one size.
 */
const BACK = 20;

/**
 * Expands the chevron to a 48px target without moving it.
 *
 * The alternative — padding the button out to 48 square, or giving the bar a
 * minimum height — would push the glyph inboard of the screen's content edge or
 * the title down the screen, and the header would no longer line up with the
 * cards beneath it. `hitSlop` is the property that exists for precisely this:
 * touch area without layout, so the target clears both platforms' minimums while
 * the bar keeps the height the design drew.
 */
const HIT_SLOP = 14;

export type ScreenHeaderProps = {
  title: string;
  onClose: () => void;
  /** Overrides the current brand's accent, for a screen about a different brand. */
  accent?: string;
  /** Set to 0 where the surrounding `Screen` already provides the inset. */
  inset?: number;
  /** For a screen that wants a different gap below the bar. */
  style?: StyleProp<ViewStyle>;
};

export function ScreenHeader({
  title,
  onClose,
  accent,
  inset = space.screenH,
  style,
}: ScreenHeaderProps) {
  const { colour, scheme } = useTheme();
  const brand = useBrand();
  const tint = accent ?? resolveAccent(brand.accent, scheme);

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: space.blocks,
          paddingHorizontal: inset,
        },
        style,
      ]}
    >
      {Platform.OS === 'android' ? (
        <Touchable borderless onPress={onClose} hitSlop={HIT_SLOP} accessibilityLabel="Back">
          <Icon name="chevronRight" size={BACK} rotate={180} colour={colour.text} />
        </Touchable>
      ) : null}
      <ScreenTitle style={{ flex: 1, marginLeft: Platform.OS === 'android' ? 10 : 0 }}>
        {title}
      </ScreenTitle>
      {Platform.OS === 'ios' ? (
        <Touchable onPress={onClose} hitSlop={HIT_SLOP} accessibilityLabel="Done">
          <Body style={{ color: tint }}>Done</Body>
        </Touchable>
      ) : null}
    </View>
  );
}
