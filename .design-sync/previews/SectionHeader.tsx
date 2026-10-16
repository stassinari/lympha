import { View, SectionHeader, CardTitle, Caption, LymphaProvider, space } from 'lympha';

export const Settings = () => (
  <View style={{ width: 354, gap: space.blocks }}>
    <SectionHeader tone="secondary">Appearance</SectionHeader>
    <SectionHeader tone="secondary">Units</SectionHeader>
    <SectionHeader tone="secondary">Brewing</SectionHeader>
  </View>
);

export const OverContent = () => (
  <View style={{ width: 354, gap: space.snug }}>
    <SectionHeader tone="secondary">Per bottle</SectionHeader>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <CardTitle>Rounding limit</CardTitle>
      <Caption tone="secondary">10%</Caption>
    </View>
  </View>
);

export const Primary = () => <SectionHeader>In the water</SectionHeader>;

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 354, gap: space.blocks }}>
    <SectionHeader tone="secondary">Appearance</SectionHeader>
    <SectionHeader tone="secondary">In the water</SectionHeader>
  </LymphaProvider>
);
