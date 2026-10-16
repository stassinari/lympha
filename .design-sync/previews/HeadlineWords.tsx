import { View, HeadlineWords, BodyRegular, LymphaProvider, space } from 'lympha';

export const OnTarget = () => (
  <View style={{ width: 300 }}>
    <HeadlineWords>On target</HeadlineWords>
    <BodyRegular tone="secondary" style={{ marginTop: 6 }}>
      That’s as close as drops get.
    </BodyRegular>
  </View>
);

export const Missing = () => (
  <View style={{ width: 300, gap: space.blocks }}>
    <View>
      <HeadlineWords>No Potassium</HeadlineWords>
      <BodyRegular tone="secondary" style={{ marginTop: 6 }}>
        It rounds to zero drops at this volume, so none goes in.
      </BodyRegular>
    </View>
    <View>
      <HeadlineWords>3 bottles missing</HeadlineWords>
      <BodyRegular tone="secondary" style={{ marginTop: 6 }}>
        Magnesium, Sodium and Potassium round to zero drops at this volume.
      </BodyRegular>
    </View>
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 300 }}>
    <HeadlineWords>No Potassium</HeadlineWords>
    <BodyRegular tone="secondary" style={{ marginTop: 6 }}>
      It rounds to zero drops at this volume, so none goes in.
    </BodyRegular>
  </LymphaProvider>
);
