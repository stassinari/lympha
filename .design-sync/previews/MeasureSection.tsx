import { MeasureSection, LymphaProvider, space } from 'lympha';

export const Automatic = () => (
  <LymphaProvider state={{ rangeId: 'apax-lab' }} style={{ width: 354, gap: space.rows }}>
    <MeasureSection rangeId="apax-lab" onChoose={() => {}} />
  </LymphaProvider>
);

export const DropsAtSmallVolume = () => (
  <LymphaProvider
    state={{ rangeId: 'apax-lab', volumeMl: 350, units: { apax: 'drop' } }}
    style={{ width: 354, gap: space.rows }}
  >
    <MeasureSection rangeId="apax-lab" onChoose={() => {}} />
  </LymphaProvider>
);

export const Dark = () => (
  <LymphaProvider
    scheme="dark"
    state={{ rangeId: 'apax-lab', units: { apax: 'g' }, strength: { apax: 75 } }}
    style={{ padding: space.blocks, width: 382, gap: space.rows }}
  >
    <MeasureSection rangeId="apax-lab" onChoose={() => {}} />
  </LymphaProvider>
);
