import { View, Caption, Icon, LymphaProvider, space, themes } from 'lympha';

export const Glyphs = () => (
  <View style={{ flexDirection: 'row', gap: space.loose }}>
    {(['settings', 'chevronDown', 'chevronRight', 'info', 'check', 'checkCircle'] as const).map(
      (name) => (
        <View key={name} style={{ alignItems: 'center', gap: space.tight }}>
          <Icon name={name} />
          <Caption tone="secondary">{name}</Caption>
        </View>
      ),
    )}
  </View>
);

export const Status = () => (
  <View style={{ flexDirection: 'row', gap: space.loose, alignItems: 'center' }}>
    <Icon name="checkCircle" size={20} weight="fill" colour={themes.light.colour.ok} />
    <Icon name="info" size={20} weight="fill" colour={themes.light.colour.warning} />
    <Icon name="info" size={20} weight="fill" colour={themes.light.colour.error} />
  </View>
);

export const Chrome = () => (
  <View style={{ flexDirection: 'row', gap: space.loose, alignItems: 'center' }}>
    <Icon name="settings" size={22} colour={themes.light.colour.textSecondary} />
    <Icon name="chevronRight" size={20} colour={themes.light.colour.textSecondary} />
    <Icon name="chevronRight" size={24} rotate={180} />
    <Icon name="chevronDown" colour={themes.light.colour.textSecondary} />
  </View>
);

export const Dark = () => (
  <LymphaProvider
    scheme="dark"
    style={{ padding: space.blocks, flexDirection: 'row', gap: space.loose }}
  >
    {(['settings', 'chevronDown', 'chevronRight', 'info', 'check'] as const).map((name) => (
      <Icon key={name} name={name} colour={themes.dark.colour.text} />
    ))}
    <Icon name="checkCircle" weight="fill" colour={themes.dark.colour.ok} />
  </LymphaProvider>
);
