import { View, ActionText, BodyRegular, LymphaProvider, getRange, space } from 'lympha';

export const Accents = () => (
  <View style={{ flexDirection: 'row', gap: space.loose }}>
    <ActionText style={{ color: getRange('lotus')?.accent.light }}>Details</ActionText>
    <ActionText style={{ color: getRange('apax-lab')?.accent.light }}>Details</ActionText>
    <ActionText style={{ color: getRange('lotus')?.accent.light }}>Done</ActionText>
  </View>
);

export const BesideSentence = () => (
  <View style={{ width: 354, flexDirection: 'row', alignItems: 'baseline', gap: space.snug }}>
    <BodyRegular tone="secondary" style={{ flex: 1 }}>
      14% over target
    </BodyRegular>
    <ActionText style={{ color: getRange('lotus')?.accent.light }}>Details</ActionText>
  </View>
);

export const Dark = () => (
  <LymphaProvider
    scheme="dark"
    style={{ padding: space.blocks, flexDirection: 'row', gap: space.loose }}
  >
    <ActionText style={{ color: getRange('lotus')?.accent.dark }}>Details</ActionText>
    <ActionText style={{ color: getRange('apax-lab')?.accent.dark }}>Done</ActionText>
  </LymphaProvider>
);
