import {
  View,
  DoseValue,
  UnitLabel,
  BodyRegular,
  LymphaProvider,
  componentMap,
  computeDose,
  getRecipe,
  formatDoseAmount,
  formatUnit,
  space,
} from 'lympha';

export const Drops = () => (
  <View style={{ flexDirection: 'row', gap: space.loose }}>
    {computeDose(getRecipe('lotus-raos-recipe'), 1000, componentMap).lines.map((line) => (
      <View key={line.component.id} style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <DoseValue>{formatDoseAmount(line.delivered, line.dispenser.step)}</DoseValue>
        <UnitLabel tone="secondary" style={{ marginLeft: 6 }}>
          {formatUnit(line.dispenser.unit, line.delivered)}
        </UnitLabel>
      </View>
    ))}
  </View>
);

export const Grams = () => (
  <View style={{ flexDirection: 'row', gap: space.loose }}>
    {computeDose(getRecipe('apax-lab-washed'), 1000, componentMap).lines.map((line) => (
      <View key={line.component.id} style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <DoseValue>{formatDoseAmount(line.delivered, line.dispenser.step)}</DoseValue>
        <UnitLabel tone="secondary" style={{ marginLeft: 6 }}>
          {formatUnit(line.dispenser.unit, line.delivered)}
        </UnitLabel>
      </View>
    ))}
  </View>
);

export const RoundingPercent = () => (
  <View style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: space.snug }}>
    <DoseValue>14%</DoseValue>
    <BodyRegular tone="secondary">over target</BodyRegular>
  </View>
);

export const Dark = () => (
  <LymphaProvider
    scheme="dark"
    style={{ padding: space.blocks, flexDirection: 'row', gap: space.loose }}
  >
    {computeDose(getRecipe('lotus-simple-and-sweet'), 1000, componentMap).lines.map((line) => (
      <View key={line.component.id} style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <DoseValue>{formatDoseAmount(line.delivered, line.dispenser.step)}</DoseValue>
        <UnitLabel tone="secondary" style={{ marginLeft: 6 }}>
          {formatUnit(line.dispenser.unit, line.delivered)}
        </UnitLabel>
      </View>
    ))}
  </LymphaProvider>
);
