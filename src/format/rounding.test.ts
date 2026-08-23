import { describe, expect, it } from 'vitest';
import { componentMap, getRecipe } from '@/data';
import { computeDose } from '@/engine';
import { roundingSummary } from './rounding';

const summary = (recipeId: string, volumeMl: number, flagAbove?: number) =>
  roundingSummary(computeDose(getRecipe(recipeId)!, volumeMl, componentMap), flagAbove);

describe('roundingSummary', () => {
  it('says nothing where rounding is not worth mentioning', () => {
    // Apax on a scale. The step is reading resolution, not a physical limit.
    expect(summary('apax-lab-washed', 1000)).toBeNull();
  });

  it('reports the error in the water, not the worst bottle, where it can', () => {
    // Simple and Sweet has a bottle 7% out but delivers hardness within 1.8%.
    // Reporting the bottle would overstate the problem at 6am.
    expect(summary('lotus-simple-and-sweet', 1000)).toEqual({
      status: 'ok',
      text: 'Rounds clean — 2% under target',
    });
  });

  it('calls out a recipe that lands essentially on the nose', () => {
    // Rao's targets were reverse-engineered onto whole drops at exactly a litre.
    expect(summary('lotus-raos-recipe', 1000)).toEqual({
      status: 'ok',
      text: 'Rounds exactly',
    });
  });

  it('escalates past the flag threshold', () => {
    // Ultra Light is 19.6% short on alkalinity, which the vendor never shows.
    expect(summary('lotus-ultra-light', 1000)).toEqual({
      status: 'warning',
      text: 'Rounds hard — 20% under target',
    });
  });

  it('names a bottle that would vanish, ahead of any percentage', () => {
    expect(summary('lotus-raos-recipe', 250)).toEqual({
      status: 'warning',
      text: 'Potassium would round to zero',
    });
  });

  it('counts them when more than one would vanish', () => {
    const dose = computeDose(getRecipe('lotus-simple-and-sweet')!, 150, componentMap);
    const result = roundingSummary(dose);
    if (dose.zeroed.length > 1) {
      expect(result?.text).toBe(`${dose.zeroed.length} bottles would round to zero`);
    }
    expect(result?.status).toBe('warning');
  });

  it('says over rather than under when the dose rounds up', () => {
    // Apax in drops at a cup: JAMM's 1.5 drops rounds to 2.
    const result = summary('apax-lab-washed', 200);
    expect(result?.text).toMatch(/over target$/);
    expect(result?.status).toBe('warning');
  });

  it('honours the flag threshold', () => {
    const tight = summary('lotus-simple-and-sweet', 1000, 0.01);
    expect(tight?.status).toBe('warning');
    expect(tight?.text).toMatch(/^Rounds hard/);
  });
});
