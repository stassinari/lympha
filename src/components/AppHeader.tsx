/**
 * The dose screen's own chrome: wordmark left, settings right.
 *
 * Settings lives here rather than in the footer beside the rounding line: the
 * footer is status about *this* brew, settings is global configuration, and the
 * two would compete with Details for one corner. The app's rule is **top-right is
 * app chrome, bottom-right acts on this brew**, which every overlay screen follows
 * too.
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
 * Sliders promise "adjust values", and the screen behind this is preferences —
 * appearance, units, defaults. The gear is the honest signal, and its rounder
 * silhouette sits better with the type than two straight tracks.
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
      {/* The leading side is a group of its own rather than a bare child, so
          anything that joins the wordmark lands beside it rather than spread
          across the bar: three bare children under `space-between` would strand
          the name in the middle. */}
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
