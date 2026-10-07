import { describe, expect, it } from 'vitest';
import app from '../../app.json';
import { brands, components } from '@/data';
import { dark, light } from './palette';

/** WCAG 2.x relative luminance of a `#RRGGBB` colour. */
function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** `fg` composited over `bg` at `alpha`, as the renderer draws a muted mark. */
function over(fg: string, bg: string, alpha: number): string {
  const mix = (i: number) =>
    Math.round(
      parseInt(fg.slice(i, i + 2), 16) * alpha + parseInt(bg.slice(i, i + 2), 16) * (1 - alpha),
    )
      .toString(16)
      .padStart(2, '0');
  return `#${mix(1)}${mix(3)}${mix(5)}`;
}

/** Mirrors `CLEAR_MARK_OPACITY`, which lives in a React Native component. */
const CLEAR_MARK_OPACITY = 0.8;

describe('splash screen', () => {
  /**
   * The native splash is drawn before any JavaScript runs, so `app.json` has to
   * restate the page colours as literals. Pinned here so that a palette change
   * cannot leave the splash flashing the old background on the way in.
   */
  const plugin = app.expo.plugins.find(
    (p): p is [string, { backgroundColor: string; dark: { backgroundColor: string } }] =>
      Array.isArray(p) && p[0] === 'expo-splash-screen',
  );

  it('is configured', () => {
    expect(plugin).toBeDefined();
  });

  it('matches the page background in light', () => {
    expect(plugin?.[1].backgroundColor.toUpperCase()).toBe(light.background.toUpperCase());
  });

  it('matches the page background in dark', () => {
    expect(plugin?.[1].dark.backgroundColor.toUpperCase()).toBe(dark.background.toUpperCase());
  });
});

describe('clear-state mark', () => {
  const schemes = [
    ['light', light],
    ['dark', dark],
  ] as const;

  /**
   * WCAG 1.4.11: a graphic that carries meaning needs 3:1 against what it sits
   * on. Measured as drawn, after the mute, because that is what reaches the eye.
   */
  it.each(schemes)('clears 3:1 as drawn in %s', (_, tokens) => {
    const drawn = over(tokens.ok, tokens.background, CLEAR_MARK_OPACITY);
    expect(contrast(drawn, tokens.background)).toBeGreaterThanOrEqual(3);
  });

  /**
   * A state colour that is also a bottle's colour reads as that bottle. Brand
   * accents count too: one colours the "Details" link right beside the check.
   */
  it.each(schemes)('is no bottle or brand colour in %s', (scheme, tokens) => {
    const taken = [
      ...components.flatMap((c) => (c.colour ? [c.colour[scheme]] : [])),
      ...brands.map((b) => b.accent[scheme]),
    ].map((c) => c.toUpperCase());
    expect(taken).not.toContain(tokens.ok.toUpperCase());
  });
});

describe('off-target colours', () => {
  const schemes = [
    ['light', light],
    ['dark', dark],
  ] as const;

  /** Both draw the status mark, which is a meaningful graphic: 3:1. */
  it.each(schemes)('draw a legible mark in %s', (_, tokens) => {
    expect(contrast(tokens.warning, tokens.background)).toBeGreaterThanOrEqual(3);
    expect(contrast(tokens.error, tokens.background)).toBeGreaterThanOrEqual(3);
  });

  /** `error` is also a text colour, on the page and on cards: 4.5:1. */
  it.each(schemes)('lets error double as text in %s', (_, tokens) => {
    expect(contrast(tokens.error, tokens.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.error, tokens.card)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(schemes)('are no bottle or brand colour in %s', (scheme, tokens) => {
    const taken = [
      ...components.flatMap((c) => (c.colour ? [c.colour[scheme]] : [])),
      ...brands.map((b) => b.accent[scheme]),
    ].map((c) => c.toUpperCase());
    expect(taken).not.toContain(tokens.warning.toUpperCase());
    expect(taken).not.toContain(tokens.error.toUpperCase());
  });
});
