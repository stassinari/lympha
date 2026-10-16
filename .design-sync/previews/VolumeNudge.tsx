import {
  View,
  VolumeNudge,
  LymphaProvider,
  componentMap,
  computeDose,
  findExactVolume,
  getRecipe,
  space,
} from 'lympha';

export const MissingBottle = () => (
  <View style={{ width: 354 }}>
    <VolumeNudge
      dose={computeDose(getRecipe('lotus-raos-recipe'), 250, componentMap)}
      exactVolumeMl={findExactVolume(getRecipe('lotus-raos-recipe'), componentMap, 250)}
      flagAbove={0.1}
      onUseExact={() => {}}
      onDismiss={() => {}}
    />
  </View>
);

export const OffWithExact = () => (
  <View style={{ width: 354 }}>
    <VolumeNudge
      dose={computeDose(getRecipe('apax-lab-washed'), 350, componentMap)}
      exactVolumeMl={findExactVolume(getRecipe('apax-lab-washed'), componentMap, 350)}
      flagAbove={0.1}
      onUseExact={() => {}}
      onDismiss={() => {}}
    />
  </View>
);

export const FarOff = () => (
  <View style={{ width: 354 }}>
    <VolumeNudge
      dose={computeDose(getRecipe('lotus-bright-and-juicy'), 250, componentMap)}
      exactVolumeMl={findExactVolume(getRecipe('lotus-bright-and-juicy'), componentMap, 250)}
      flagAbove={0.1}
      onUseExact={() => {}}
      onDismiss={() => {}}
    />
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382 }}>
    <VolumeNudge
      dose={computeDose(getRecipe('lotus-bright-and-juicy'), 500, componentMap)}
      exactVolumeMl={findExactVolume(getRecipe('lotus-bright-and-juicy'), componentMap, 500)}
      flagAbove={0.1}
      onUseExact={() => {}}
      onDismiss={() => {}}
    />
  </LymphaProvider>
);
