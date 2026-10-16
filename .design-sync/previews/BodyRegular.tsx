import { View, BodyRegular, Body, LymphaProvider, space } from 'lympha';

export const Sentence = () => (
  <BodyRegular tone="secondary" style={{ width: 320 }}>
    Magnesium, Sodium and Potassium round to zero drops at this volume.
  </BodyRegular>
);

export const AgainstBody = () => (
  <View style={{ width: 320, gap: space.tight }}>
    <Body>Body — 600, for labels and values.</Body>
    <BodyRegular>BodyRegular — 400, for sentences that recede.</BodyRegular>
  </View>
);

export const Tones = () => (
  <View style={{ width: 320, gap: space.tight }}>
    <BodyRegular>That’s as close as drops get.</BodyRegular>
    <BodyRegular tone="secondary">That’s more than the 10% limit.</BodyRegular>
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 348, gap: space.tight }}>
    <BodyRegular>That’s as close as drops get.</BodyRegular>
    <BodyRegular tone="secondary">That’s more than the 10% limit.</BodyRegular>
  </LymphaProvider>
);
