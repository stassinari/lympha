import { View, RowTitle, Caption, LymphaProvider, space } from 'lympha';

export const Bottles = () => (
  <View style={{ gap: space.tight }}>
    <RowTitle>Magnesium</RowTitle>
    <RowTitle>Calcium</RowTitle>
    <RowTitle>Potassium</RowTitle>
  </View>
);

export const WithAlternative = () => (
  <View>
    <RowTitle>TONIK</RowTitle>
    <Caption tone="secondary">30 drops</Caption>
  </View>
);

export const Done = () => (
  <View style={{ gap: space.tight }}>
    <RowTitle style={{ textDecorationLine: 'line-through' }}>Magnesium</RowTitle>
    <RowTitle>Calcium</RowTitle>
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, gap: space.tight }}>
    <RowTitle>Sodium</RowTitle>
    <RowTitle style={{ textDecorationLine: 'line-through' }}>Magnesium</RowTitle>
  </LymphaProvider>
);
