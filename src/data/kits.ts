/**
 * The kits, as the fact sheets present them. Copy, not vendor data: the
 * descriptions are Lympha's own words.
 */

import type { Kit } from './types';

export const lotusKit: Kit = {
  id: 'lotus',
  name: 'Lotus Coffee Products',
  description: 'Single-mineral drops',
  about:
    'Each bottle holds a single mineral, dosed in drops. Recipes mix them in different amounts, so one set of bottles can build many kinds of water.',
  site: { label: 'lotuscoffeeproducts.com', url: 'https://lotuscoffeeproducts.com' },
  rangeIds: ['lotus'],
  strength: false,
};

export const apaxKit: Kit = {
  id: 'apax',
  name: 'Apax Lab',
  description: 'Blended concentrates, weighed',
  about:
    'Blended concentrates, each mixed to shape one part of the cup and weighed on a scale. Recipes are grouped by process and roast, so you start from the coffee in front of you.',
  site: { label: 'apaxlab.com', url: 'https://apaxlab.com' },
  // KONFLUX first: the range Apax Lab sells today.
  rangeIds: ['apax-lab', 'apax-lab-original'],
  strength: true,
};
