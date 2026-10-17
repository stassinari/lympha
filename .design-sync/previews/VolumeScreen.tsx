import { LymphaProvider, VolumeScreen } from 'lympha';

export const Light = () => (
  <LymphaProvider insets={{ top: 59, bottom: 34 }} style={{ width: 390, height: 844 }}>
    <VolumeScreen onClose={() => {}} />
  </LymphaProvider>
);

export const Dark = () => (
  <LymphaProvider
    scheme="dark"
    insets={{ top: 59, bottom: 34 }}
    state={{ volumeMl: 350 }}
    style={{ width: 390, height: 844 }}
  >
    <VolumeScreen onClose={() => {}} />
  </LymphaProvider>
);
