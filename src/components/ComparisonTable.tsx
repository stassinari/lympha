/**
 * Target against what you get, and how far apart they are.
 *
 * The whole differentiator in one shape: one row per thing being measured, and
 * how far each one misses. Vendor calculators print only the
 * first column.
 *
 * The last column is what makes the headline percentage checkable. Without it the
 * reader has to work out which row the summary number came from and redo the
 * division themselves, on figures already rounded for display.
 */

import { View } from 'react-native';
import { Body, Caption, Card, CardTitle, Divider, space, useTheme } from '@/design';
import { ON_TARGET } from '@/format/rounding';
import { formatGapPercent } from '@/format/units';

export type ComparisonRow = {
  label: string;
  target: string;
  delivered: string;
  /** Signed relative error. Omitted on every row hides the column. */
  gap?: number;
  /** Draws the off-by figure in that state's colour. */
  tone?: 'warning' | 'error' | null;
};

const LABEL_COLUMN = { flex: 1.4 } as const;

/**
 * Number columns are right-aligned, headings included, so units line up under
 * units and a column reads down as one set of figures. Nunito's figures are
 * tabular by default, so no font feature is needed for the digits to stack.
 */
const COLUMN = { flex: 1, textAlign: 'right' } as const;

/** What the row says to a screen reader, which cannot see the column headings. */
function rowLabel(row: ComparisonRow, unit?: string): string {
  const scale = unit ? ` ${unit}` : '';
  return `${row.label}: target ${row.target}${scale}, you get ${row.delivered}${scale}${spokenGap(row.gap)}`;
}

/** Words rather than a signed figure: a screen reader reads "+7%" as "plus seven percent",
 *  which says which way only to someone who knows the sign convention. */
function spokenGap(gap: number | undefined): string {
  if (gap === undefined) return '';
  if (Math.abs(gap) < ON_TARGET) return ', on target';
  return `, ${Math.round(Math.abs(gap) * 100)} percent ${gap < 0 ? 'under' : 'over'}`;
}

/**
 * The emphasis is on "Off by", not "You get": the difference is the answer, and
 * the two amounts are the working. The figure itself says how far and which way;
 * its colour adds only the band, which the headline above states in words.
 */
export function ComparisonTable({ rows, unit }: { rows: ComparisonRow[]; unit?: string }) {
  const { colour } = useTheme();

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
            <Body tone="secondary" style={COLUMN}>
              {row.target}
            </Body>
            <Body style={COLUMN}>{row.delivered}</Body>
            {showGap ? (
              <CardTitle
                style={[
                  COLUMN,
                  {
                    color:
                      row.tone === 'error'
                        ? colour.error
                        : row.tone === 'warning'
                          ? colour.textWarning
                          : colour.text,
                  },
                ]}
              >
                {row.gap === undefined ? '' : formatGapPercent(row.gap)}
              </CardTitle>
            ) : null}
          </View>
        </View>
      ))}
    </Card>
  );
}
