/**
 * The screen the app opens on.
 *
 * The design brief's whole case is here: one person at a kitchen counter at 6am,
 * before coffee, holding a bottle in one hand and a phone in the other. They want
 * four numbers and to stop looking at the screen. So everything needed to make
 * water is visible without scrolling or tapping, and nothing on it teaches,
 * persuades or onboards.
 *
 * Brand, recipe and volume now come from the store and survive a cold start. The
 * navigation the header and Edit control imply arrives with the screens they open.
 */

import { ScrollView, View } from 'react-native';
import { Screen, SettingsIcon, Touchable, space, useReflowedText } from '@/design';
import { DoseProgress, DoseRow, RecipeHeader, RoundingLine, VolumeCard } from '@/components';
import { useBrand, useDose, useRecipe, useRoundingSummary, useStore } from '@/state';

export type DoseScreenProps = {
  onEditVolume: () => void;
  onChangeRecipe: () => void;
  onOpenSettings: () => void;
  onOpenDetails: () => void;
};

export function DoseScreen({
  onEditVolume,
  onChangeRecipe,
  onOpenSettings,
  onOpenDetails,
}: DoseScreenProps) {
  const brand = useBrand();
  const recipe = useRecipe();
  const dose = useDose();
  const summary = useRoundingSummary(dose);

  const done = useStore((s) => s.done);
  const toggleDone = useStore((s) => s.toggleDone);

  const doneCount = dose.lines.filter((l) => done[l.component.id]).length;

  /**
   * At accessibility text sizes the bottom bar joins the scroll instead of
   * holding the screen's bottom edge.
   *
   * Pinned, it is a sibling of the list and does not shrink, so at the largest
   * sizes it grew to eight lines and squeezed the doses off the screen entirely —
   * the one thing the screen exists to show. Reflowing costs the summary its
   * permanent visibility, which is the lesser loss: at that text size the whole
   * screen is a scroll anyway.
   */
  const reflowed = useReflowedText();

  /* The rounding line and the way out of the screen share the bottom edge, as the
     handoff has them: the settings affordance sits bottom-right, which is also
     the direction its screen rises from. */
  const bottomBar = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        // Supplied by the scroll container when it lives inside one.
        paddingHorizontal: reflowed ? 0 : space.screenH,
      }}
    >
      <View style={{ flex: 1 }}>
        <RoundingLine summary={summary} brandAccent={brand.accent} onDetails={onOpenDetails} />
      </View>
      <Touchable
        onPress={onOpenSettings}
        hitSlop={16}
        accessibilityLabel="Settings"
        style={{ paddingLeft: space.blocks, paddingVertical: space.blocks }}
      >
        <SettingsIcon />
      </Touchable>
    </View>
  );

  return (
    <Screen horizontalPadding={0}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: space.blocks,
          paddingBottom: space.blocks,
          paddingHorizontal: space.screenH,
        }}
      >
        <RecipeHeader
          recipeName={recipe.name}
          brandName={brand.name}
          bottleColours={dose.lines.map((l) => l.component.colour)}
          onPress={onChangeRecipe}
        />

        <VolumeCard volumeMl={dose.volumeMl} onEdit={onEditVolume} />

        <View style={{ gap: space.rows }}>
          <DoseProgress done={doneCount} total={dose.lines.length} brandAccent={brand.accent} />
          {dose.lines.map((line) => (
            <DoseRow
              key={line.component.id}
              line={line}
              done={!!done[line.component.id]}
              onPress={() => toggleDone(line.component.id)}
            />
          ))}
        </View>

        {reflowed ? bottomBar : null}
      </ScrollView>

      {reflowed ? null : bottomBar}
    </Screen>
  );
}
