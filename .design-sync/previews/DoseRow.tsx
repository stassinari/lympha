import { View, DoseRow, LymphaProvider, componentMap, computeDose, getRecipe, space } from 'lympha';

export const Drops = () => (
  <View style={{ width: 354, gap: space.rows }}>
    {computeDose(getRecipe('lotus-raos-recipe'), 1000, componentMap).lines.map((line) => (
      <DoseRow key={line.component.id} line={line} onPress={() => {}} />
    ))}
  </View>
);

export const PartlyPoured = () => (
  <View style={{ width: 354, gap: space.rows }}>
    {computeDose(getRecipe('lotus-raos-recipe'), 1000, componentMap).lines.map((line, i) => (
      <DoseRow key={line.component.id} line={line} done={i < 2} onPress={() => {}} />
    ))}
  </View>
);

export const Grams = () => (
  <View style={{ width: 354, gap: space.rows }}>
    {computeDose(getRecipe('apax-lab-washed'), 1000, componentMap).lines.map((line) => (
      <DoseRow key={line.component.id} line={line} onPress={() => {}} />
    ))}
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382, gap: space.rows }}>
    {computeDose(getRecipe('lotus-simple-and-sweet'), 1000, componentMap).lines.map((line, i) => (
      <DoseRow key={line.component.id} line={line} done={i === 0} onPress={() => {}} />
    ))}
  </LymphaProvider>
);
