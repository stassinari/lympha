import {
  View,
  RecipeRow,
  LymphaProvider,
  componentMap,
  computeDose,
  recipeSubtitle,
  recipesForBrand,
  space,
} from 'lympha';

export const LotusList = () => (
  <View style={{ width: 354, gap: space.rows }}>
    {recipesForBrand('lotus')
      .slice(0, 4)
      .map((recipe) => (
        <RecipeRow
          key={recipe.id}
          name={recipe.name}
          subtitle={recipeSubtitle(recipe, computeDose(recipe, 1000, componentMap))}
          bottleColours={computeDose(recipe, 1000, componentMap).lines.map(
            (l) => l.component.colour,
          )}
          selected={recipe.id === 'lotus-light-and-bright'}
          onPress={() => {}}
        />
      ))}
  </View>
);

export const MissingAtCup = () => (
  <View style={{ width: 354, gap: space.rows }}>
    {recipesForBrand('lotus')
      .slice(4)
      .map((recipe) => (
        <RecipeRow
          key={recipe.id}
          name={recipe.name}
          subtitle={recipeSubtitle(recipe, computeDose(recipe, 250, componentMap))}
          bottleColours={computeDose(recipe, 250, componentMap).lines.map(
            (l) => l.component.colour,
          )}
          selected={recipe.id === 'lotus-raos-recipe'}
          onPress={() => {}}
        />
      ))}
  </View>
);

export const Apax = () => (
  <View style={{ width: 354, gap: space.rows }}>
    {recipesForBrand('apax-lab')
      .slice(0, 3)
      .map((recipe, i) => (
        <RecipeRow
          key={recipe.id}
          name={recipe.name}
          subtitle={recipeSubtitle(recipe, computeDose(recipe, 1000, componentMap))}
          bottleColours={computeDose(recipe, 1000, componentMap).lines.map(
            (l) => l.component.colour,
          )}
          selected={i === 0}
          onPress={() => {}}
        />
      ))}
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382, gap: space.rows }}>
    {recipesForBrand('lotus')
      .slice(4)
      .map((recipe) => (
        <RecipeRow
          key={recipe.id}
          name={recipe.name}
          subtitle={recipeSubtitle(recipe, computeDose(recipe, 250, componentMap))}
          bottleColours={computeDose(recipe, 250, componentMap).lines.map(
            (l) => l.component.colour,
          )}
          selected={recipe.id === 'lotus-bright-and-juicy'}
          onPress={() => {}}
        />
      ))}
  </LymphaProvider>
);
