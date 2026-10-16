import {
  View,
  ScrollView,
  Card,
  CardLabel,
  LymphaProvider,
  Volume,
  VolumeUnit,
  Pill,
  Screen,
  ScreenHeader,
  SectionHeader,
  Segmented,
  SettingsRow,
  space,
} from 'lympha';

export const Settings = () => (
  <View style={{ width: 390, height: 640 }}>
    <LymphaProvider insets={{ top: 59, bottom: 34 }} style={{ flex: 1 }}>
      <Screen horizontalPadding={0}>
        <ScreenHeader title="Settings" onClose={() => {}} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: space.screenH,
            paddingTop: space.belowHeader,
            gap: space.rows,
          }}
        >
          <SectionHeader tone="secondary">Appearance</SectionHeader>
          <Segmented
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            value="system"
            onChange={() => {}}
          />
          <SectionHeader tone="secondary" style={{ marginTop: space.blocks }}>
            Units
          </SectionHeader>
          <SettingsRow label="Water" value="Millilitres" />
          <SettingsRow label="Apax" value="Automatic" onPress={() => {}} />
          <SectionHeader tone="secondary" style={{ marginTop: space.blocks }}>
            Brewing
          </SectionHeader>
          <SettingsRow
            label="Rounding limit"
            detail="How far off target is still close enough."
            wide
            control={
              <View style={{ flexDirection: 'row', gap: space.snug }}>
                {[0.05, 0.1, 0.15, 0.2].map((v) => (
                  <Pill
                    key={v}
                    label={`${Math.round(v * 100)}%`}
                    selected={v === 0.1}
                    onPress={() => {}}
                    style={{ flex: 1 }}
                  />
                ))}
              </View>
            }
          />
        </ScrollView>
      </Screen>
    </LymphaProvider>
  </View>
);

export const Padded = () => (
  <View style={{ width: 390, height: 520 }}>
    <LymphaProvider insets={{ top: 59, bottom: 34 }} style={{ flex: 1 }}>
      <Screen applyBottomInset={false}>
        <ScreenHeader
          title="Water"
          onClose={() => {}}
          inset={0}
          style={{ marginBottom: space.loose }}
        />
        <Card>
          <CardLabel tone="secondary">Water</CardLabel>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: space.tight,
              marginTop: space.labelGap,
            }}
          >
            <Volume>350</Volume>
            <VolumeUnit tone="secondary">ml</VolumeUnit>
          </View>
        </Card>
      </Screen>
    </LymphaProvider>
  </View>
);

export const Dark = () => (
  <View style={{ width: 390, height: 520 }}>
    <LymphaProvider scheme="dark" insets={{ top: 59, bottom: 34 }} style={{ flex: 1 }}>
      <Screen horizontalPadding={0}>
        <ScreenHeader title="Settings" onClose={() => {}} />
        <View
          style={{
            paddingHorizontal: space.screenH,
            paddingTop: space.belowHeader,
            gap: space.rows,
          }}
        >
          <SectionHeader tone="secondary">Appearance</SectionHeader>
          <Segmented
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            value="dark"
            onChange={() => {}}
          />
          <SettingsRow label="Water" value="Millilitres" />
        </View>
      </Screen>
    </LymphaProvider>
  </View>
);
