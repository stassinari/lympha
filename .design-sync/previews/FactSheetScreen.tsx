import { LymphaProvider, FactSheetScreen } from 'lympha';

export const Lotus = () => (
  <LymphaProvider insets={{ top: 59, bottom: 34 }} style={{ width: 390, height: 844 }}>
    <FactSheetScreen kitId="lotus" onBack={() => {}} onClose={() => {}} onShowRecipe={() => {}} />
  </LymphaProvider>
);

export const ApaxNotInUse = () => (
  <LymphaProvider insets={{ top: 59, bottom: 34 }} style={{ width: 390, height: 844 }}>
    <FactSheetScreen kitId="apax" onBack={() => {}} onClose={() => {}} onShowRecipe={() => {}} />
  </LymphaProvider>
);

export const ApaxDark = () => (
  <LymphaProvider
    scheme="dark"
    insets={{ top: 59, bottom: 34 }}
    state={{ rangeId: 'apax-lab', strength: { apax: 75 }, units: { apax: 'g' } }}
    style={{ width: 390, height: 844 }}
  >
    <FactSheetScreen kitId="apax" onBack={() => {}} onClose={() => {}} onShowRecipe={() => {}} />
  </LymphaProvider>
);
