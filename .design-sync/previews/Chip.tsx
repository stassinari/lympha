import { View, BarCluster, Chip, LymphaProvider, brands, componentsForBrand, space } from 'lympha';

export const BrandChips = () => (
  <View style={{ flexDirection: 'row', gap: space.snug }}>
    {brands.map((b) => (
      <Chip
        key={b.id}
        label={b.shortName}
        accessibilityLabel={b.spokenShortName}
        selected={b.id === 'lotus'}
        onPress={() => {}}
        leading={<BarCluster size="chip" colours={componentsForBrand(b.id).map((c) => c.colour)} />}
      />
    ))}
  </View>
);

export const Selected = () => (
  <View style={{ flexDirection: 'row' }}>
    <Chip
      label="Apax"
      selected
      onPress={() => {}}
      leading={
        <BarCluster size="chip" colours={componentsForBrand('apax-lab').map((c) => c.colour)} />
      }
    />
  </View>
);

export const Unselected = () => (
  <View style={{ flexDirection: 'row' }}>
    <Chip
      label="Lotus"
      selected={false}
      onPress={() => {}}
      leading={
        <BarCluster size="chip" colours={componentsForBrand('lotus').map((c) => c.colour)} />
      }
    />
  </View>
);

export const Dark = () => (
  <LymphaProvider
    scheme="dark"
    style={{ padding: space.blocks, flexDirection: 'row', gap: space.snug }}
  >
    {brands.map((b) => (
      <Chip
        key={b.id}
        label={b.shortName}
        accessibilityLabel={b.spokenShortName}
        selected={b.id === 'apax-lab'}
        onPress={() => {}}
        leading={<BarCluster size="chip" colours={componentsForBrand(b.id).map((c) => c.colour)} />}
      />
    ))}
  </LymphaProvider>
);
