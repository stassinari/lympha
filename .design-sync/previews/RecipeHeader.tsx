import {
  View,
  RecipeHeader,
  LymphaProvider,
  componentMap,
  computeDose,
  getRecipe,
  space,
} from 'lympha';

export const Lotus = () => (
  <View style={{ width: 354 }}>
    <RecipeHeader
      recipeName={getRecipe('lotus-raos-recipe')?.name ?? ''}
      bottleColours={computeDose(getRecipe('lotus-raos-recipe'), 500, componentMap).lines.map(
        (l) => l.component.colour,
      )}
      onPress={() => {}}
    />
  </View>
);

export const TwoBottles = () => (
  <View style={{ width: 354 }}>
    <RecipeHeader
      recipeName={getRecipe('lotus-light-and-bright')?.name ?? ''}
      bottleColours={computeDose(getRecipe('lotus-light-and-bright'), 500, componentMap).lines.map(
        (l) => l.component.colour,
      )}
      onPress={() => {}}
    />
  </View>
);

export const Apax = () => (
  <View style={{ width: 354 }}>
    <RecipeHeader
      recipeName={getRecipe('apax-lab-washed')?.name ?? ''}
      bottleColours={computeDose(getRecipe('apax-lab-washed'), 1000, componentMap).lines.map(
        (l) => l.component.colour,
      )}
      onPress={() => {}}
    />
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382 }}>
    <RecipeHeader
      recipeName={getRecipe('lotus-raos-recipe')?.name ?? ''}
      bottleColours={computeDose(getRecipe('lotus-raos-recipe'), 500, componentMap).lines.map(
        (l) => l.component.colour,
      )}
      onPress={() => {}}
    />
  </LymphaProvider>
);
