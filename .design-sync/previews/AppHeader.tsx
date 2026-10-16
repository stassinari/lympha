import { View, AppHeader, LymphaProvider, space } from 'lympha';

export const Default = () => (
  <View style={{ width: 354 }}>
    <AppHeader onOpenSettings={() => {}} />
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382 }}>
    <AppHeader onOpenSettings={() => {}} />
  </LymphaProvider>
);
