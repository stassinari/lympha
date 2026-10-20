import { View, AppHeader, LymphaProvider, space } from 'lympha';

export const Default = () => (
  <View style={{ width: 354 }}>
    <AppHeader
      label="Lotus"
      spokenLabel="Lotus"
      strength={100}
      onOpenKits={() => {}}
      onOpenSettings={() => {}}
    />
  </View>
);

export const ReducedStrength = () => (
  <View style={{ width: 354 }}>
    <AppHeader
      label="Apax Lab [K]"
      spokenLabel="Apax Lab with KONFLUX"
      strength={75}
      onOpenKits={() => {}}
      onOpenSettings={() => {}}
    />
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382 }}>
    <AppHeader
      label="Apax Lab"
      spokenLabel="Apax Lab"
      strength={100}
      onOpenKits={() => {}}
      onOpenSettings={() => {}}
    />
  </LymphaProvider>
);
