import {
  View,
  RoundingLine,
  LymphaProvider,
  componentMap,
  computeDose,
  getRange,
  getRecipe,
  roundingSummary,
  space,
} from 'lympha';

export const Close = () => (
  <View style={{ width: 354 }}>
    <RoundingLine
      summary={roundingSummary(
        computeDose(getRecipe('lotus-light-and-bright'), 500, componentMap),
        0.1,
      )}
      rangeAccent={getRange('lotus')?.accent}
      onDetails={() => {}}
    />
  </View>
);

export const OffTarget = () => (
  <View style={{ width: 354 }}>
    <RoundingLine
      summary={roundingSummary(
        computeDose(getRecipe('lotus-light-and-bright'), 350, componentMap),
        0.1,
      )}
      rangeAccent={getRange('lotus')?.accent}
      onDetails={() => {}}
    />
  </View>
);

export const MissingBottle = () => (
  <View style={{ width: 354 }}>
    <RoundingLine
      summary={roundingSummary(computeDose(getRecipe('lotus-raos-recipe'), 250, componentMap), 0.1)}
      rangeAccent={getRange('lotus')?.accent}
      onDetails={() => {}}
    />
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382 }}>
    <RoundingLine
      summary={roundingSummary(
        computeDose(getRecipe('lotus-light-and-bright'), 350, componentMap),
        0.1,
      )}
      rangeAccent={getRange('lotus')?.accent}
      onDetails={() => {}}
    />
  </LymphaProvider>
);
