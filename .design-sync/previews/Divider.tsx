import {
  View,
  Card,
  CardTitle,
  Divider,
  LymphaProvider,
  componentMap,
  computeDose,
  formatUnit,
  getRecipe,
  space,
} from 'lympha';

export const BetweenRows = () => (
  <View style={{ width: 354 }}>
    <Card paddingVertical={space.blocks}>
      {computeDose(getRecipe('lotus-raos-recipe'), 1000, componentMap).lines.map((l, i) => (
        <View key={l.component.id}>
          <View style={{ marginVertical: space.snug }}>{i > 0 ? <Divider /> : null}</View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <CardTitle>{l.component.name}</CardTitle>
            <CardTitle>{`${l.delivered} ${formatUnit(l.dispenser.unit, l.delivered)}`}</CardTitle>
          </View>
        </View>
      ))}
    </Card>
  </View>
);

export const Inset = () => (
  <View style={{ width: 354 }}>
    <Card paddingHorizontal={0} paddingVertical={space.snug}>
      {['Water', 'Lotus', 'Apax'].map((label, i) => (
        <View key={label}>
          {i > 0 ? <Divider inset={space.cardH} /> : null}
          <CardTitle style={{ paddingHorizontal: space.cardH, paddingVertical: space.blocks }}>
            {label}
          </CardTitle>
        </View>
      ))}
    </Card>
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382 }}>
    <Card paddingVertical={space.blocks}>
      {computeDose(getRecipe('apax-lab-washed'), 1000, componentMap).lines.map((l, i) => (
        <View key={l.component.id}>
          <View style={{ marginVertical: space.snug }}>{i > 0 ? <Divider /> : null}</View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <CardTitle>{l.component.name}</CardTitle>
            <CardTitle>{`${l.delivered} ${formatUnit(l.dispenser.unit, l.delivered)}`}</CardTitle>
          </View>
        </View>
      ))}
    </Card>
  </LymphaProvider>
);
