import {
  View,
  BarRow,
  BodyRegular,
  DoseValue,
  HeadlineSubject,
  InfoSheet,
  LymphaProvider,
  space,
  themes,
} from 'lympha';

export const BesideCaption = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.snug }}>
    <BodyRegular tone="secondary">10% limit</BodyRegular>
    <InfoSheet
      title="10% limit"
      body="Each bottle can be up to 10% off target before Lympha surfaces it. You can change this in Settings, under Rounding limit."
      accessibilityLabel="About the limit"
      accessibilityHint="Explains the limit"
    />
  </View>
);

export const InRoundingHero = () => (
  <View style={{ width: 354 }}>
    <BarRow barColour={themes.light.colour.warning}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <HeadlineSubject>Alkalinity</HeadlineSubject>
        <InfoSheet
          title="10% limit"
          body="Hardness and alkalinity can each be up to 10% off target before Lympha surfaces it. You can change this in Settings, under Rounding limit."
          accessibilityLabel="About the limit"
          accessibilityHint="Explains the limit"
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: space.snug }}>
        <DoseValue>14%</DoseValue>
        <BodyRegular tone="secondary">over target</BodyRegular>
      </View>
    </BarRow>
  </View>
);

export const Dark = () => (
  <LymphaProvider
    scheme="dark"
    style={{ padding: space.blocks, flexDirection: 'row', alignItems: 'center', gap: space.snug }}
  >
    <BodyRegular tone="secondary">10% limit</BodyRegular>
    <InfoSheet
      title="10% limit"
      body="Each bottle can be up to 10% off target before Lympha surfaces it. You can change this in Settings, under Rounding limit."
      accessibilityLabel="About the limit"
      accessibilityHint="Explains the limit"
    />
  </LymphaProvider>
);
