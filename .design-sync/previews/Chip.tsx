import { View, BarCluster, Chip, LymphaProvider, ranges, componentsForRange, space } from 'lympha';

export const RangeChips = () => (
  <View style={{ flexDirection: 'row', gap: space.snug }}>
    {ranges.map((b) => (
      <Chip
        key={b.id}
        label={b.shortName}
        accessibilityLabel={b.spokenShortName}
        selected={b.id === 'lotus'}
        onPress={() => {}}
        leading={<BarCluster size="chip" colours={componentsForRange(b.id).map((c) => c.colour)} />}
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
        <BarCluster size="chip" colours={componentsForRange('apax-lab').map((c) => c.colour)} />
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
        <BarCluster size="chip" colours={componentsForRange('lotus').map((c) => c.colour)} />
      }
    />
  </View>
);

export const Dark = () => (
  <LymphaProvider
    scheme="dark"
    style={{ padding: space.blocks, flexDirection: 'row', gap: space.snug }}
  >
    {ranges.map((b) => (
      <Chip
        key={b.id}
        label={b.shortName}
        accessibilityLabel={b.spokenShortName}
        selected={b.id === 'apax-lab'}
        onPress={() => {}}
        leading={<BarCluster size="chip" colours={componentsForRange(b.id).map((c) => c.colour)} />}
      />
    ))}
  </LymphaProvider>
);
