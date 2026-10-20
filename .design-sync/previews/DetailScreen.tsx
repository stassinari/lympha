import { LymphaProvider, DetailScreen } from 'lympha';

export const WithinLimit = () => (
  <LymphaProvider insets={{ top: 59, bottom: 34 }} style={{ width: 390, height: 844 }}>
    <DetailScreen onClose={() => {}} />
  </LymphaProvider>
);

export const OverLimitDark = () => (
  <LymphaProvider
    scheme="dark"
    insets={{ top: 59, bottom: 34 }}
    state={{ volumeMl: 350 }}
    style={{ width: 390, height: 844 }}
  >
    <DetailScreen onClose={() => {}} />
  </LymphaProvider>
);

export const Apax = () => (
  <LymphaProvider
    insets={{ top: 59, bottom: 34 }}
    state={{ rangeId: 'apax-lab', volumeMl: 350, recipeIds: { 'apax-lab': 'apax-lab-washed' } }}
    style={{ width: 390, height: 844 }}
  >
    <DetailScreen onClose={() => {}} />
  </LymphaProvider>
);
