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
 *
 * The bar is a fixed band rather than a row that measures its own title — see
 * `HEADER_BAND`. Home's header is a 16pt wordmark and these are 24pt titles, and
 * a self-measuring row put the content on those two screens about 13pt apart, so
 * the page jumped as you navigated between them.
 */

import { Platform, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  ActionText,
  HEADER_BAND,
  Icon,
  ScreenTitle,
  Touchable,
  resolveAccent,
  space,
  useTheme,
  useTypeMetrics,
} from '@/design';
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
 * The band is tall enough to hold a 48pt target, but padding the button out to
 * fill it would push the glyph inboard of the screen's content edge and lose its
 * alignment with the cards below. `hitSlop` is the property that exists for
 * precisely this: touch area without layout, so the target clears both
 * platforms' minimums while the glyph stays on the content edge.
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
  /**
   * Squares the title's box about its capitals, so plain centring in the band
   * puts the marks where the eye says the middle is.
   *
   * React Native pins the space below the baseline to the font's descent and
   * stacks the whole line-height slack above it, so a centred line box sits
   * visibly low — and Nunito Black at 24pt has enough descent to show it. Read at
   * the reader's text size rather than the nominal one, so the centring survives
   * dynamic type.
   */
  const titleType = useTypeMetrics('screenTitle');

  return (
    <View
      style={[
        {
          minHeight: HEADER_BAND,
          flexDirection: 'row',
          alignItems: 'center',
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
      <ScreenTitle
        style={[
          { flex: 1, marginLeft: Platform.OS === 'android' ? 10 : 0 },
          titleType.capBoxPadding,
        ]}
      >
        {title}
      </ScreenTitle>
      {Platform.OS === 'ios' ? (
        <Touchable onPress={onClose} hitSlop={HIT_SLOP} accessibilityLabel="Done">
          <ActionText style={{ color: tint }}>Done</ActionText>
        </Touchable>
      ) : null}
    </View>
  );
}
