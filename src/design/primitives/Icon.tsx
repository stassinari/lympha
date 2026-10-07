/**
 * The app's icon set, behind one door.
 *
 * Six glyphs across the five usages the design allows, and one import site.
 * Nothing else in the app touches `phosphor-react-native` — not a feature
 * component, not another primitive — so the set is countable from this file and
 * swapping the library is a one-file change. The sixth glyph is the rounding
 * line's second state, not a sixth place an icon appears.
 *
 * Named imports rather than a namespace import, so a bundler that shakes (Expo's
 * is opt-in) can drop the other thousand icons.
 *
 * The set is deliberately this small. The design is text-forward: the rounded
 * display type and the coloured bar marks carry the identity, and every extra
 * glyph competes with them. A new name here is a design decision, not a
 * convenience — the four-bar recipe marks in particular stay hand-drawn, because
 * they encode bar count and colour and are doing real information work.
 *
 * ## Weight
 *
 * **Chrome and navigation are `bold`. Status is `fill`. Nothing is `duotone`.**
 *
 * `bold` is the default because the rule belongs to the app, not to any one
 * icon: Phosphor's `regular` is a hairline beside type this heavy. `bold` puts the strokes in the same weight family as the type without changing
 * what the icon is.
 *
 * `fill` is reserved for status, where the glyph is a state rather than an
 * action, and is used only by the rounding line. Solid shapes already mean
 * something specific in this app — they are the mineral bar marks — so a second
 * solid shape language would compete with the element doing the most information
 * work. Status earns the exception because a state is not an action.
 *
 * `duotone` is never right here. Phosphor draws it as one colour with the
 * secondary path at reduced opacity, so against the cream background it is a
 * washed-out ghost rather than the two-tone mark the specimen suggests — and
 * two-tone is the bar marks' job as well.
 *
 * Every icon in the app is decorative: the meaning always sits on the control
 * around it, in its `accessibilityLabel` or in the text beside it. So they are
 * hidden from the accessibility tree here rather than at each call site.
 */

import { View } from 'react-native';
import {
  CaretDownIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CheckIcon,
  GearSixIcon,
  InfoIcon,
} from 'phosphor-react-native';
import type { IconWeight } from 'phosphor-react-native';
import { useTheme } from '../theme';

const glyphs = {
  settings: GearSixIcon,
  chevronDown: CaretDownIcon,
  chevronRight: CaretRightIcon,
  info: InfoIcon,
  check: CheckIcon,
  // The circular sibling of `check`, and the reason it is here rather than the
  // plain one: it shares `info`'s silhouette, so the rounding line's two states
  // swap at the same optical size without the row shifting or changing weight.
  checkCircle: CheckCircleIcon,
} as const;

export type IconName = keyof typeof glyphs;

/** Re-exported so a call site choosing a weight never has to import the library. */
export type { IconWeight };

export type IconProps = {
  name: IconName;
  size?: number;
  /** Defaults to ink. Pass `textSecondary` for the muted roles. */
  colour?: string;
  /** Defaults to `bold`; pass `fill` for status. See the weight rule above. */
  weight?: IconWeight;
  /**
   * Degrees clockwise, applied to the box.
   *
   * Android's back affordance is the right-pointing caret turned a half turn.
   * Phosphor's carets are symmetric about the axis they point along, so this is
   * the same drawing the library ships as a left caret, and it adds no name to
   * the set.
   */
  rotate?: number;
};

export function Icon({ name, size = 24, colour, weight = 'bold', rotate = 0 }: IconProps) {
  const theme = useTheme();
  const tint = colour ?? theme.colour.text;
  const Glyph = glyphs[name];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      // An honest box the size of the glyph, so callers aligning against it —
      // the rounding-line status slot — have a
      // number to measure from rather than a guess.
      style={[
        { width: size, height: size },
        rotate === 0 ? null : { transform: [{ rotate: `${rotate}deg` }] },
      ]}
    >
      <Glyph size={size} color={tint} weight={weight} />
    </View>
  );
}
