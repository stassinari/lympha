import { LymphaProvider, UnitScreen } from 'lympha';

export const Apax = () => (
  <LymphaProvider
    insets={{ top: 59, bottom: 34 }}
    state={{ brandId: 'apax-lab' }}
    style={{ width: 390, height: 844 }}
  >
    <UnitScreen brandId="apax-lab" onClose={() => {}} />
  </LymphaProvider>
);

export const LotusDark = () => (
  <LymphaProvider
    scheme="dark"
    insets={{ top: 59, bottom: 34 }}
    style={{ width: 390, height: 844 }}
  >
    <UnitScreen brandId="lotus" onClose={() => {}} />
  </LymphaProvider>
);
