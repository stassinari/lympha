/**
 * The metric helpers, bound to the platform the app is actually running on.
 *
 * `metrics.ts` stays free of React Native so it can be tested in plain Node
 * against both platforms' measured behaviour. This is the thin layer that picks
 * one, so call sites never have to think about it.
 */

import { Platform } from 'react-native';
import {
  ascentPxFor,
  capBoxInsetFor,
  capBoxPaddingFor,
  descentPxFor,
  inkInsetsFor,
} from './metrics';
import type { InkExtent, NunitoWeight, TextPlatform } from './metrics';

export const TEXT_PLATFORM: TextPlatform = Platform.OS === 'android' ? 'android' : 'ios';

export const descentPx = (fontSize: number, lineHeight: number) =>
  descentPxFor(TEXT_PLATFORM, fontSize, lineHeight);

export const ascentPx = (fontSize: number, lineHeight: number) =>
  ascentPxFor(TEXT_PLATFORM, fontSize, lineHeight);

export const inkInsets = (
  fontSize: number,
  lineHeight: number,
  weight: NunitoWeight,
  extent: InkExtent = 'text',
) => inkInsetsFor(TEXT_PLATFORM, fontSize, lineHeight, weight, extent);

export const capBoxPadding = (
  fontSize: number,
  lineHeight: number,
  weight: NunitoWeight,
  extent: InkExtent,
) => capBoxPaddingFor(TEXT_PLATFORM, fontSize, lineHeight, weight, extent);

export const capBoxInset = (
  fontSize: number,
  lineHeight: number,
  weight: NunitoWeight,
  extent: InkExtent,
) => capBoxInsetFor(TEXT_PLATFORM, fontSize, lineHeight, weight, extent);
