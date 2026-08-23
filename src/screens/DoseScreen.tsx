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
import { Screen, space } from '@/design';
import { DoseProgress, DoseRow, RecipeHeader, RoundingLine, VolumeCard } from '@/components';
import { recipesForBrand } from '@/data';
import { useBrand, useDose, useRecipe, useRoundingSummary, useStore } from '@/state';

/**
 * Temporary stand-ins so the store can be exercised before the screens that
 * replace them exist. Both are one line each in `DoseScreen` and go away in the
 * slices that build the volume and brand-and-recipe screens.
 */
const PRESET_VOLUMES = [250, 350, 500, 1000];

export function DoseScreen() {
  const brand = useBrand();
  const recipe = useRecipe();
  const dose = useDose();
  const summary = useRoundingSummary(dose);

  const done = useStore((s) => s.done);
  const toggleDone = useStore((s) => s.toggleDone);
  const setVolume = useStore((s) => s.setVolume);
  const setRecipe = useStore((s) => s.setRecipe);

  // TEMPORARY — replaced by the volume screen.
  const cycleVolume = () => {
    const next =
      PRESET_VOLUMES[(PRESET_VOLUMES.indexOf(dose.volumeMl) + 1) % PRESET_VOLUMES.length];
    setVolume(next ?? PRESET_VOLUMES[0]!);
  };

  // TEMPORARY — replaced by the brand and recipe screen.
  const cycleRecipe = () => {
    const all = recipesForBrand(brand.id);
    const next = all[(all.findIndex((r) => r.id === recipe.id) + 1) % all.length];
    if (next) setRecipe(brand.id, next.id);
  };

  const doneCount = dose.lines.filter((l) => done[l.component.id]).length;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: space.blocks, paddingBottom: space.blocks }}
      >
        <RecipeHeader
          recipeName={recipe.name}
          brandName={brand.name}
          bottleColours={dose.lines.map((l) => l.component.colour)}
          onPress={cycleRecipe}
        />

        <VolumeCard volumeMl={dose.volumeMl} onEdit={cycleVolume} />

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
      </ScrollView>

      <RoundingLine summary={summary} brandAccent={brand.accent} onDetails={() => {}} />
    </Screen>
  );
}
