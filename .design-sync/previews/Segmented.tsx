import { View, LymphaProvider, SectionHeader, Segmented, space } from 'lympha';

export const Appearance = () => (
  <View style={{ width: 354 }}>
    <Segmented
      options={[
        { value: 'system', label: 'System' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ]}
      value="system"
      onChange={() => {}}
    />
  </View>
);

export const InSettings = () => (
  <View style={{ width: 354, gap: space.rows }}>
    <SectionHeader tone="secondary">Appearance</SectionHeader>
    <Segmented
      options={[
        { value: 'system', label: 'System' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ]}
      value="light"
      onChange={() => {}}
    />
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382 }}>
    <Segmented
      options={[
        { value: 'system', label: 'System' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ]}
      value="dark"
      onChange={() => {}}
    />
  </LymphaProvider>
);
