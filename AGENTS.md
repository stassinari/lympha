# Working agreement — Lympha

## Expo

Expo HAS CHANGED. Read the exact versioned docs at
https://docs.expo.dev/versions/v57.0.0/ before writing any code.

---

## Ways of working

**Never commit. Ever.** Not without being asked, every time. Saverio controls what goes
into version control and what stays a scratch note. Stage nothing, commit nothing, and
don't create branches or tags unprompted. Leave the working tree and say what changed.

**Say what you're about to do before doing anything that takes over the machine.** Booting
simulators, launching emulators, installing apps — these put windows on screen and are
jarring without warning. One or two sentences of heads-up first: what will launch, what
will appear, how to stop it.

**Never start or stop Metro.** Saverio runs `npm start` himself. An agent-owned Metro holds
port 8081, so his own `npm start` silently moves to 8082 and the simulators keep talking to
the wrong bundler — a confusing failure that looks like stale code. If a dev server is
needed, ask him to start it and wait.

Driving a server he already has running is fine: `curl localhost:8081/reload`, screenshots,
`adb`/`simctl`. Reading his Metro output is not — it goes to his terminal, not a log an
agent can tail, so ask him to paste anything needed. A missing per-platform "Bundled" line
is the tell for a stale bundle; a cache clear (`npm start -- -c`) is his call too.

**Build the app; explain as you go.** Saverio is a seasoned web developer and new to React
Native. He does not want to be blocked writing code or answering questions — but he does
want to understand what's happening. Narrate the interesting parts inline, in the response,
as the work happens. Explanation is part of the deliverable, not a separate document
(unless one is asked for).

**Know the platform.** Don't discover well-documented React Native behaviour by trial and
error and present it as a finding. Established RN behaviour should be applied from the
outset. Spikes are for genuine unknowns — a specific font's metrics, a device-specific
rendering question — not for things the docs already say. Saverio will reasonably lose
confidence if basics are being rediscovered on screen.

**Write for a reader who was never in the conversation.** Applies to every doc and every
code comment.

- **It must stand on its own.** Assume the reader has the repo and nothing else. No
  allusions to the request that prompted the text, to earlier drafts, to files that no
  longer exist, or to "where we landed". *"The one list of what is left"* fails this test:
  it is only meaningful to someone who saw the other lists. *"Outstanding work"* passes.
