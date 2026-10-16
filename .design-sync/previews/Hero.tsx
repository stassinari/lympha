import { View, Hero, VolumeUnit, LymphaProvider, space } from 'lympha';

export const WithUnit = () => (
  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.tight }}>
    <Hero>350</Hero>
    <VolumeUnit tone="secondary">ml</VolumeUnit>
  </View>
);

export const Presets = () => (
  <View style={{ gap: space.tight }}>
    {[250, 500, 1000].map((ml) => (
      <View key={ml} style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.tight }}>
        <Hero>{String(ml)}</Hero>
        <VolumeUnit tone="secondary">ml</VolumeUnit>
      </View>
    ))}
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks }}>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.tight }}>
      <Hero>350</Hero>
      <VolumeUnit tone="secondary">ml</VolumeUnit>
    </View>
  </LymphaProvider>
);
