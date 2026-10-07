import { describe, expect, it } from 'vitest';
import { componentMap, getRecipe, recipesForBrand } from '@/data';
import { computeDose } from '@/engine';
import { groupLabel, recipeSubtitle } from './recipeList';

const subtitle = (recipeId: string, volumeMl: number) => {
  const recipe = getRecipe(recipeId)!;
  return recipeSubtitle(recipe, computeDose(recipe, volumeMl, componentMap));
};

describe('recipeSubtitle', () => {
  it('names a bottle the volume would lose, ahead of anything else', () => {
    // Rao's is credited to Scott Rao, but at a cup that is not the useful fact.
    expect(subtitle('lotus-raos-recipe', 250)).toEqual({
      text: 'No Potassium at 250 ml',
      tone: 'error',
    });
  });

  it('credits the author when the volume is fine', () => {
    expect(subtitle('lotus-raos-recipe', 1000)).toEqual({
      text: 'Scott Rao',
      tone: 'secondary',
    });
  });

  it('does not warn merely because a recipe is off target', () => {
    // Ultra Light is 19.6% short on alkalinity at a litre, and the dose screen
    // says so. Repeating it here would put the same sentence on nearly every row
    // — at 350 ml, on all seven — which distinguishes nothing.
    expect(subtitle('lotus-ultra-light', 1000)).toEqual({
      text: 'Lotus',
      tone: 'secondary',
    });
  });

  it('leaves the list calm when every recipe is off target', () => {
    // At 350 ml every Lotus recipe is off target; no row should shout when they all would.
    const warned = [
      'lotus-light-and-bright',
      'lotus-simple-and-sweet',
      'lotus-bright-and-juicy',
      'lotus-ultra-light',
    ].filter((id) => subtitle(id, 350)?.tone === 'error');
    expect(warned).toEqual([]);
  });

  it('stays quiet where rounding is not reported', () => {
    // Apax on a scale: no rounding to warn about, and no author credited.
    expect(subtitle('apax-lab-washed', 1000)).toBeNull();
  });

  it('warns exactly when a bottle is lost, and never otherwise', () => {
    // The invariant, rather than a list of ids that goes stale: a row draws the
    // eye if and only if the recipe cannot be made at this volume.
    for (const volumeMl of [200, 250, 350, 500, 1000]) {
      for (const recipe of recipesForBrand('lotus')) {
        const dose = computeDose(recipe, volumeMl, componentMap);
        const warned = recipeSubtitle(recipe, dose)?.tone === 'error';
        expect(warned, `${recipe.id} at ${volumeMl}`).toBe(dose.zeroed.length > 0);
      }
    }
  });

  it('singles out the rows that fail at a cup', () => {
    // At 250 ml Rao's loses potassium and Ultra Light loses magnesium; Simple and
    // Sweet survives. Three rows, two warnings.
    expect(subtitle('lotus-simple-and-sweet', 250)?.tone).toBe('secondary');
    expect(subtitle('lotus-raos-recipe', 250)?.text).toBe('No Potassium at 250 ml');
    expect(subtitle('lotus-ultra-light', 250)?.text).toBe('No Magnesium at 250 ml');
  });
});

describe('groupLabel', () => {
  it('labels the vendor groupings', () => {
    expect(groupLabel('process')).toBe('By process');
    expect(groupLabel('brew-method')).toBe('By brew method');
    expect(groupLabel('barista')).toBe('By barista');
  });

  it('has nothing to say for an ungrouped list', () => {
    // Lotus ships seven recipes and no grouping; a lone heading would be noise.
    expect(groupLabel(undefined)).toBeUndefined();
  });
});
