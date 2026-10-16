import {
  View,
  SettingsRow,
  LymphaProvider,
  BarCluster,
  Pill,
  componentsForBrand,
  space,
} from 'lympha';

export const Values = () => (
  <View style={{ width: 354, gap: space.rows }}>
    <SettingsRow label="Water" value="Millilitres" />
    <SettingsRow label="Lotus Coffee Products" value="Drops" />
    <SettingsRow label="Apax Lab" value="Automatic" onPress={() => {}} />
  </View>
);

export const WideControl = () => (
  <View style={{ width: 354 }}>
    <SettingsRow
      label="Rounding limit"
      detail="How far off target is still close enough."
      wide
      control={
        <View style={{ flexDirection: 'row', gap: space.snug }}>
          {[0.05, 0.1, 0.15, 0.2].map((value) => (
            <Pill
              key={value}
              label={`${Math.round(value * 100)}%`}
              accessibilityRole="radio"
              selected={value === 0.1}
              onPress={() => {}}
              style={{ flex: 1 }}
            />
          ))}
        </View>
      }
    />
  </View>
);

export const OpensAt = () => (
  <View style={{ width: 354 }}>
    <SettingsRow
      label="Opens at"
      detail="Start where you left off, or with a set amount of water."
      wide
      control={
        <View style={{ flexDirection: 'row', gap: space.snug, flexWrap: 'wrap' }}>
          <Pill label="Last used" accessibilityRole="radio" selected onPress={() => {}} />
          {[250, 350, 500, 1000].map((ml) => (
            <Pill key={ml} label={String(ml)} accessibilityRole="radio" onPress={() => {}} />
          ))}
        </View>
      }
    />
  </View>
);

export const Bottles = () => (
  <View style={{ width: 354, gap: space.rows }}>
    {['lotus', 'apax-lab'].map((id) => (
      <SettingsRow
        key={id}
        label={id === 'lotus' ? 'Lotus Coffee Products' : 'Apax Lab with KONFLUX'}
        detail={componentsForBrand(id)
          .map((c) => c.name)
          .join(' · ')}
        control={<BarCluster colours={componentsForBrand(id).map((c) => c.colour)} />}
      />
    ))}
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382, gap: space.rows }}>
    <SettingsRow label="Water" value="Millilitres" />
    <SettingsRow label="Apax Lab" value="Automatic" onPress={() => {}} />
    <SettingsRow
      label="Lotus Coffee Products"
      detail={componentsForBrand('lotus')
        .map((c) => c.name)
        .join(' · ')}
      control={<BarCluster colours={componentsForBrand('lotus').map((c) => c.colour)} />}
    />
  </LymphaProvider>
);
