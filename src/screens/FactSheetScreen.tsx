/**
 * A kit's fact sheet: what it is, where it comes from, and its settings.
 *
 * Settings apply as they change, including on a kit not in use: they are stored,
 * and take effect when the kit is chosen. The footer commits — "Use {kit}" for
 * another kit, "Done" for this one — so the header carries only the way back.
 * Each setting has a section header outside its cards, in one order: Range, then
 * Strength, then Measure in, so the unit previews show the amounts that will
 * actually be weighed.
 */

import { useRef, useState } from 'react';
import { Keyboard, Linking, Platform, ScrollView, View } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { MeasureSection, SettingsRow, StrengthCard, offersUnitChoice } from '@/components';
import { componentsForRange, getKit, getRange } from '@/data';
import {
  ActionText,
  BarCluster,
  Body,
  Caption,
  Card,
  CardTitle,
  HEADER_BAND,
  Icon,
  Pill,
  Screen,
  ScreenTitle,
  SectionHeader,
  Touchable,
  clusterWidth,
  resolveAccent,
  space,
  useTheme,
  useTypeMetrics,
} from '@/design';
import { rangeForKit, strengthFor, useStore } from '@/state';

/** Room for the longest Apax range, so the names line up down the cards. */
const CLUSTER_COLUMN = clusterWidth('row', 4);

/** Same as `ScreenHeader`: a 48pt target without moving the glyph. */
const HIT_SLOP = 14;

const bottleNames = (rangeId: string) =>
  componentsForRange(rangeId)
    .map((c) => c.name)
    .join(' · ');
const palette = (rangeId: string) => componentsForRange(rangeId).map((c) => c.colour);

export type FactSheetScreenProps = {
  kitId: string;
  /** Back to the kit list. */
  onBack: () => void;
  /** Home. */
  onClose: () => void;
  /** Recipe, because a range never used has had its first recipe set. */
  onShowRecipe: () => void;
};

