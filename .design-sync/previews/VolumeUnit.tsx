import { View, VolumeUnit, Volume, Hero, LymphaProvider, space } from 'lympha';

export const Alone = () => <VolumeUnit tone="secondary">ml</VolumeUnit>;

export const BesideVolume = () => (
  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
    <Volume>350</Volume>
    <VolumeUnit tone="secondary" style={{ marginLeft: 6 }}>
      ml
    </VolumeUnit>
  </View>
);

export const BesideHero = () => (
  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.tight }}>
    <Hero>500</Hero>
    <VolumeUnit tone="secondary">ml</VolumeUnit>
  </View>
);

export const Dark = () => (
  <LymphaProvider
    scheme="dark"
    style={{ padding: space.blocks, flexDirection: 'row', alignItems: 'baseline' }}
  >
    <Volume>350</Volume>
    <VolumeUnit tone="secondary" style={{ marginLeft: 6 }}>
      ml
    </VolumeUnit>
  </LymphaProvider>
);
