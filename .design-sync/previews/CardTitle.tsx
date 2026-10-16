import { View, CardTitle, Caption, LymphaProvider, space } from 'lympha';

export const RecipeName = () => (
  <View style={{ width: 300 }}>
    <CardTitle numberOfLines={1}>Rao’s Recipe</CardTitle>
    <Caption tone="secondary" numberOfLines={1}>
      Scott Rao
    </Caption>
  </View>
);

export const SettingsLabels = () => (
  <View style={{ width: 300, gap: space.snug }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <CardTitle>Water</CardTitle>
      <Caption tone="secondary">Millilitres</Caption>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <CardTitle>Rounding limit</CardTitle>
      <Caption tone="secondary">10%</Caption>
    </View>
  </View>
);

export const Tones = () => (
  <View style={{ gap: space.tight }}>
    <CardTitle>Rao’s Recipe</CardTitle>
    <CardTitle tone="secondary">Rao’s Recipe</CardTitle>
    <CardTitle tone="warning">14% over target</CardTitle>
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 300 }}>
    <CardTitle numberOfLines={1}>Rao’s Recipe</CardTitle>
    <Caption tone="secondary" numberOfLines={1}>
      Scott Rao
    </Caption>
  </LymphaProvider>
);
