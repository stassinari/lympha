/**
 * Target against what you get, and how far apart they are.
 *
 * The whole differentiator in one shape: one row per thing being measured, and
 * the delivered value marked when it misses. Vendor calculators print only the
 * first column.
 *
 * The last column is what makes the headline percentage checkable. Without it the
 * reader has to work out which row the summary number came from and redo the
 * division themselves, on figures already rounded for display.
 */

import { View } from 'react-native';
import { Caption, Card, CardTitle, Divider, Icon, space, useTheme, useTypeMetrics } from '@/design';
import { EXACT } from '@/format/rounding';
import { formatGapPercent } from '@/format/units';

export type ComparisonRow = {
  label: string;
  asked: string;
  got: string;
  /** Draws the delivered value, and its arrow, in that state's colour. */
  off?: 'warning' | 'error' | null;
  /** Which side of the target it landed on. Only read when `off`. */
  direction?: 'under' | 'over';
  /** Signed relative error. Omitted on every row hides the column. */
  gap?: number;
};

const COLUMN = { flex: 1, alignItems: 'flex-end' } as const;
const LABEL_COLUMN = { flex: 1.4 } as const;

const MARK_SIZE = 14;

/**
 * A miss is marked with an arrow as well as a colour.
 *
 * The warning tone alone carries the whole message here, which fails anyone with
 * a red-green deficiency and everyone reading a phone in sunlight — the two
 * values are otherwise identical in size, weight and position. The arrow is
 * shape rather than hue, and it says something the colour could not: which way
 * the miss went.
 *
 * An arrow, not a caret: a caret is the shape for expand and collapse, and what
 * this means is *rounded up*. Plain `ArrowUp` rather than a fatter one: this appears four
 * times in one small table, and a chunky glyph both blurs at 14pt and overstates
 * the message — drops are integers so we nudged, not "significant increase".
 *
 * It takes the app's default `bold` like every other non-status icon; at 14pt
 * beside a 17pt semibold value a hairline reads as a smudge rather than a mark.
 *
 * Rounded down turns the same arrow through half a turn. Phosphor's arrow is
 * symmetric about its shaft, so this is exactly the drawing the set would ship
 * as `ArrowDown` — and it keeps the app's icon count at the six it means to have.
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
  // Baseline-aligned, like everything else in the row, which puts the mark's
  // bottom edge on the baseline. Lifting it by half the difference centres it in
  // the band the digits occupy rather than leaving it sitting on the floor. Read
  // from the scaled cap height, so it stays centred at any text size.
  const lift = Math.max(0, (capHeight - MARK_SIZE) / 2);

  return (
    <View style={{ marginRight: 4, marginBottom: lift }}>
      <Icon
        name="arrowUp"
        size={MARK_SIZE}
        colour={colour}
        rotate={direction === 'under' ? 180 : 0}
      />
    </View>
  );
}

/** What the row says to a screen reader, which cannot see the column headings. */
function rowLabel(row: ComparisonRow, unit?: string): string {
  const scale = unit ? ` ${unit}` : '';
  return `${row.label}: target ${row.asked}${scale}, you get ${row.got}${scale}${spokenGap(row.gap)}`;
}

/** Words rather than a signed figure: a screen reader reads "+7%" as "plus seven percent",
 *  which says which way only to someone who knows the sign convention. */
function spokenGap(gap: number | undefined): string {
  if (gap === undefined) return '';
  if (Math.abs(gap) < EXACT) return ', on target';
  return `, ${Math.round(Math.abs(gap) * 100)} percent ${gap < 0 ? 'under' : 'over'}`;
}

export function ComparisonTable({ rows, unit }: { rows: ComparisonRow[]; unit?: string }) {
  const { colour } = useTheme();
  const { capHeight } = useTypeMetrics('cardTitle');

  const showGap = rows.some((row) => row.gap !== undefined);
  const headings = showGap ? 'Target, you get, off by.' : 'Target, you get.';

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
          Target
        </Caption>
        <Caption tone="secondary" style={COLUMN}>
          You get
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
                  colour={row.off === 'error' ? colour.error : colour.textWarning}
                  capHeight={capHeight}
                />
              ) : null}
              <CardTitle
                style={{
                  color:
                    row.off === 'error' ? colour.error : row.off ? colour.textWarning : colour.text,
                }}
              >
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
