import { View, LymphaProvider, Pill, space } from 'lympha';

const noop = () => {};

export const Edit = () => (
  <View style={{ flexDirection: 'row' }}>
    <Pill label="Edit" onPress={noop} />
  </View>
);

export const Presets = () => (
  <View style={{ flexDirection: 'row', gap: space.snug, width: 354 }}>
    {[250, 350, 500, 1000].map((ml) => (
      <Pill
        key={ml}
        label={String(ml)}
        selected={ml === 500}
        paddingHorizontal={0}
        style={{ flex: 1 }}
        accessibilityRole="radio"
        onPress={noop}
      />
    ))}
  </View>
);

export const NudgeActions = () => (
  <View style={{ flexDirection: 'row', gap: space.snug }}>
    <Pill label="Use 330 ml" emphasis="primary" onPress={noop} />
    <Pill label="Keep 350 ml" onPress={noop} />
  </View>
);

export const Disabled = () => (
  <View style={{ flexDirection: 'row' }}>
    <Pill label="Edit" disabled onPress={noop} />
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks }}>
    <View style={{ flexDirection: 'row', gap: space.snug }}>
      <Pill label="Use 330 ml" emphasis="primary" onPress={noop} />
      <Pill label="Keep 350 ml" onPress={noop} />
    </View>
  </LymphaProvider>
);