export function FactSheetScreen({ kitId, onBack, onClose, onShowRecipe }: FactSheetScreenProps) {
  const { colour, scheme } = useTheme();
  const kit = getKit(kitId)!;
  const inUse = useStore((s) => getRange(s.rangeId)?.kit === kitId);
  const shown = useStore((s) => rangeForKit(s, kitId));
  const strength = useStore((s) => strengthFor(s, kitId));
  const chooseKit = useStore((s) => s.chooseKit);
  const chooseRange = useStore((s) => s.chooseRange);
  const setStrength = useStore((s) => s.setStrength);
  // Whether the range last chosen here had its first recipe set, unseen. Done then
  // shows Recipe rather than going home on a recipe nobody chose.
  const [pickedRecipe, setPickedRecipe] = useState(false);
  const [dragging, setDragging] = useState(false);
  const scroller = useRef<ScrollViewInstance>(null);
  // Where the Strength section starts in the scroller's content.
  const strengthY = useRef(0);
  const range = getRange(shown)!;
  const accent = resolveAccent(range.accent, scheme);
  const back = useTypeMetrics('action');

  // Leaving with the keypad up dismisses it first, which commits a typed strength.
  const leaving = (go: () => void) => () => {
    Keyboard.dismiss();
    go();
  };
  const use = leaving(() => (chooseKit(kitId) ? onShowRecipe() : onClose()));

  return (
    <Screen horizontalPadding={0}>
      <View
        style={{
          minHeight: HEADER_BAND,
          paddingHorizontal: space.screenH,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {/* iOS names where back goes; Android's back is the bare arrow, as on
            every other screen. */}
        <Touchable
          borderless
          onPress={leaving(onBack)}
          hitSlop={HIT_SLOP}
          accessibilityLabel={Platform.OS === 'ios' ? 'Back to kits' : 'Back'}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
        >
          <Icon
            name="chevronRight"
            size={22}
            rotate={180}
            colour={Platform.OS === 'ios' ? accent : colour.text}
          />
          {Platform.OS === 'ios' ? (
            <ActionText numberOfLines={1} style={[{ color: accent }, back.capBoxPadding]}>
              Kits
            </ActionText>
          ) : null}
        </Touchable>
      </View>

      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        // iOS does not resize the screen for the keyboard; this gives the scroller the
        // room to bring the strength key above it. Android resizes the window.
        automaticallyAdjustKeyboardInsets
        scrollEnabled={!dragging}
        contentContainerStyle={{
          paddingTop: space.belowHeader,
          paddingBottom: space.loose,
          paddingHorizontal: space.screenH,
          gap: space.rows,
        }}
      >
        <ScreenTitle>{kit.name}</ScreenTitle>
        <Body>{kit.about}</Body>
        <Touchable
          onPress={() => void Linking.openURL(kit.site.url)}
          accessibilityRole="link"
          accessibilityHint="Opens in the browser"
          style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' }}
        >
          <ActionText style={{ color: accent }}>{kit.site.label}</ActionText>
        </Touchable>

        {kit.rangeIds.length > 1 ? (
          <>
            <SectionHeader tone="secondary" style={{ marginTop: space.snug }}>
              Range
            </SectionHeader>
            <View accessibilityRole="radiogroup" style={{ gap: space.rows }}>
              {kit.rangeIds.map((id) => (
                <RangeCard
                  key={id}
                  rangeId={id}
                  selected={id === shown}
                  onPress={() => id !== shown && setPickedRecipe(chooseRange(kitId, id))}
                />
              ))}
            </View>
          </>
        ) : (
          <>
            <SectionHeader tone="secondary" style={{ marginTop: space.snug }}>
              Bottles
            </SectionHeader>
            <SettingsRow
              label={`${componentsForRange(shown).length} bottles`}
              detail={bottleNames(shown)}
              control={<BarCluster colours={palette(shown)} />}
            />
          </>
        )}

        {kit.strength ? (
          <View
            onLayout={(e) => (strengthY.current = e.nativeEvent.layout.y)}
            style={{ gap: space.rows }}
          >
            <SectionHeader tone="secondary" style={{ marginTop: space.snug }}>
              Strength
            </SectionHeader>
            <StrengthCard
              value={strength}
              onChange={(pct) => setStrength(kitId, pct)}
              accent={accent}
              stepsOf={kit.name}
              // The value is typed on the system keypad, which would otherwise cover
              // it: the section is brought to the top of the scroller, above it.
              onStartTyping={() =>
                scroller.current?.scrollTo({ y: strengthY.current, animated: true })
              }
              onDragChange={setDragging}
            />
            <Caption tone="secondary" style={{ paddingHorizontal: 4 }}>
              {`A share of every published amount, for lighter water. ${kit.name}’s own steps are marked.`}
            </Caption>
          </View>
        ) : null}

        {offersUnitChoice(shown) ? <MeasureSection rangeId={shown} /> : null}
      </ScrollView>

      <View style={{ paddingHorizontal: space.screenH, paddingTop: space.snug }}>
        {inUse ? (
          <Pill
            label="Done"
            emphasis="primary"
            onPress={leaving(pickedRecipe ? onShowRecipe : onClose)}
          />
        ) : (
          <Pill label={`Use ${kit.name}`} emphasis="primary" onPress={use} />
        )}
      </View>
    </Screen>
  );
}

function RangeCard({
  rangeId,
  selected,
  onPress,
}: {
  rangeId: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colour } = useTheme();
  const range = getRange(rangeId)!;
  const label = range.rangeLabel ?? range.name;
  return (
    <Card
      selected={selected}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`${label}. ${bottleNames(rangeId)}`}
      paddingVertical={14}
      paddingHorizontal={16}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.blocks }}>
        <BarCluster size="row" colours={palette(rangeId)} style={{ width: CLUSTER_COLUMN }} />
        <View style={{ flex: 1 }}>
          <CardTitle numberOfLines={1}>{label}</CardTitle>
          <Caption tone="secondary" numberOfLines={1}>
            {bottleNames(rangeId)}
          </Caption>
        </View>
        <View style={{ width: 20 }}>
          {selected ? <Icon name="check" size={20} colour={colour.text} /> : null}
        </View>
      </View>
    </Card>
  );
}
