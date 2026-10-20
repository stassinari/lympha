/**
 * Choose a kit.
 *
 * Tapping a row selects it; ⓘ opens its fact sheet, the pattern of a Wi-Fi list.
 * A kit used before goes straight home on its remembered recipe. A kit never used
 * has its first recipe set and Recipe pushed over this screen with it ticked, so
 * there is never a state without a recipe and the choice is always seen.
 *
 * The fact sheet and that Recipe are pushed here rather than from `Root`: they
 * belong to this screen, and leaving it closes them with it.
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ScreenHeader } from '@/components';
import { componentsForRange, kitOf, kits } from '@/data';
import type { Kit } from '@/data/types';
import {
  BarCluster,
  Caption,
  Card,
  CardTitle,
  Icon,
  Overlay,
  Screen,
  Touchable,
  clusterWidth,
  space,
  useTheme,
} from '@/design';
import { rangeForKit, useStore } from '@/state';
import { FactSheetScreen } from './FactSheetScreen';
import { RecipeScreen } from './RecipeScreen';

/** Room for the longest kit's palette, so the names line up down the list. */
const CLUSTER_COLUMN = clusterWidth('row', 4);

type Pushed = { kind: 'sheet'; kitId: string } | { kind: 'recipe' };

export type KitsScreenProps = { onClose: () => void };

export function KitsScreen({ onClose }: KitsScreenProps) {
  const inUse = useStore((s) => kitOf(s.rangeId).id);
  const chooseKit = useStore((s) => s.chooseKit);
  const [pushed, setPushed] = useState<Pushed | null>(null);
  // Held through the exit, so the leaving screen slides out rather than blanking.
  const [leaving, setLeaving] = useState<Pushed | null>(null);
  if (pushed !== null && pushed !== leaving) setLeaving(pushed);
  const shown = pushed ?? leaving;

  const select = (kitId: string) => {
    if (chooseKit(kitId)) setPushed({ kind: 'recipe' });
    else onClose();
  };

  return (
    <Screen horizontalPadding={0}>
      <ScreenHeader title="Kits" onClose={onClose} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: space.belowHeader,
          paddingBottom: space.loose,
          paddingHorizontal: space.screenH,
          gap: space.rows,
        }}
      >
        <View accessibilityRole="radiogroup" style={{ gap: space.rows }}>
          {kits.map((kit) => (
            <KitRow
              key={kit.id}
              kit={kit}
              selected={kit.id === inUse}
              onSelect={() => select(kit.id)}
              onInfo={() => setPushed({ kind: 'sheet', kitId: kit.id })}
            />
          ))}
        </View>
        <SoonRow />
      </ScrollView>

      <Overlay visible={pushed !== null} from="right" onRequestClose={() => setPushed(null)}>
        {shown?.kind === 'sheet' ? (
          <FactSheetScreen
            kitId={shown.kitId}
            onBack={() => setPushed(null)}
            onClose={onClose}
            onShowRecipe={() => setPushed({ kind: 'recipe' })}
          />
        ) : null}
        {shown?.kind === 'recipe' ? <RecipeScreen onClose={onClose} /> : null}
      </Overlay>
    </Screen>
  );
}

function KitRow({
  kit,
  selected,
  onSelect,
  onInfo,
}: {
  kit: Kit;
  selected: boolean;
  onSelect: () => void;
  onInfo: () => void;
}) {
  const { colour } = useTheme();
  const rangeId = useStore((s) => rangeForKit(s, kit.id));
  return (
    <Card
      selected={selected}
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityLabel={`${kit.name}. ${kit.description}`}
      paddingVertical={10}
      paddingHorizontal={16}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.blocks }}>
        <BarCluster
          size="row"
          colours={componentsForRange(rangeId).map((c) => c.colour)}
          style={{ width: CLUSTER_COLUMN }}
        />
        <View style={{ flex: 1 }}>
          <CardTitle numberOfLines={1}>{kit.name}</CardTitle>
          <Caption tone="secondary" numberOfLines={1}>
            {kit.description}
          </Caption>
        </View>
        <View style={{ width: 20 }}>
          {selected ? <Icon name="check" size={20} colour={colour.text} /> : null}
        </View>
        {/* Neutral, not the accent: on Lotus the accent is a red that reads as an
            error. The glyph's 44pt target runs past the card's padding, so the
            glyph itself sits on the content edge. */}
        <Touchable
          borderless
          onPress={onInfo}
          hitSlop={11}
          accessibilityLabel={`About ${kit.name}`}
          accessibilityHint="Opens the kit’s details"
        >
          <Icon name="info" size={22} colour={colour.textSecondary} />
        </Touchable>
      </View>
    </Card>
  );
}

/** Holds the place of kits on their way. Not a target. */
function SoonRow() {
  return (
    <Card paddingVertical={14} paddingHorizontal={16} accessibilityLabel="More kits, coming soon">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.blocks }}>
        <View style={{ width: CLUSTER_COLUMN }} />
        <View style={{ flex: 1 }}>
          <CardTitle tone="secondary">More kits</CardTitle>
          <Caption tone="secondary">Coming soon</Caption>
        </View>
      </View>
    </Card>
  );
}
