import { View, UnitLabel, DoseValue, LymphaProvider, space } from 'lympha';

export const Units = () => (
  <View style={{ flexDirection: 'row', gap: space.loose }}>
    <UnitLabel tone="secondary">drop</UnitLabel>
    <UnitLabel tone="secondary">drops</UnitLabel>
    <UnitLabel tone="secondary">g</UnitLabel>
  </View>
);

export const BesideValue = () => (
  <View style={{ flexDirection: 'row', gap: space.loose }}>
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <DoseValue>4</DoseValue>
      <UnitLabel tone="secondary" style={{ marginLeft: 6 }}>
        drops
      </UnitLabel>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <DoseValue>1</DoseValue>
      <UnitLabel tone="secondary" style={{ marginLeft: 6 }}>
        drop
      </UnitLabel>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <DoseValue>0.5</DoseValue>
      <UnitLabel tone="secondary" style={{ marginLeft: 6 }}>
        g
      </UnitLabel>
    </View>
  </View>
);

export const Dark = () => (
  <LymphaProvider
    scheme="dark"
    style={{ padding: space.blocks, flexDirection: 'row', alignItems: 'baseline' }}
  >
    <DoseValue>5</DoseValue>
    <UnitLabel tone="secondary" style={{ marginLeft: 6 }}>
      drops
    </UnitLabel>
  </LymphaProvider>
);
