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
simulators, launching emulators, installing apps, starting long-running servers — these
put windows on screen and are jarring without warning. One or two sentences of heads-up
first: what will launch, what will appear, how to stop it.

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

Nunito's default figures are already tabular (every digit 600/1000 em at every weight), so
`fontVariant: ['tabular-nums']` is a no-op. Never enable `onum` — it would break every
number in the app.

---

## Data

The vendor research documents are the source of truth for anything numeric, and the
design handoff is not — it was written without sight of them, and its recipe numbers,
dose units and gram conversions are wrong. `docs/plan-v1.md` tabulates every divergence.

Where the research documents disagree with each other, **the more recent and more
specific one wins**:

| Vendor | Authority |
|---|---|
| Lotus | `docs/water-schema-v0.md` |
| Apax | `docs/apax-lab-brief.md` + `docs/apax-lab-recipes.json` — these **supersede** the Apax section of `water-schema-v0.md`, which was taken from the printed card that the brief rules out as a data source |

**Never silently correct vendor data.** Where a published value breaks the vendor's own
pattern, ship it as published and record it as an anomaly on the record. A number that is
wrong should be traceably wrong in the same way the vendor's own table is — otherwise the
app and the bottle in the user's hand disagree, and the app is the one nobody can check.

Guard invariants with an **allowlist of known exceptions** rather than a blanket
assertion: that ships the documented oddities untouched while still failing loudly on a
new, undocumented one.
