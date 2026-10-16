import {
  View,
  BarCluster,
  Caption,
  Card,
  CardTitle,
  Icon,
  LymphaProvider,
  componentMap,
  computeDose,
  getRecipe,
  space,
  themes,
} from 'lympha';

export const Plain = () => (
  <View style={{ width: 354 }}>
    <Card>
      <CardTitle>Suggest an exact volume</CardTitle>
      <Caption tone="secondary" style={{ marginTop: 2 }}>
        When rounding puts you off target, offer a nearby volume that’s exact.
      </Caption>
    </Card>
  </View>
);

export const Pressable = () => (
  <View style={{ width: 354 }}>
    <Card onPress={() => {}} accessibilityLabel="Rao’s Recipe, Lotus. Change recipe">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.blocks }}>
        <BarCluster
          colours={computeDose(getRecipe('lotus-raos-recipe'), 1000, componentMap).lines.map(
            (l) => l.component.colour,
          )}
        />
        <View style={{ flex: 1 }}>
          <CardTitle numberOfLines={1}>{getRecipe('lotus-raos-recipe').name}</CardTitle>
          <Caption tone="secondary">Lotus</Caption>
        </View>
        <Icon name="chevronDown" colour={themes.light.colour.textSecondary} />
      </View>
    </Card>
  </View>
);

export const Selection = () => (
  <View style={{ width: 354, gap: space.rows }}>
    {['Drops', 'Grams'].map((label, i) => (
      <Card key={label} selected={i === 0} onPress={() => {}} accessibilityRole="radio">
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <CardTitle style={{ flex: 1 }}>{label}</CardTitle>
          {i === 0 ? <Icon name="check" size={20} /> : null}
        </View>
      </Card>
    ))}
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382, gap: space.rows }}>
    {['Drops', 'Grams'].map((label, i) => (
      <Card key={label} selected={i === 0} onPress={() => {}} accessibilityRole="radio">
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <CardTitle style={{ flex: 1 }}>{label}</CardTitle>
          {i === 0 ? <Icon name="check" size={20} colour={themes.dark.colour.text} /> : null}
        </View>
      </Card>
    ))}
  </LymphaProvider>
);
