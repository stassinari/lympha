/**
 * Asked against got.
 *
 * The whole differentiator in one shape: three columns, one row per thing being
 * measured, and the delivered value marked when it misses. Vendor calculators
 * print only the first column.
 */

import { View } from 'react-native';
import { Caption, Card, CardTitle, Divider, space, useTheme } from '@/design';

export type ComparisonRow = {
  label: string;
  asked: string;
  got: string;
  /** Draws the delivered value in the warning tone. */
  off?: boolean;
};

const COLUMN = { flex: 1, alignItems: 'flex-end' } as const;

export function ComparisonTable({ rows, unit }: { rows: ComparisonRow[]; unit?: string }) {
  const { colour } = useTheme();

  return (
    <Card paddingVertical={space.blocks}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <CardTitle style={{ flex: 1.4 }} numberOfLines={1}>
              {row.label}
            </CardTitle>
            <Caption tone="secondary" style={COLUMN}>
              {row.asked}
            </Caption>
            <CardTitle style={[COLUMN, { color: row.off ? colour.textWarning : colour.text }]}>
              {row.got}
            </CardTitle>
          </View>
        </View>
      ))}
    </Card>
  );
}
