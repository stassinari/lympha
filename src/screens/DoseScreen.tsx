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

export type DoseScreenProps = {
  onEditVolume: () => void;
  onChangeRecipe: () => void;
};

export function DoseScreen({ onEditVolume, onChangeRecipe }: DoseScreenProps) {
  const brand = useBrand();
  const recipe = useRecipe();
  const dose = useDose();
  const summary = useRoundingSummary(dose);

  const done = useStore((s) => s.done);
  const toggleDone = useStore((s) => s.toggleDone);
  const setRecipe = useStore((s) => s.setRecipe);

  // TEMPORARY — replaced by the brand and recipe screen in the next slice.
  const cycleRecipe = () => {
    const all = recipesForBrand(brand.id);
    const next = all[(all.findIndex((r) => r.id === recipe.id) + 1) % all.length];
    if (next) setRecipe(brand.id, next.id);
    onChangeRecipe();
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
      </ScrollView>

      <RoundingLine summary={summary} brandAccent={brand.accent} onDetails={() => {}} />
    </Screen>
  );
}
