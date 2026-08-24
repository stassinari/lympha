/**
 * How much water is in the kettle, and the way to change it.
 *
 * Layout: the label sits *above* the value, and only the value and its unit share
 * a baseline. The Edit control is a separate column, vertically centred.
 */

import { View } from 'react-native';
import {
  AnimatedAppText,
  Card,
  CardLabel,
  Pill,
  VolumeUnit,
  inkInsets,
  opticalGap,
  opticalPadding,
  space,
  typeScale,
  usePulse,
} from '@/design';

/**
 * The card's padding measures to the visible marks rather than to the text boxes,
 * and the two edges are governed by different roles: the small label at the top,
 * the large numeral at the bottom. Getting this from metrics is what lets the
 * design's tight vertical rhythm survive without negative margins.
 */
const label = typeScale.cardLabel;
const value = typeScale.volume;

const LABEL_INSETS = inkInsets(label.fontSize, label.lineHeight, label.weight, 'text');
const VALUE_INSETS = inkInsets(value.fontSize, value.lineHeight, value.weight, 'digits');

const CARD_PADDING = opticalPadding(
  { top: space.cardV, bottom: space.cardV },
  { top: LABEL_INSETS.top, bottom: VALUE_INSETS.bottom },
);

/**
 * Both boxes are tight, so left alone the label all but touches the numeral. The
 * gap is set between the marks, not between the boxes.
 *
 * It has to clear whichever platform leaves the most intrinsic slack, or the one
 * with more would clamp to zero and the two would visibly disagree. Android's
 * even split leaves roughly 8px above a 54px numeral where iOS leaves almost
 * none, so the target sits above that rather than at the handoff's tighter value.
 */
const LABEL_GAP = opticalGap(space.labelGap, LABEL_INSETS, VALUE_INSETS);

export type VolumeCardProps = {
  volumeMl: number;
  onEdit: () => void;
};

export function VolumeCard({ volumeMl, onEdit }: VolumeCardProps) {
  const pulse = usePulse(volumeMl);

  return (
    <Card paddingVertical={0} style={CARD_PADDING}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <CardLabel tone="secondary">Water</CardLabel>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: LABEL_GAP }}>
            <AnimatedAppText variant="volume" style={pulse}>
              {String(volumeMl)}
            </AnimatedAppText>
            <VolumeUnit tone="secondary" style={{ marginLeft: 6 }}>
              ml
            </VolumeUnit>
          </View>
        </View>
        <Pill label="Edit" onPress={onEdit} accessibilityHint="Change the water volume" />
      </View>
    </Card>
  );
}
