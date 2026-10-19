import {
  View,
  BarCluster,
  Caption,
  LymphaProvider,
  componentMap,
  componentsForRange,
  computeDose,
  getRecipe,
  space,
} from 'lympha';

export const Sizes = () => (
  <View style={{ gap: space.blocks }}>
    {(['header', 'chip', 'row'] as const).map((size) => (
      <View key={size} style={{ flexDirection: 'row', alignItems: 'center', gap: space.blocks }}>
        <BarCluster
          size={size}
          colours={computeDose(getRecipe('lotus-raos-recipe'), 1000, componentMap).lines.map(
            (l) => l.component.colour,
          )}
          style={{ width: 40 }}
        />
        <Caption tone="secondary">{size}</Caption>
      </View>
    ))}
  </View>
);

export const Ranges = () => (
  <View style={{ gap: space.blocks }}>
    {['lotus', 'apax-lab', 'apax-lab-original'].map((id) => (
      <BarCluster key={id} colours={componentsForRange(id).map((c) => c.colour)} />
    ))}
  </View>
);

export const RecipeLengths = () => (
  <View style={{ gap: space.blocks }}>
    {['lotus-light-and-bright', 'apax-lab-light-roast', 'lotus-raos-recipe'].map((id) => (
      <BarCluster
        key={id}
        size="row"
        colours={computeDose(getRecipe(id), 1000, componentMap).lines.map(
          (l) => l.component.colour,
        )}
      />
    ))}
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, gap: space.blocks }}>
    {['lotus', 'apax-lab', 'apax-lab-original'].map((id) => (
      <BarCluster key={id} colours={componentsForRange(id).map((c) => c.colour)} />
    ))}
  </LymphaProvider>
);
