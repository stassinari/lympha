import { View, Body, LymphaProvider, space } from 'lympha';

export const Primary = () => (
  <Body style={{ width: 320 }}>
    Rounded to whole drops, this litre lands 3% over the recipe’s target.
  </Body>
);

export const Tones = () => (
  <View style={{ width: 320, gap: space.tight }}>
    <Body>Primary — the default.</Body>
    <Body tone="secondary">Secondary — supporting copy on the page.</Body>
    <Body tone="warning">Warning — 14% over target.</Body>
    <Body tone="error">Error — no Potassium at this volume.</Body>
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 348, gap: space.tight }}>
    <Body>Primary — the default.</Body>
    <Body tone="secondary">Secondary — supporting copy on the page.</Body>
  </LymphaProvider>
);