- **It must be absolutely true.** Describe what *is*, not what changed. "Now", "no longer",
  "instead of", "was moved", "the first attempt" are signs of a changelog posing as
  documentation; history belongs in git. When a past mistake is worth guarding against,
  state the fact that makes it a mistake ("a text background fills the line box, which is
  not centred on the digits"), not the story of making it. The exception is
  `docs/decisions.md`, where a dated reversal is itself the fact being recorded.
- **It must be terse.** The fewest words that are unambiguous. No preamble, no restating
  what the code plainly says, no rhetorical framing, no repeating a reason that lives
  elsewhere — point to it.

**Docs hold decisions and outstanding work.** `docs/decisions.md` records each decision
with its reason; `docs/roadmap.md` lists outstanding work. A finished item is deleted from
the roadmap, and any decision it produced goes to `decisions.md`. A brief, once acted on,
becomes decisions and is deleted.

---

## Design

**Translate design intent into React Native; never transliterate CSS values.**

The `docs/designs/v1` handoff is HTML with inline styles. It is a picture of the intended
result, not a specification of how to achieve it. Its numbers encode _web_ mechanics —
`line-height` below 1 to kill CSS leading, `em` letter-spacing, `overflow: hidden` for
clipping, cascade-dependent inheritance. Copying those numbers into `StyleSheet` produces
a worse result than the design, not a faithful one.

The job is: read what the design is trying to look like, then build that with the idioms
RN actually has. If Flutter were the target this wouldn't be a question — the same applies
here just because RN resembles the web.

**What is authoritative:** the visual result — proportions, hierarchy, colour, weight,
rhythm, the feel of it. Reproduce that.

**What is not:** any individual CSS value, and especially the layout mechanics behind it.

**No hacks in the name of fidelity.** Negative margins to claw back space, magic offsets
tuned by screenshot, per-platform fudge factors — if the implementation looks like a hack
it is the wrong translation. Build it properly, from font metrics and a real type system.
A few pixels of difference from the HTML is fine; a fragile implementation is not.

---

## React Native specifics that shape the design system

These are known platform facts, not things to rediscover:

- **`Text` clips glyphs to its `lineHeight` box.** CSS lets glyphs overflow; RN does not.
  `lineHeight` below the font's content box shears the tops off. It is never correct to
  port a CSS `line-height` ratio below 1.
- **Android's `includeFontPadding` defaults to true** and adds ascent/descent padding that
  iOS doesn't have, so identical `lineHeight` renders differently per platform. Set
  `includeFontPadding: false` for cross-platform metric parity. This is the canonical fix.
- **`letterSpacing` is absolute px, not `em`.** Derive it per role from the font size once,
  in the type system.
- **StyleSheet has no cascade.** `Text` does not inherit `fontFamily` from a parent `View`.
  Typography must be exposed as components per role, not as loose style objects.
- **Weight is selected by loaded family name**, not `fontWeight`. `fontWeight: '900'` on a
  regular family gets a synthesised fake bold on Android.
- **Shadows don't cross platforms.** iOS uses `shadowColor/Opacity/Radius/Offset`; Android
  honours only `elevation`. `shadowColor` must be opaque — no `rgba()`.
- **Spacing comes from container `padding` and flex `gap`**, not from manipulating text
  boxes.
- **Dynamic type scales `lineHeight` and `letterSpacing` along with `fontSize`**, by the
  same multiplier, on both platforms. Measured: a nominal 17/21 role at `fontScale` 1.786
  reports a 37.506px line box, which is 21 × 1.786 exactly. So large text never shears a
  glyph here — the type ratios survive untouched, and what breaks at accessibility sizes
  is *layout*. Anything derived from the type scale (optical padding, cap-box squaring,
  the volume caret) must therefore be read at the scaled size, via `useTypeMetrics`, not
  computed once at module load.
- **iOS leaves a stale layout when the content size category changes while the app is
  foregrounded.** Text redraws at the new size inside boxes measured at the old one, which
  looks exactly like a clipping bug and is not one. Always re-verify dynamic type from a
  fresh launch before believing a layout is broken.
- **Reduce Motion on Android is `Settings.Global.TRANSITION_ANIMATION_SCALE == 0`**, which
  is what `AccessibilityInfo.isReduceMotionEnabled()` reports. The initial read is async on
  both platforms, so the first frame always animates.
- **A prop spread overrides an earlier default even when its value is `undefined`.** A
  component that forwards an optional `accessibilityRole` through `{...rest}` will strip
  the role it was trying to preserve; default such props at the destructure instead.

Nunito's default figures are already tabular (every digit 600/1000 em at every weight), so
`fontVariant: ['tabular-nums']` is a no-op. Never enable `onum` — it would break every
number in the app.

---

## Data

The vendor research documents are the source of truth for anything numeric, and the
design handoff is not — it was written without sight of them, and its recipe numbers,
dose units and gram conversions are wrong. `docs/decisions.md` (under *Data*) tabulates
every divergence.

Where the research documents disagree with each other, **the more recent and more
specific one wins**:

| Vendor | Authority |
|---|---|
| Lotus | `docs/water-schema-v0.md` |
| Apax | `docs/apax-lab-brief.md` + `src/data/sources/apax-lab.json` — the printed Apax card is not a source |

**Never silently correct vendor data.** Where a published value breaks the vendor's own
pattern, ship it as published and record it as an anomaly on the record. A number that is
wrong should be traceably wrong in the same way the vendor's own table is — otherwise the
app and the bottle in the user's hand disagree, and the app is the one nobody can check.

Guard invariants with an **allowlist of known exceptions** rather than a blanket
assertion: that ships the documented oddities untouched while still failing loudly on a
new, undocumented one.
