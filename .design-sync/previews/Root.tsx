import { LymphaProvider, Root } from 'lympha';

export const Light = () => (
  <LymphaProvider insets={{ top: 59, bottom: 34 }} style={{ width: 390, height: 844 }}>
    <Root />
  </LymphaProvider>
);

export const Dark = () => (
  <LymphaProvider
    scheme="dark"
    insets={{ top: 59, bottom: 34 }}
    style={{ width: 390, height: 844 }}
  >
    <Root />
  </LymphaProvider>
);
