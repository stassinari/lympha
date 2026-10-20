import { LymphaProvider, RecipeScreen } from 'lympha';

export const Lotus = () => (
  <LymphaProvider insets={{ top: 59, bottom: 34 }} style={{ width: 390, height: 844 }}>
    <RecipeScreen onClose={() => {}} />
  </LymphaProvider>
);

export const ApaxDark = () => (
  <LymphaProvider
    scheme="dark"
    insets={{ top: 59, bottom: 34 }}
    state={{ rangeId: 'apax-lab' }}
    style={{ width: 390, height: 844 }}
  >
    <RecipeScreen onClose={() => {}} />
  </LymphaProvider>
);
