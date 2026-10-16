import {
  ScrollView,
  View,
  Body,
  BarRow,
  CardTitle,
  BodyRegular,
  LymphaProvider,
  Screen,
  ScreenHeader,
  getComponent,
  space,
} from 'lympha';

export const Light = () => (
  <LymphaProvider scheme="light" style={{ padding: space.blocks, width: 382, gap: space.rows }}>
    <BarRow barColour={getComponent('lotus-magnesium').colour.light}>
      <CardTitle>Magnesium</CardTitle>
      <BodyRegular tone="secondary">4 drops per litre</BodyRegular>
    </BarRow>
    <Body tone="secondary">Cream page, white cards.</Body>
  </LymphaProvider>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382, gap: space.rows }}>
    <BarRow barColour={getComponent('lotus-magnesium').colour.dark}>
      <CardTitle>Magnesium</CardTitle>
      <BodyRegular tone="secondary">4 drops per litre</BodyRegular>
    </BarRow>
    <Body tone="secondary">Warm near-black page, raised cards.</Body>
  </LymphaProvider>
);

export const DeviceInsets = () => (
  <View style={{ width: 390, height: 420 }}>
    <LymphaProvider insets={{ top: 59, bottom: 34 }} style={{ flex: 1 }}>
      <Screen horizontalPadding={0}>
        <ScreenHeader title="Settings" onClose={() => {}} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: space.screenH,
            paddingTop: space.belowHeader,
          }}
        >
          <Body tone="secondary">Content starts below a 59 pt Dynamic Island inset.</Body>
        </ScrollView>
      </Screen>
    </LymphaProvider>
  </View>
);
