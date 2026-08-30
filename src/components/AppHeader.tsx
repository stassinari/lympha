/**
 * The dose screen's own chrome: wordmark left, settings right.
 *
 * Settings used to sit at the bottom-right of the dose screen, sharing the footer
 * with the rounding line. That put two unrelated things in one slot — the footer
 * is contextual status about *this* brew, and settings is global configuration —
 * and it made them compete with Details for the same corner.
 *
 * Splitting them gives the app a rule it did not have: **top-right is app chrome,
 * bottom-right acts on this brew.** Every overlay screen already puts its action
 * top-right, so the dose screen was the odd one out rather than the precedent.
 *
 * The wordmark is set in Figtree, and is the only thing in the app that is. A
 * second family is a cost — another face to load, another set of metrics to keep —
 * and it is worth paying exactly here: the mark is a picture of the app's name
 * rather than a piece of its content, and setting it apart is what stops the
 * header reading as the top of the page.
 *
 * Everything about how it is set says "not a heading": mixed case, 16pt against
 * the overlay screens' 24pt titles, lightly tracked open, and in the secondary
 * tone. The screen already has a hero and it is the volume figure — a
 * full-strength app name at the top would be a second one, competing with the
 * number the screen exists to show.
 *
 * The band it sits in is the same height as every other screen's — see
 * `HEADER_BAND` — so the recipe card below it starts at the same y as the first
 * row on Settings, Recipes and Details.
 */

import { HEADER_BAND, Icon, Touchable, Wordmark, space, useTheme, useTypeMetrics } from '@/design';
import { View } from 'react-native';

/**
 * A gear, not sliders.
 *
 * The sliders this replaces promised "adjust values", and the screen behind it is
 * preferences — appearance, units, defaults. The gear is the honest signal, and
 * its rounder silhouette sits better with the type than two straight tracks did.
 *
 * Muted, like the wordmark opposite it: the pair is chrome, and the thing on this
 * screen worth reading first is the volume.
 */
const GLYPH = 24;

/**
 * Expands the glyph to a 44pt target without moving it or the row.
 *
 * The glyph is 24pt square, so the target needs 10pt on every side. Padding the
 * button out instead would push the glyph inboard of the screen's content edge
 * and lose its alignment with the cards below. `hitSlop` is the property for
 * exactly this: touch area without layout.
 */
const HIT_SLOP = 10;

export type AppHeaderProps = { onOpenSettings: () => void };

export function AppHeader({ onOpenSettings }: AppHeaderProps) {
  const { colour } = useTheme();
  /**
   * Squares the mark's box about its caps, so plain centring in the band lands
   * where the eye says it should.
   *
   * Centring the line box instead would sit the mark low: React Native pins the
   * space under the baseline to the font's descent and puts every bit of
   * line-height slack above it, and Figtree's descent is deep enough to show.
   * Read at the reader's text size, not the nominal one, or the centring stops
   * being centred the moment dynamic type moves.
   */
  const wordmark = useTypeMetrics('wordmark');

  return (
    <View
      style={{
        minHeight: HEADER_BAND,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* The leading side is a group of its own rather than a bare child, so the
          brand mark that will eventually sit left of the wordmark can be added
          here without touching anything else. Three bare children under
          `space-between` would spread mark / wordmark / gear across the bar and
          strand the name in the middle; inside a group, the mark is additive and
          the band, the content start line and the type tests all stay put. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.snug }}>
        {/* Decorative: a screen reader already announces the app by name on
            launch, so reading it again at the top of the only screen is noise. */}
        <Wordmark
          tone="secondary"
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={wordmark.capBoxPadding}
        >
          Lympha
        </Wordmark>
      </View>
      <Touchable
        borderless
        onPress={onOpenSettings}
        hitSlop={HIT_SLOP}
        accessibilityLabel="Settings"
      >
        <Icon name="settings" size={GLYPH} colour={colour.textSecondary} />
      </Touchable>
    </View>
  );
}
