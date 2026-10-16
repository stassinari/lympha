import { View, HeadlineSubject, DoseValue, BodyRegular, LymphaProvider, space } from 'lympha';

export const Alone = () => <HeadlineSubject>Alkalinity</HeadlineSubject>;

export const WithFigure = () => (
  <View style={{ width: 320 }}>
    <HeadlineSubject>Alkalinity</HeadlineSubject>
    <View
      style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: space.snug, marginTop: 2 }}
    >
      <DoseValue>14%</DoseValue>
      <BodyRegular tone="secondary">over target</BodyRegular>
    </View>
    <BodyRegular tone="secondary" style={{ marginTop: 6 }}>
      That’s more than the 10% limit.
    </BodyRegular>
  </View>
);

export const TwoBottles = () => (
  <View style={{ width: 320 }}>
    <HeadlineSubject>JAMM and LYLAC</HeadlineSubject>
    <View
      style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: space.snug, marginTop: 2 }}
    >
      <DoseValue>14%</DoseValue>
      <BodyRegular tone="secondary">over target</BodyRegular>
    </View>
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 320 }}>
    <HeadlineSubject>Alkalinity</HeadlineSubject>
    <View
      style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: space.snug, marginTop: 2 }}
    >
      <DoseValue>14%</DoseValue>
      <BodyRegular tone="secondary">under target</BodyRegular>
    </View>
  </LymphaProvider>
);
