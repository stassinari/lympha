import {
  View,
  BodyRegular,
  CardTitle,
  Icon,
  LymphaProvider,
  Touchable,
  Wordmark,
  componentMap,
  computeDose,
  getRecipe,
  radius,
  roundingSummary,
  space,
  themes,
} from 'lympha';

export const SettingsGlyph = () => (
  <View
    style={{
      width: 354,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    <Wordmark>Lympha</Wordmark>
    <Touchable borderless onPress={() => {}} hitSlop={12} accessibilityLabel="Settings">
      <Icon name="settings" size={22} colour={themes.light.colour.textSecondary} />
    </Touchable>
  </View>
);

export const Region = () => (
  <View style={{ width: 354 }}>
    <Touchable
      pressDim
      onPress={() => {}}
      accessibilityLabel="Rounding details"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.snug,
        paddingVertical: space.blocks,
      }}
    >
      <Icon name="checkCircle" size={20} weight="fill" colour={themes.light.colour.ok} />
      <BodyRegular tone="secondary" style={{ flex: 1 }}>
        {roundingSummary(computeDose(getRecipe('lotus-raos-recipe'), 1000, componentMap))?.text}
      </BodyRegular>
      <Icon name="chevronRight" size={20} colour={themes.light.colour.textSecondary} />
    </Touchable>
  </View>
);

export const Surface = () => (
  <View style={{ flexDirection: 'row' }}>
    <View style={{ borderRadius: radius.control, overflow: 'hidden' }}>
      <Touchable
        radius={radius.control}
        onPress={() => {}}
        style={{
          backgroundColor: themes.light.colour.control,
          paddingVertical: 12,
          paddingHorizontal: space.loose,
        }}
      >
        <CardTitle>Done</CardTitle>
      </Touchable>
    </View>
  </View>
);

export const Disabled = () => (
  <View style={{ flexDirection: 'row' }}>
    <View style={{ borderRadius: radius.control, overflow: 'hidden' }}>
      <Touchable
        disabled
        radius={radius.control}
        onPress={() => {}}
        style={{
          backgroundColor: themes.light.colour.control,
          paddingVertical: 12,
          paddingHorizontal: space.loose,
        }}
      >
        <CardTitle>Done</CardTitle>
      </Touchable>
    </View>
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382 }}>
    <Touchable
      pressDim
      onPress={() => {}}
      accessibilityLabel="Rounding details"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.snug,
        paddingVertical: space.blocks,
      }}
    >
      <Icon name="checkCircle" size={20} weight="fill" colour={themes.dark.colour.ok} />
      <BodyRegular tone="secondary" style={{ flex: 1 }}>
        {roundingSummary(computeDose(getRecipe('lotus-raos-recipe'), 1000, componentMap))?.text}
      </BodyRegular>
      <Icon name="chevronRight" size={20} colour={themes.dark.colour.textSecondary} />
    </Touchable>
  </LymphaProvider>
);
