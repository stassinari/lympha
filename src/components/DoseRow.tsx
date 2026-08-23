/**
 * One bottle, one number.
 *
 * The value and its unit share a baseline; the name is optically centred against
 * the value rather than sharing that baseline. Baseline-aligning them looks
 * wrong — React Native pins the descent and puts all line-height slack above the
 * baseline, so a 40px numeral's marks sit far higher in its box than a 20px
 * name's do, and the name reads about 7px low. `capBoxPadding` squares both boxes
 * about their cap blocks so plain centring aligns what the eye actually sees.
 */

import { View } from 'react-native';
import {
  BarRow,
  Caption,
  DoseValue,
  RowTitle,
  UnitLabel,
  capBoxInset,
  capBoxPadding,
  opticalPadding,
  resolveBarColour,
  space,
  typeScale,
  useTheme,
} from '@/design';
import { formatDoseAmount, formatUnit } from '@/format/units';
import type { DoseLine } from '@/engine';

const value = typeScale.doseValue;
const title = typeScale.rowTitle;

/** Both columns squared about their cap blocks, so `alignItems: 'center'` lands. */
const VALUE_BOX = capBoxPadding(value.fontSize, value.lineHeight, value.weight, 'digits');
const TITLE_BOX = capBoxPadding(title.fontSize, title.lineHeight, title.weight, 'text');

/**
 * Once the value box is squared its slack is the same on both sides, so the row's
 * own padding is measured against that rather than against the raw line box.
 */
const VALUE_INSET = capBoxInset(value.fontSize, value.lineHeight, value.weight, 'digits');
const ROW_PADDING = opticalPadding(
  { top: space.rowInk, bottom: space.rowInk },
  { top: VALUE_INSET, bottom: VALUE_INSET },
);

export type DoseRowProps = {
  line: DoseLine;
  /** Marked off as poured. Changing volume, brand or recipe clears these. */
  done?: boolean;
  onPress?: () => void;
};

export function DoseRow({ line, done = false, onPress }: DoseRowProps) {
  const { scheme } = useTheme();
  const { bar, edge } = resolveBarColour(line.component.colour, scheme);

  const amount = formatDoseAmount(line.delivered, line.dispenser.step);
  const unit = formatUnit(line.dispenser.unit, line.delivered);
  const alternative = line.alternative;

  return (
    <BarRow
      barColour={bar}
      barEdgeColour={edge}
      onPress={onPress}
      paddingVertical={0}
      paddingHorizontal={space.cardH}
      contentStyle={ROW_PADDING}
      accessibilityLabel={`${line.component.name}, ${amount} ${unit}`}
      accessibilityState={{ checked: done }}
      style={done ? { opacity: 0.42 } : undefined}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[{ flex: 1 }, TITLE_BOX]}>
          <RowTitle style={done ? { textDecorationLine: 'line-through' } : undefined}>
            {line.component.name}
          </RowTitle>
          {alternative ? (
            <Caption tone="secondary">
              {formatDoseAmount(alternative.delivered, alternative.dispenser.step)}{' '}
              {formatUnit(alternative.dispenser.unit, alternative.delivered)}
            </Caption>
          ) : null}
        </View>
        <View style={[{ flexDirection: 'row', alignItems: 'baseline' }, VALUE_BOX]}>
          <DoseValue>{amount}</DoseValue>
          <UnitLabel tone="secondary" style={{ marginLeft: 6 }}>
            {unit}
          </UnitLabel>
        </View>
      </View>
    </BarRow>
  );
}
