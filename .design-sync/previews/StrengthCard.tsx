import { View, StrengthCard, LymphaProvider, getRange, space } from 'lympha';

export const Full = () => (
  <View style={{ width: 354 }}>
    <StrengthCard
      value={100}
      onChange={() => {}}
      accent={getRange('apax-lab')?.accent.light ?? ''}
    />
  </View>
);

export const OnAStep = () => (
  <View style={{ width: 354 }}>
    <StrengthCard
      value={75}
      onChange={() => {}}
      accent={getRange('apax-lab')?.accent.light ?? ''}
    />
  </View>
);

export const BetweenSteps = () => (
  <View style={{ width: 354 }}>
    <StrengthCard
      value={60}
      onChange={() => {}}
      accent={getRange('apax-lab')?.accent.light ?? ''}
    />
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382 }}>
    <StrengthCard value={50} onChange={() => {}} accent={getRange('apax-lab')?.accent.dark ?? ''} />
  </LymphaProvider>
);
