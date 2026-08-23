/**
 * The screen the app opens on.
 *
 * The design brief's whole case is here: one person at a kitchen counter at 6am,
 * before coffee, holding a bottle in one hand and a phone in the other. They want
 * four numbers and to stop looking at the screen. So everything needed to make
 * water is visible without scrolling or tapping, and nothing on it teaches,
 * persuades or onboards.
 *
 * Static for now — brand, recipe and volume are fixed. Slice 6 makes them state
 * and remembers them between mornings; the navigation the header and Edit control
 * imply arrives with the screens they open.
 */

import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, space } from '@/design';
import { DoseProgress, DoseRow, RecipeHeader, RoundingLine, VolumeCard } from '@/components';
import { componentMap, getBrand, getRecipe } from '@/data';
import { computeDose } from '@/engine';
import { roundingSummary } from '@/format/rounding';

const RECIPE_ID = 'lotus-simple-and-sweet';
const VOLUME_ML = 1000;

export function DoseScreen() {
  /** Ephemeral, and cleared by any change to volume, brand or recipe. Nothing can
   *  change yet, so nothing clears it — that wiring comes with the state slice. */
  const [done, setDone] = useState<Record<string, boolean>>({});

  const recipe = getRecipe(RECIPE_ID);
  const brand = recipe ? getBrand(recipe.brand) : undefined;
  if (!recipe || !brand) throw new Error(`Missing recipe or brand for "${RECIPE_ID}"`);

  const dose = useMemo(() => computeDose(recipe, VOLUME_ML, componentMap), [recipe]);
  const summary = useMemo(() => roundingSummary(dose), [dose]);

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
          onPress={() => {}}
        />

        <VolumeCard volumeMl={dose.volumeMl} onEdit={() => {}} />

        <View style={{ gap: space.rows }}>
          <DoseProgress done={doneCount} total={dose.lines.length} brandAccent={brand.accent} />
          {dose.lines.map((line) => (
            <DoseRow
              key={line.component.id}
              line={line}
              done={!!done[line.component.id]}
              onPress={() => setDone((d) => ({ ...d, [line.component.id]: !d[line.component.id] }))}
            />
          ))}
        </View>
      </ScrollView>

      <RoundingLine summary={summary} brandAccent={brand.accent} onDetails={() => {}} />
    </Screen>
  );
}
