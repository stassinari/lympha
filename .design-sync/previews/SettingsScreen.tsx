import { LymphaProvider, SettingsScreen } from 'lympha';

export const Light = () => (
  <LymphaProvider insets={{ top: 59, bottom: 34 }} style={{ width: 390, height: 844 }}>
    <SettingsScreen onClose={() => {}} />
  </LymphaProvider>
);

export const Dark = () => (
  <LymphaProvider
    scheme="dark"
    insets={{ top: 59, bottom: 34 }}
    state={{ defaultVolumeMl: 350, flagAbove: 0.15 }}
    style={{ width: 390, height: 844 }}
  >
    <SettingsScreen onClose={() => {}} />
  </LymphaProvider>
);
