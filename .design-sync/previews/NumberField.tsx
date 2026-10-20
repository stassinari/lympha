import { View, NumberField, LymphaProvider, VolumeUnit, UnitLabel, getRange, space } from 'lympha';

export const Water = () => (
  <View style={{ width: 354 }}>
    <NumberField
      role="hero"
      value={1000}
      entry={null}
      onEntryChange={() => {}}
      maxDigits={4}
      accent={getRange('lotus')?.accent.light ?? ''}
      unit={<VolumeUnit tone="secondary">ml</VolumeUnit>}
      unitAtEnd
      accessibilityLabel="1000 millilitres"
      accessibilityHint="Edits the amount of water"
    />
  </View>
);

export const Strength = () => (
  <View style={{ width: 354 }}>
    <NumberField
      role="doseValue"
      value={75}
      entry={null}
      onEntryChange={() => {}}
      maxDigits={3}
      accent={getRange('apax-lab')?.accent.light ?? ''}
      unit={<UnitLabel tone="secondary">%</UnitLabel>}
      accessibilityLabel="Strength, 75 percent"
      accessibilityHint="Edits the strength"
    />
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382 }}>
    <NumberField
      role="hero"
      value={350}
      entry={null}
      onEntryChange={() => {}}
      maxDigits={4}
      accent={getRange('lotus')?.accent.dark ?? ''}
      unit={<VolumeUnit tone="secondary">ml</VolumeUnit>}
      unitAtEnd
      accessibilityLabel="350 millilitres"
      accessibilityHint="Edits the amount of water"
    />
  </LymphaProvider>
);
