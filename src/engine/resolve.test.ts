import { describe, expect, it } from 'vitest';
import { UnresolvableTargetError, additionsFromTarget, caco3PerDoseUnitPerLitre } from './resolve';
import { componentMap, getComponent } from '@/data';
import type { Component } from '@/data/types';

const MG = 'lotus-magnesium';
const NA = 'lotus-sodium';

describe('caco3PerDoseUnitPerLitre', () => {
  it('reads hardness from a divalent bottle and alkalinity from a monovalent one', () => {
    expect(caco3PerDoseUnitPerLitre(getComponent(MG)!)).toBeCloseTo(8.0357, 3);
    expect(caco3PerDoseUnitPerLitre(getComponent(NA)!)).toBeCloseTo(4.0179, 3);
  });

  it('is zero for a component with no published ion data', () => {
    expect(caco3PerDoseUnitPerLitre(getComponent('apax-lab-tonik')!)).toBe(0);
  });
});

describe('additionsFromTarget', () => {
  it('converts ppm to dose units at the reference volume', () => {
    const [addition] = additionsFromTarget([{ component: MG, caco3Ppm: 50 }], componentMap, 1000);
    // The worked example from water-schema-v0: 50 ppm Mg at 1 L is 6.22 drops,
    // which Lotus rounds to 6 while still reporting 50 ppm. You get 48.2.
    expect(addition?.amount).toBeCloseTo(6.222, 3);
  });

  it('scales linearly with the reference volume', () => {
    const at1L = additionsFromTarget([{ component: MG, caco3Ppm: 50 }], componentMap, 1000);
    const at250 = additionsFromTarget([{ component: MG, caco3Ppm: 50 }], componentMap, 250);
    expect(at250[0]!.amount).toBeCloseTo(at1L[0]!.amount / 4, 10);
  });

  it('leaves amounts unrounded', () => {
    // Quantising belongs to the dispenser you are holding, not to the recipe.
    // Rounding here would destroy the ideal before anything could compare to it.
    const [addition] = additionsFromTarget([{ component: MG, caco3Ppm: 30 }], componentMap, 1000);
    expect(addition?.amount).not.toBe(Math.round(addition!.amount));
  });

  it('refuses a target naming an unknown component', () => {
    expect(() =>
      additionsFromTarget([{ component: 'nope', caco3Ppm: 10 }], componentMap, 1000),
    ).toThrow(UnresolvableTargetError);
  });

  it('refuses a ppm target on a component that publishes no ion data', () => {
    // Apax states doses, never targets. Asking for a profile from a component
    // whose chemistry is unpublished has no honest answer, so it is an error
    // rather than a plausible-looking number.
    expect(() =>
      additionsFromTarget([{ component: 'apax-lab-tonik', caco3Ppm: 50 }], componentMap, 1000),
    ).toThrow(UnresolvableTargetError);
  });

  it('handles a component donating both hardness and alkalinity', () => {
    const hybrid: Component = {
      id: 'hybrid',
      brand: 'test',
      name: 'Hybrid',
      kind: 'product',
      doseUnit: 'drop',
      dispensers: [
        {
          id: 'd',
          label: 'Dropper',
          unit: 'drop',
          step: 1,
          allowPartial: false,
          equivalentInDoseUnit: 1,
        },
      ],
      ions: { asCaCO3: { hardness: 3, alkalinity: 2 }, mgPerL: {} },
    };
    expect(caco3PerDoseUnitPerLitre(hybrid)).toBe(5);
    const [addition] = additionsFromTarget(
      [{ component: 'hybrid', caco3Ppm: 50 }],
      new Map([['hybrid', hybrid]]),
      1000,
    );
    expect(addition?.amount).toBe(10);
  });
});
