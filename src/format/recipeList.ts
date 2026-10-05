/**
 * How each recipe reads in the picker.
 *
 * The list is the one place you can see, before committing, whether a recipe is
 * even makeable at the volume in your kettle. That is worth more than any
 * description: Rao's is exact at a litre and loses a mineral entirely at a cup,
 * and nothing on a vendor's list tells you so.
 */

import type { Recipe, RecipeGroup } from '@/data/types';
import type { Dose } from '@/engine';

export type RecipeSubtitle = {
  text: string;
  tone: 'secondary' | 'warning';
};

/** Section headings, in the vendor's own grouping. Apax's current range has
 *  fifteen recipes, which is too many to read as one flat list at 6am. */
const GROUP_LABEL: Record<RecipeGroup, string> = {
  process: 'By process',
  roast: 'By roast',
  'brew-method': 'By brew method',
  varietal: 'By varietal',
  signature: 'Signature',
};

export const groupLabel = (group: RecipeGroup | undefined): string | undefined =>
  group ? GROUP_LABEL[group] : undefined;

/**
 * What to say under a recipe's name.
 *
 * Only a bottle actually vanishing is worth a warning here. Flagging every recipe
 * that merely rounds hard sounds thorough and is useless: at 350 ml every Lotus
 * recipe rounds hard, so the same amber sentence would sit on all seven rows, say
 * nothing about which to pick, and bury the one fact that does distinguish them.
 * A warning that is always on is not a warning.
 *
 * The rounding gap is already reported twice — on the dose screen once a recipe is
 * chosen, and by the nudge when the volume is the thing at fault. A losable
 * mineral is different: it is categorical rather than a matter of degree, it
 * affects only some recipes at any given volume, and it is the one thing that
 * should change which row you tap.
 *
 * Otherwise the author, where one is credited. "Scott Rao" is a reason to pick a
 * recipe; a vendor's marketing sentence is not, which is why none is stored.
 */
export function recipeSubtitle(recipe: Recipe, dose: Dose): RecipeSubtitle | null {
  const zeroed = dose.zeroed;
  if (dose.showsRounding && zeroed.length === 1) {
    return { text: `Loses ${zeroed[0]!.component.name} at ${dose.volumeMl} ml`, tone: 'warning' };
  }
  if (dose.showsRounding && zeroed.length > 1) {
    return { text: `Loses ${zeroed.length} bottles at ${dose.volumeMl} ml`, tone: 'warning' };
  }

  return recipe.attribution ? { text: recipe.attribution, tone: 'secondary' } : null;
}
