import {
  View,
  BarRow,
  Body,
  BodyRegular,
  CardTitle,
  LymphaProvider,
  Pill,
  getComponent,
  space,
  themes,
} from 'lympha';

export const Bottle = () => (
  <View style={{ width: 354 }}>
    <BarRow barColour={getComponent('lotus-magnesium').colour.light}>
      <CardTitle>Magnesium</CardTitle>
      <BodyRegular tone="secondary">4 drops per litre</BodyRegular>
    </BarRow>
  </View>
);

export const Warning = () => (
  <View style={{ width: 354 }}>
    <BarRow barColour={themes.light.colour.warning}>
      <CardTitle>Calcium lands 14% over target</CardTitle>
      <BodyRegular tone="secondary">Rounded to whole drops at 350 ml.</BodyRegular>
      <View style={{ flexDirection: 'row', gap: space.snug, marginTop: space.blocks }}>
        <Pill label="Use 330 ml" emphasis="primary" onPress={() => {}} />
        <Pill label="Keep 350 ml" onPress={() => {}} />
      </View>
    </BarRow>
  </View>
);

export const Exact = () => (
  <View style={{ width: 354 }}>
    <BarRow barColour={themes.light.colour.ok}>
      <Body tone="onCard">At 330 ml, every bottle hits its target exactly.</Body>
    </BarRow>
  </View>
);

export const Receded = () => (
  <View style={{ width: 354 }}>
    <BarRow
      barColour={getComponent('lotus-calcium').colour.light}
      surfaceColour={themes.light.colour.control}
      barOpacity={0.4}
      elevated={false}
    >
      <CardTitle>Calcium</CardTitle>
      <BodyRegular tone="secondary">5 drops — poured</BodyRegular>
    </BarRow>
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382, gap: space.rows }}>
    <BarRow barColour={getComponent('lotus-sodium').colour.dark}>
      <CardTitle>Sodium</CardTitle>
      <BodyRegular tone="secondary">3 drops per litre</BodyRegular>
    </BarRow>
    <BarRow barColour={themes.dark.colour.warning}>
      <CardTitle>Calcium lands 14% over target</CardTitle>
      <BodyRegular tone="secondary">Rounded to whole drops at 350 ml.</BodyRegular>
    </BarRow>
  </LymphaProvider>
);
