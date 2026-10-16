import { View, ScreenTitle, ActionText, LymphaProvider, getBrand, space } from 'lympha';

export const Titles = () => (
  <View style={{ gap: space.tight }}>
    <ScreenTitle>Settings</ScreenTitle>
    <ScreenTitle>Rounding</ScreenTitle>
    <ScreenTitle>Recipe</ScreenTitle>
  </View>
);

export const HeaderRow = () => (
  <View style={{ width: 354, flexDirection: 'row', alignItems: 'center' }}>
    <ScreenTitle style={{ flex: 1 }}>Settings</ScreenTitle>
    <ActionText style={{ color: getBrand('lotus')?.accent.light }}>Done</ActionText>
  </View>
);

export const Dark = () => (
  <LymphaProvider
    scheme="dark"
    style={{ padding: space.blocks, width: 354, flexDirection: 'row', alignItems: 'center' }}
  >
    <ScreenTitle style={{ flex: 1 }}>Rounding</ScreenTitle>
    <ActionText style={{ color: getBrand('lotus')?.accent.dark }}>Done</ActionText>
  </LymphaProvider>
);
