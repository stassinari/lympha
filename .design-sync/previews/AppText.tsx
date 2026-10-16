import { View, AppText, LymphaProvider, space } from 'lympha';

export const Variants = () => (
  <View style={{ width: 354, gap: space.tight }}>
    <AppText variant="screenTitle">Settings</AppText>
    <AppText variant="rowTitle">Magnesium</AppText>
    <AppText variant="cardTitle">Rao’s Recipe</AppText>
    <AppText variant="body">That’s as close as drops get.</AppText>
    <AppText variant="caption" tone="secondary">
      Scott Rao
    </AppText>
    <AppText variant="sectionHeader" tone="secondary">
      Appearance
    </AppText>
  </View>
);

export const Numerals = () => (
  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.loose }}>
    <AppText variant="hero">350</AppText>
    <AppText variant="volume">350</AppText>
    <AppText variant="doseValue">4</AppText>
  </View>
);

export const Tones = () => (
  <View style={{ width: 354, gap: space.tight }}>
    <AppText variant="cardTitle">Primary</AppText>
    <AppText variant="cardTitle" tone="secondary">
      Secondary
    </AppText>
    <AppText variant="cardTitle" tone="warning">
      14% over target
    </AppText>
    <AppText variant="cardTitle" tone="error">
      No Potassium at 170 ml
    </AppText>
    <AppText variant="cardTitle" tone="ok">
      On target
    </AppText>
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 354, gap: space.tight }}>
    <AppText variant="screenTitle">Settings</AppText>
    <AppText variant="sectionHeader" tone="secondary">
      Appearance
    </AppText>
    <AppText variant="body">That’s as close as drops get.</AppText>
  </LymphaProvider>
);
