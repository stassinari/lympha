import {
  View,
  BarCluster,
  Card,
  CardTitle,
  Chip,
  LymphaProvider,
  Overlay,
  RecipeHeader,
  RecipeRow,
  Screen,
  ScreenHeader,
  brands,
  componentMap,
  componentsForBrand,
  computeDose,
  getRecipe,
  recipeSubtitle,
  recipesForBrand,
  space,
} from 'lympha';

export const RecipePicker = () => (
  <View style={{ width: 390, height: 680, overflow: 'hidden' }}>
    <LymphaProvider insets={{ top: 59, bottom: 34 }} style={{ flex: 1 }}>
      <Screen>
        <RecipeHeader
          recipeName={getRecipe('lotus-raos-recipe').name}
          brandName="Lotus"
          bottleColours={computeDose(getRecipe('lotus-raos-recipe'), 1000, componentMap).lines.map(
            (l) => l.component.colour,
          )}
          onPress={() => {}}
        />
      </Screen>
      <Overlay visible from="top" onRequestClose={() => {}}>
        <Screen horizontalPadding={0}>
          <ScreenHeader title="Recipe" onClose={() => {}} />
          <View
            style={{
              flexDirection: 'row',
              gap: space.snug,
              paddingHorizontal: space.screenH,
              paddingTop: space.belowHeader,
            }}
          >
            {brands.map((b) => (
              <Chip
                key={b.id}
                label={b.shortName}
                selected={b.id === 'lotus'}
                onPress={() => {}}
                leading={
                  <BarCluster size="chip" colours={componentsForBrand(b.id).map((c) => c.colour)} />
                }
              />
            ))}
          </View>
          <View
            style={{ paddingHorizontal: space.screenH, paddingTop: space.blocks, gap: space.rows }}
          >
            {recipesForBrand('lotus')
              .slice(0, 4)
              .map((recipe) => {
                const dose = computeDose(recipe, 1000, componentMap);
                return (
                  <RecipeRow
                    key={recipe.id}
                    name={recipe.name}
                    subtitle={recipeSubtitle(recipe, dose)}
                    bottleColours={dose.lines.map((l) => l.component.colour)}
                    selected={recipe.id === 'lotus-raos-recipe'}
                    onPress={() => {}}
                  />
                );
              })}
          </View>
        </Screen>
      </Overlay>
    </LymphaProvider>
  </View>
);

export const Dark = () => (
  <View style={{ width: 390, height: 520, overflow: 'hidden' }}>
    <LymphaProvider scheme="dark" insets={{ top: 59, bottom: 34 }} style={{ flex: 1 }}>
      <Overlay visible from="right" onRequestClose={() => {}}>
        <Screen horizontalPadding={0}>
          <ScreenHeader title="Apax" onClose={() => {}} />
          <View
            style={{
              paddingHorizontal: space.screenH,
              paddingTop: space.belowHeader,
              gap: space.rows,
            }}
          >
            {['Automatic', 'Drops', 'Grams'].map((label) => (
              <Card
                key={label}
                selected={label === 'Grams'}
                onPress={() => {}}
                accessibilityRole="radio"
              >
                <CardTitle>{label}</CardTitle>
              </Card>
            ))}
          </View>
        </Screen>
      </Overlay>
    </LymphaProvider>
  </View>
);
