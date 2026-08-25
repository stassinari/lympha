/**
 * Asked against got, and how far apart they are.
 *
 * The whole differentiator in one shape: one row per thing being measured, and
 * the delivered value marked when it misses. Vendor calculators print only the
 * first column.
 *
 * The last column exists because the headline percentage could not be checked
 * without it. The screen showed six figures and one summary number, and left the
 * reader to work out which row it came from and to redo the division themselves —
 * on figures that had already been rounded for display. Printing the gap on each
 * row removes both steps.
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
import { formatGapPercent } from '@/format/units';

export type ComparisonRow = {
  label: string;
  asked: string;
  got: string;
  /** Draws the delivered value in the warning tone. */
  off?: boolean;
  /** Which side of the target it landed on. Only read when `off`. */
  direction?: 'under' | 'over';
  /** Signed relative error. Omitted on every row hides the column. */
  gap?: number;
};

const COLUMN = { flex: 1, alignItems: 'flex-end' } as const;
const LABEL_COLUMN = { flex: 1.4 } as const;

const MARK_SIZE = 7;

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
  const gap = row.gap === undefined ? '' : `, off by ${formatGapPercent(row.gap)}`;
  return `${row.label}: asked ${row.asked}${scale}, get ${row.got}${scale}${gap}`;
}

export function ComparisonTable({ rows, unit }: { rows: ComparisonRow[]; unit?: string }) {
  const { colour } = useTheme();
  const { capHeight } = useTypeMetrics('cardTitle');

  const showGap = rows.some((row) => row.gap !== undefined);
  const headings = showGap ? 'Asked, get, and off by.' : 'Asked, and get.';

  return (
    <Card paddingVertical={space.blocks}>
      <View
        accessible
        accessibilityLabel={unit ? `Measured in ${unit}. ${headings}` : headings}
        style={{ flexDirection: 'row', alignItems: 'flex-end' }}
      >
        <Caption tone="secondary" style={LABEL_COLUMN}>
          {unit ?? ''}
        </Caption>
        <Caption tone="secondary" style={COLUMN}>
          Asked
        </Caption>
        <Caption tone="secondary" style={COLUMN}>
          Get
        </Caption>
        {showGap ? (
          <Caption tone="secondary" style={COLUMN}>
            Off by
          </Caption>
        ) : null}
      </View>

      {rows.map((row, i) => (
        <View key={row.label}>
          <View style={{ marginVertical: space.snug }}>{i > 0 ? <Divider /> : null}</View>
          {/* One element, not four: read separately, "Magnesium" / "2.4" / "2" /
              "+7%" is four fragments with nothing to tie them together. */}
          <View
            accessible
            accessibilityLabel={rowLabel(row, unit)}
            style={{ flexDirection: 'row', alignItems: 'baseline' }}
          >
            <CardTitle style={LABEL_COLUMN} numberOfLines={1}>
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
            {showGap ? (
              <Caption tone="secondary" style={COLUMN}>
                {row.gap === undefined ? '' : formatGapPercent(row.gap)}
              </Caption>
            ) : null}
          </View>
        </View>
      ))}
    </Card>
  );
}
