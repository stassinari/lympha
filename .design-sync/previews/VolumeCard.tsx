import { View, VolumeCard, LymphaProvider, space } from 'lympha';

export const Litre = () => (
  <View style={{ width: 354 }}>
    <VolumeCard volumeMl={1000} onEdit={() => {}} />
  </View>
);

export const Cup = () => (
  <View style={{ width: 354 }}>
    <VolumeCard volumeMl={250} onEdit={() => {}} />
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382 }}>
    <VolumeCard volumeMl={500} onEdit={() => {}} />
  </LymphaProvider>
);
