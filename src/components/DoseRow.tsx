/**
 * One bottle, one number.
 *
 * The value and its unit share a baseline; the name is optically centred against
 * the value rather than sharing that baseline. Baseline-aligning them looks
 * wrong — the platforms distribute line-height slack differently and neither puts
 * a text box on its own marks, so a 40px numeral and a 20px name never line up by
 * accident. `capBoxPadding` squares both boxes about their cap blocks so plain
 * centring aligns what the eye actually sees.
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

/**
 * A row marked as added recedes rather than disappearing, so the list keeps its
 * shape and you can still see what you poured.
 *
 * The handoff expresses this as `opacity: 0.42` on the whole row. That is a web
 * idiom, and on Android a group alpha over a card, its elevation shadow and its
 * text children composites badly — measured on a Pixel 8 it leaves a pale band,
 * exactly the height of the numeral's cap block, across an otherwise grey row.
 *
 * The same recession is expressed in colour instead: the card drops to the page
 * background so it stops reading as a raised surface, its shadow goes with it,
 * the text steps down to the secondary tone, and only the colour bar actually
 * fades — a leaf view with nothing behind it, where alpha is unambiguous. No
 * offscreen layers, and no platform divergence.
 */
const DONE_BAR_OPACITY = 0.42;

export type DoseRowProps = {
  line: DoseLine;
  /** Marked off as poured. Changing volume, brand or recipe clears these. */
  done?: boolean;
  onPress?: () => void;
};

export function DoseRow({ line, done = false, onPress }: DoseRowProps) {
  const { colour, scheme } = useTheme();
  const { bar, edge } = resolveBarColour(line.component.colour, scheme);

  const amount = formatDoseAmount(line.delivered, line.dispenser.step);
  const unit = formatUnit(line.dispenser.unit, line.delivered);
  const alternative = line.alternative;
  const tone = done ? 'secondary' : 'primary';

  return (
    <BarRow
      barColour={bar}
      barEdgeColour={edge}
      barOpacity={done ? DONE_BAR_OPACITY : 1}
      surfaceColour={done ? colour.background : undefined}
      elevated={!done}
      onPress={onPress}
      paddingVertical={0}
      paddingHorizontal={space.cardH}
      contentStyle={ROW_PADDING}
      accessibilityLabel={`${line.component.name}, ${amount} ${unit}`}
      accessibilityState={{ checked: done }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[{ flex: 1 }, TITLE_BOX]}>
          <RowTitle tone={tone} style={done ? { textDecorationLine: 'line-through' } : undefined}>
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
          <DoseValue tone={tone}>{amount}</DoseValue>
          <UnitLabel tone="secondary" style={{ marginLeft: 6 }}>
            {unit}
          </UnitLabel>
        </View>
      </View>
    </BarRow>
  );
}
