/**
 * The kits, as the fact sheets present them. Copy, not vendor data: the
 * descriptions are Lympha's own words.
 */

import type { Kit } from './types';

export const lotusKit: Kit = {
  id: 'lotus',
  name: 'Lotus Water',
  description: 'Single-mineral drops',
  about: [
    'Each bottle holds one mineral, and every recipe is a different balance of them.',
    'Magnesium and Calcium set the water’s hardness (GH); Sodium and Potassium, its alkalinity (KH). Hardness helps draw flavour from the coffee, and alkalinity softens its acidity.',
  ],
  site: { label: 'lotuscoffeeproducts.com', url: 'https://lotuscoffeeproducts.com' },
  rangeIds: ['lotus'],
  strength: false,
};

export const apaxKit: Kit = {
  id: 'apax',
  name: 'Apax Lab',
  description: 'Blended concentrates',
  about: [
    'Each concentrate is a blend of minerals, made to shape one part of the cup. Recipes are paired with a process, roast, varietal or brew method, and a few come from baristas. Start from the pairing, or see what a recipe does with other beans.',
  ],
  site: { label: 'apaxlab.com', url: 'https://apaxlab.com' },
  // KONFLUX first: the range Apax Lab sells today.
  rangeIds: ['apax-lab', 'apax-lab-original'],
  strength: true,
};
