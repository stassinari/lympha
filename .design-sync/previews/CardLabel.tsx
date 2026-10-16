import { View, CardLabel, Volume, VolumeUnit, LymphaProvider, space } from 'lympha';

export const Alone = () => <CardLabel tone="secondary">Water</CardLabel>;

export const OverVolume = () => (
  <View>
    <CardLabel tone="secondary">Water</CardLabel>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: space.labelGap }}>
      <Volume>350</Volume>
      <VolumeUnit tone="secondary" style={{ marginLeft: 6 }}>
        ml
      </VolumeUnit>
    </View>
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks }}>
    <CardLabel tone="secondary">Water</CardLabel>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: space.labelGap }}>
      <Volume>350</Volume>
      <VolumeUnit tone="secondary" style={{ marginLeft: 6 }}>
        ml
      </VolumeUnit>
    </View>
  </LymphaProvider>
);
