import { View, Caption, CardTitle, LymphaProvider, space } from 'lympha';

export const Subtitle = () => (
  <View style={{ width: 300 }}>
    <CardTitle>Rao’s Recipe</CardTitle>
    <Caption tone="secondary">Scott Rao</Caption>
  </View>
);

export const Tones = () => (
  <View style={{ width: 300, gap: space.tight }}>
    <Caption>30 drops</Caption>
    <Caption tone="secondary">Millilitres</Caption>
    <Caption tone="warning">14% over target</Caption>
    <Caption tone="error">No Potassium at 170 ml</Caption>
  </View>
);

export const TableHeader = () => (
  <View style={{ width: 354, flexDirection: 'row' }}>
    <Caption tone="secondary" style={{ flex: 1 }}>
      ppm CaCO₃
    </Caption>
    <Caption tone="secondary" style={{ width: 70, textAlign: 'right' }}>
      Target
    </Caption>
    <Caption tone="secondary" style={{ width: 70, textAlign: 'right' }}>
      You get
    </Caption>
    <Caption tone="secondary" style={{ width: 70, textAlign: 'right' }}>
      Off by
    </Caption>
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 300, gap: space.tight }}>
    <Caption tone="secondary">Scott Rao</Caption>
    <Caption tone="error">No Potassium at 170 ml</Caption>
  </LymphaProvider>
);
