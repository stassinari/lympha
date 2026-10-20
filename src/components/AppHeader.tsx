/**
 * The dose screen's own chrome: the kit in use on the left, settings on the right.
 *
 * The kit is the parent of the recipe, so it sits in the chrome and the recipe in
 * the content below. The app's rule is **top-right is app chrome, bottom-right
 * acts on this brew**, which every overlay screen follows too.
 *
 * The label is set in the wordmark role, Figtree, the only thing in the app that
 * is. A second family is a cost — another face to load, another set of metrics to
 * keep — and it is worth paying here: setting the header apart from the content
 * is what stops it reading as the top of the page. 16pt against the overlay
 * screens' 24pt titles keeps it from competing with the volume, the screen's hero.
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
 * Sliders promise "adjust values", and the screen behind this is preferences.
 * The gear is the honest signal, and its rounder silhouette sits better with the
 * type than two straight tracks. Muted: the thing on this screen worth reading
 * first is the volume.
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

export type AppHeaderProps = {
  /** The range's short name: "Apax Lab [K]". */
  label: string;
  /** How a screen reader says `label`. */
  spokenLabel: string;
  /** Whole percent. Shown only below 100. */
  strength: number;
  onOpenKits: () => void;
  onOpenSettings: () => void;
};

export function AppHeader({
  label,
  spokenLabel,
  strength,
  onOpenKits,
  onOpenSettings,
}: AppHeaderProps) {
  const { colour } = useTheme();
  /**
   * Squares the label's box about its caps, so plain centring in the band lands
   * where the eye says it should.
   *
   * Centring the line box instead would sit the label low: React Native pins the
   * space under the baseline to the font's descent and puts every bit of
   * line-height slack above it, and Figtree's descent is deep enough to show.
   * Read at the reader's text size, not the nominal one, or the centring stops
   * being centred the moment dynamic type moves.
   */
  const wordmark = useTypeMetrics('wordmark');
  const reduced = strength !== 100;

  return (
    <View
      style={{
        minHeight: HEADER_BAND,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: space.blocks,
      }}
    >
      <Touchable
        onPress={onOpenKits}
        accessibilityLabel={`Kit, ${spokenLabel}${reduced ? `, ${strength}% strength` : ''}`}
        accessibilityHint="Changes the kit"
        style={{
          flexShrink: 1,
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.snug,
        }}
      >
        {/* One line: the name gives way first, the strength never does. */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', flexShrink: 1 }}>
          <Wordmark numberOfLines={1} style={[wordmark.capBoxPadding, { flexShrink: 1 }]}>
            {label}
          </Wordmark>
          {reduced ? (
            <Wordmark
              tone="secondary"
              numberOfLines={1}
              style={[wordmark.capBoxPadding, { marginLeft: space.tight }]}
            >
              {`· ${strength}%`}
            </Wordmark>
          ) : null}
        </View>
        <Icon name="chevronDown" size={16} colour={colour.textSecondary} />
      </Touchable>
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
