import { View, ScreenHeader, LymphaProvider, getBrand, resolveAccent, space } from 'lympha';

export const Settings = () => (
  <View style={{ width: 354 }}>
    <ScreenHeader title="Settings" inset={0} onClose={() => {}} />
  </View>
);

export const RoundingDetail = () => (
  <View style={{ width: 354 }}>
    <ScreenHeader title="Rounding" inset={0} onClose={() => {}} />
  </View>
);

export const ApaxAccent = () => (
  <View style={{ width: 354 }}>
    <ScreenHeader
      title="Water"
      inset={0}
      accent={resolveAccent(getBrand('apax-lab')?.accent, 'light')}
      onClose={() => {}}
    />
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382 }}>
    <ScreenHeader title="Recipe" inset={0} onClose={() => {}} />
  </LymphaProvider>
);
