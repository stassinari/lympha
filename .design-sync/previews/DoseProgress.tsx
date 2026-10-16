import { View, DoseProgress, LymphaProvider, getBrand, space } from 'lympha';

export const FirstBottle = () => (
  <View style={{ width: 354 }}>
    <DoseProgress done={1} total={4} brandAccent={getBrand('lotus')?.accent} />
  </View>
);

export const Halfway = () => (
  <View style={{ width: 354 }}>
    <DoseProgress done={2} total={4} brandAccent={getBrand('lotus')?.accent} />
  </View>
);

export const ApaxNearlyDone = () => (
  <View style={{ width: 354 }}>
    <DoseProgress done={2} total={3} brandAccent={getBrand('apax-lab')?.accent} />
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382 }}>
    <DoseProgress done={3} total={4} brandAccent={getBrand('lotus')?.accent} />
  </LymphaProvider>
);
