/**
 * One line of settings: a label, an optional explanation, and a control.
 *
 * The control is passed in rather than enumerated, because the four sections use
 * a switch, a pill row, a chevron and a plain value, and a component that knew
 * about all of them would be longer than the screen.
 */

import { View } from 'react-native';
import { Caption, Card, CardTitle, Icon, space, useTheme } from '@/design';

/**
 * The chevron is the tell that a row pushes a screen, and it is drawn from
 * `onPress` alone so it can never disagree with what the row does.
 *
 * Water and the single-dispenser brands show a value and no chevron, which looks
 * like an inconsistency next to Apax and is not one: those rows have nothing to
 * choose — millilitres is the only unit for water, and Lotus ships a dropper and
 * no scale — so they are statements rather than pickers, and they are not tap
 * targets at all. A chevron on them would promise a screen that does not exist.
 */
const CHEVRON = 20;

export type SettingsRowProps = {
  label: string;
  /** A sentence of context, where the label alone is not enough. */
  detail?: string;
  /** Rendered on the right for a compact control, or below for a wide one. */
  control?: React.ReactNode;
  wide?: boolean;
  onPress?: () => void;
  /** Shows a chevron and makes the row a target. */
  value?: string;
};

export function SettingsRow({
  label,
  detail,
  control,
  wide = false,
  onPress,
  value,
}: SettingsRowProps) {
  const { colour } = useTheme();

  return (
    <Card
      paddingVertical={14}
      paddingHorizontal={16}
      onPress={onPress}
      accessibilityLabel={value ? `${label}, ${value}` : label}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.blocks }}>
        <View style={{ flex: 1 }}>
          <CardTitle>{label}</CardTitle>
          {detail ? (
            <Caption tone="secondary" style={{ marginTop: 2 }}>
              {detail}
            </Caption>
          ) : null}
        </View>
        {value ? <Caption tone="secondary">{value}</Caption> : null}
        {onPress ? <Icon name="chevronRight" size={CHEVRON} colour={colour.textSecondary} /> : null}
        {!wide && control ? control : null}
      </View>
      {wide && control ? <View style={{ marginTop: space.blocks }}>{control}</View> : null}
    </Card>
  );
}
