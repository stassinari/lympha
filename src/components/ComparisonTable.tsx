/**
 * Asked against got.
 *
 * The whole differentiator in one shape: three columns, one row per thing being
 * measured, and the delivered value marked when it misses. Vendor calculators
 * print only the first column.
 */

import { View } from 'react-native';
import {
  Caption,
  Card,
  CardTitle,
  Chevron,
  Divider,
  chevronBox,
  space,
  useTheme,
  useTypeMetrics,
} from '@/design';

export type ComparisonRow = {
  label: string;
  asked: string;
  got: string;
  /** Draws the delivered value in the warning tone. */
  off?: boolean;
  /** Which side of the target it landed on. Only read when `off`. */
  direction?: 'under' | 'over';
};

const COLUMN = { flex: 1, alignItems: 'flex-end' } as const;

/**
 * A miss is marked with a chevron as well as a colour.
 *
 * The warning tone alone carries the whole message here, which fails anyone with
 * a red-green deficiency and everyone reading a phone in sunlight — the two
 * values are otherwise identical in size, weight and position. The chevron is
 * shape rather than hue, and it says something the colour could not: which way
 * the miss went.
 *
 * Drawn rather than set, for the same reason the rest of the app's icons are —
 * Nunito has no arrows, so a text glyph would fall back to the system font.
 */
const MARK_SIZE = 7;

function MissMark({
  direction,
  colour,
  capHeight,
}: {
  direction: 'under' | 'over';
  colour: string;
  capHeight: number;
}) {
  // Baseline-aligned, like everything else in the row, which puts the chevron's
  // bottom edge on the baseline. Lifting it by half the difference centres it in
  // the band the digits occupy rather than leaving it sitting on the floor.
  const lift = Math.max(0, (capHeight - chevronBox(MARK_SIZE).height) / 2);

  return (
    <View style={{ marginRight: 4, marginBottom: lift }}>
      <Chevron
        direction={direction === 'under' ? 'down' : 'up'}
        size={MARK_SIZE}
        thickness={1.5}
        colour={colour}
      />
    </View>
  );
}

/** What the row says to a screen reader, which cannot see the column headings. */
function rowLabel(row: ComparisonRow, unit?: string): string {
  const scale = unit ? ` ${unit}` : '';
  const miss = row.off ? `, ${row.direction ?? 'off'} target` : '';
  return `${row.label}: asked ${row.asked}${scale}, get ${row.got}${scale}${miss}`;
}

export function ComparisonTable({ rows, unit }: { rows: ComparisonRow[]; unit?: string }) {
  const { colour } = useTheme();
  const { capHeight } = useTypeMetrics('cardTitle');

  return (
    <Card paddingVertical={space.blocks}>
      <View
        accessible
        accessibilityLabel={unit ? `Measured in ${unit}. Asked, and get.` : 'Asked, and get.'}
        style={{ flexDirection: 'row', alignItems: 'flex-end' }}
      >
        <Caption tone="secondary" style={{ flex: 1.4 }}>
          {unit ?? ''}
        </Caption>
        <Caption tone="secondary" style={COLUMN}>
          Asked
        </Caption>
        <Caption tone="secondary" style={COLUMN}>
          Get
        </Caption>
      </View>

      {rows.map((row, i) => (
        <View key={row.label}>
          <View style={{ marginVertical: space.snug }}>{i > 0 ? <Divider /> : null}</View>
          {/* One element, not three: read separately, "Magnesium" / "2.4" / "2"
              is three fragments with nothing to tie them together. */}
          <View
            accessible
            accessibilityLabel={rowLabel(row, unit)}
            style={{ flexDirection: 'row', alignItems: 'baseline' }}
          >
            <CardTitle style={{ flex: 1.4 }} numberOfLines={1}>
              {row.label}
            </CardTitle>
            <Caption tone="secondary" style={COLUMN}>
              {row.asked}
            </Caption>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline' }}>
              {row.off && row.direction ? (
                <MissMark
                  direction={row.direction}
                  colour={colour.textWarning}
                  capHeight={capHeight}
                />
              ) : null}
              <CardTitle style={{ color: row.off ? colour.textWarning : colour.text }}>
                {row.got}
              </CardTitle>
            </View>
          </View>
        </View>
      ))}
    </Card>
  );
}
