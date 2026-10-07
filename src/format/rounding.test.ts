import { describe, expect, it } from 'vitest';
import { componentMap, getRecipe } from '@/data';
import { computeDose } from '@/engine';
import { blendNote, headline, headlineLabel, missSeverity, roundingSummary } from './rounding';
import { formatGapPercent, formatPpm } from './units';

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
      text: '2% under target',
    });
  });

  it('calls out a recipe that lands essentially on the nose', () => {
    // Rao's targets were reverse-engineered onto whole drops at exactly a litre.
    expect(summary('lotus-raos-recipe', 1000)).toEqual({
      status: 'ok',
      text: 'On target',
    });
  });

  it('escalates past the flag threshold', () => {
    // Ultra Light is 19.6% short on alkalinity, which the vendor never shows.
    expect(summary('lotus-ultra-light', 1000)).toEqual({
      status: 'warning',
      text: '20% under target',
    });
  });

  it('names a bottle that would vanish, ahead of any percentage', () => {
    expect(summary('lotus-raos-recipe', 250)).toEqual({
      status: 'error',
      text: 'No Potassium at this volume',
    });
  });

  it('counts them when more than one would vanish', () => {
    const dose = computeDose(getRecipe('lotus-simple-and-sweet')!, 150, componentMap);
    const result = roundingSummary(dose);
    if (dose.zeroed.length > 1) {
      expect(result?.text).toBe(`${dose.zeroed.length} bottles missing at this volume`);
    }
    expect(result?.status).toBe('error');
  });

  it('says over rather than under when the dose rounds up', () => {
    // Apax in drops at a cup: JAMM's 1.5 drops rounds to 2.
    const result = summary('apax-lab-washed', 200);
    expect(result?.text).toMatch(/over target$/);
  });

  it('honours the flag threshold', () => {
    const tight = summary('lotus-simple-and-sweet', 1000, 0.01);
    expect(tight?.status).toBe('warning');
    expect(tight?.text).toBe('2% under target');
  });
});

describe('headline', () => {
  /**
   * Rao's at 1500 ml headlines 7% over target from an alkalinity of 21.4286
   * against 20.1. Printed to one decimal, 21.4 against 20.1 gives 6%. The app's
   * whole claim is that its arithmetic is checkable, so the printed figures must
   * reproduce the headline.
   */
  it('can be reproduced from the figures the detail screen prints', () => {
    const dose = computeDose(getRecipe('lotus-raos-recipe')!, 1500, componentMap);
    const { gap, source } = headline(dose);

    expect(source).toEqual({ kind: 'profile', measure: 'alkalinity', label: 'Alkalinity' });
    expect(Math.round(Math.abs(gap) * 100)).toBe(7);

    const profile = dose.profile!;
    const asPrinted = (delivered: number, target: number) => {
      const t = Number(formatPpm(target));
      return (Number(formatPpm(delivered)) - t) / t;
    };

    expect(
      formatGapPercent(asPrinted(profile.delivered.alkalinity, profile.target.alkalinity)),
    ).toBe(formatGapPercent(gap));
    expect(formatGapPercent(asPrinted(profile.delivered.hardness, profile.target.hardness))).toBe(
      formatGapPercent(profile.hardnessError),
    );
  });

  it('falls back to the worst bottle where the vendor publishes no ion data', () => {
    const dose = computeDose(getRecipe('apax-lab-standard-cupping')!, 500, componentMap);
    const { source } = headline(dose);
    expect(source?.kind).toBe('bottle');
  });

  it('counts exactly a third as off, not far off', () => {
    // Apax Washed in drops at a cup: JAMM's 1.5 drops rounds to 2, a third over.
    expect(summary('apax-lab-washed', 200)).toEqual({ status: 'warning', text: '33% over target' });
  });

  it('calls more than a third an error, whatever the threshold', () => {
    expect(summary('lotus-bright-and-juicy', 250)).toEqual({
      status: 'error',
      text: '79% over target at this volume',
    });
    expect(summary('lotus-bright-and-juicy', 250, 0.2)?.status).toBe('error');
  });
});

describe('missSeverity', () => {
  it('stays quiet within the threshold', () => {
    expect(missSeverity(0.1, 0.1)).toBeNull();
    expect(missSeverity(-0.04, 0.05)).toBeNull();
  });

  it('warns past the threshold, either side of the target', () => {
    expect(missSeverity(0.11, 0.1)).toBe('warning');
    expect(missSeverity(-0.11, 0.1)).toBe('warning');
  });

  it('is an error past a third, or for a missing bottle', () => {
    expect(missSeverity(1 / 3, 0.1)).toBe('warning');
    expect(missSeverity(-0.34, 0.1)).toBe('error');
    expect(missSeverity(-1, 0.1, true)).toBe('error');
  });
});

const dose = (recipeId: string, volumeMl: number) =>
  computeDose(getRecipe(recipeId)!, volumeMl, componentMap);

describe('headlineLabel', () => {
  it('names the water figure the headline quotes, in lower case', () => {
    expect(headlineLabel(dose('lotus-bright-and-juicy', 250))).toBe('alkalinity');
  });

  it('names both water figures when they show the same percentage', () => {
    expect(headlineLabel(dose('lotus-bright-and-juicy', 500))).toBe('hardness and alkalinity');
  });

  it('names two tied bottles, and counts three or more', () => {
    expect(headlineLabel(dose('apax-lab-washed', 200))).toBe('JAMM and LYLAC');
    expect(headlineLabel(dose('apax-lab-standard-cupping', 250))).toBe('4 bottles');
  });

  it('names the missing bottles when there are any', () => {
    expect(headlineLabel(dose('lotus-raos-recipe', 250))).toBe('Potassium');
    expect(headlineLabel(dose('lotus-bright-and-juicy', 200))).toBe('Sodium and Potassium');
  });
});

describe('blendNote', () => {
  it('explains a water figure that sits closer to target than its furthest bottle', () => {
    expect(blendNote(dose('lotus-raos-recipe', 350))).toBe(
      'Alkalinity comes from Sodium and Potassium together, so it’s closer to target than Potassium alone.',
    );
  });

  it('says nothing when no bottle is further out than the headline', () => {
    // Light and Bright's alkalinity comes from Potassium alone, and its hardness
    // from Calcium alone, so each figure is exactly its one bottle.
    expect(blendNote(dose('lotus-light-and-bright', 1000))).toBeNull();
  });

  it('says nothing with a bottle missing, or without ion data', () => {
    expect(blendNote(dose('lotus-raos-recipe', 250))).toBeNull();
    expect(blendNote(dose('apax-lab-washed', 350))).toBeNull();
  });
});
