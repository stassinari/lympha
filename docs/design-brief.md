# Design brief — coffee water app

Self-contained. Assumes no prior conversation.
Companion document: `water-schema-v0.md` (data model, verified vendor data). Not
required reading to design, but it's where every number below comes from.

---

## What this is

Specialty coffee people don't brew with tap water. They start with zero-TDS water and
add mineral concentrates — sold as dropper bottles or sachets — to hit a target profile.
Every brand publishes its own web calculator to work out the dose. All of them are
marketing pages: sliders, scatter plots, Shopify themes, no offline support.

One good native app exists (Blossom Rain, iOS). It handles exactly one brand.

This app is the brand-agnostic version. Pick your concentrate, pick a recipe, say how
much water you have, get the dose.

**Provisional title:** Lympha.

## The user, and the moment

One person, standing at a kitchen counter, at 6am, before coffee. Possibly in the dark.
Holding a bottle in one hand and a phone in the other.

They are technically minded and own a scale and a TDS meter. They are not, at this
moment, interested in chemistry. They want four numbers and they want to stop looking
at the screen.

**Mode: operate.** This is a task surface. Nothing here persuades, teaches, or
onboards. Success is measured in seconds-to-answer and in not having to think.

## Non-negotiables

- **Mobile only.** iOS and Android. Tablet doesn't matter. No desktop.
- **Offline.** No network at all in v1.
- **No accounts, no login, no sync.**
- **Opens to the answer.** Remembers the last brand, recipe and volume. Reopening the
  app the next morning should require near-zero input to repeat yesterday's brew.
- **Large targets, high contrast, dark-first.** Wet hands, low light, bad eyes.

## Core flow

```
[brand/concentrate] -> [recipe] -> [volume] -> [dose]
```

Four steps, and the first two are usually unchanged from last time. The design question
is how much of this collapses onto one screen.

Volume entry is the highest-frequency interaction and deserves the most attention —
likely presets (250 / 350 / 500 / 1000 ml) plus a way to type an arbitrary number.

## The hard parts

These are the real design problems. Everything else is a list and a number.

### 1. Multi-dose output, executed one at a time

A dose is not one number. Lotus recipes use four separate bottles; Apax uses three or
four. The user physically works through them in sequence, squeezing drops and counting.

Real example — Lotus "Simple and Sweet" at 1 litre:

```
Magnesium   4 drops
Calcium     7 drops
Sodium      6 drops
Potassium   4 drops
```

Losing your place halfway through is the actual failure mode. Whether that argues for
a checklist, a stepper, one-bottle-at-a-time, or just very clear typography is open.

### 2. Honest rounding — the main differentiator

Drops are integers. Doses aren't. Every vendor calculator silently rounds and reports
the ideal figure anyway.

Verified from Lotus's own calculator: their "Ultra Light" recipe at 1 litre is short by
**19.6% on alkalinity** after rounding, and the tool still displays the target value.

This app shows the truth: what you asked for, what you'll actually get, and the gap.
The design challenge is doing that **without creating anxiety at 6am**. It has to read
as quiet confidence, not as an error state. Most of the time the number is fine and
should be nearly invisible; occasionally it's 20% off and should be noticed.

### 3. Volumes where a recipe breaks

Some recipes can't be made at some volumes. Lotus's "Rao's Recipe" at 250 ml rounds
potassium to **zero drops** — a mineral vanishes from the recipe entirely.

The app should catch this and offer the fix, which is almost always "use a slightly
different volume". Something like: *at 300 ml this lands exactly.* A helpful nudge, not
a blocking error.

Related: sachet products (Third Wave Water) are dosed per US gallon and don't divide.
Asking for 500 ml has no valid answer. The app must decline gracefully rather than
print a fake number like "0.13 sachets".

### 4. Units change with scale

Not cosmetic — the same product needs different units at different volumes.

- Lotus at 1 litre: 4–7 drops per bottle. Drops are perfect.
- Apax at 1 litre: **~60 drops total.** Drops are useless; grams are the sane unit.
- Apax at 200 ml: ~12 drops. Drops are fine again.

So the display unit is chosen by magnitude, not by user preference — with an override
available. Needs to feel automatic rather than fiddly.

### 5. Brand switching without clutter

Two brands at launch (Lotus, Apax), more later, each with its own recipe list and its
own vocabulary. Lotus names recipes after flavour outcomes ("Light and Bright", "Bright
and Juicy"); Apax names them after the coffee ("Washed processed", "Natural processed").

Most users own one brand and switch rarely. Brand selection should be nearly invisible
in daily use but not buried.

## The open question — two directions wanted

Please propose **two distinct visual directions**, not variations on one:

**A — Platform-native.** Defers to iOS and Android conventions. Looks like it belongs
on the phone. Fast to learn, invisible, no personality to get in the way of the task.

**B — Distinctive.** Its own visual identity. A specialist tool with a point of view,
the way good coffee gear looks like coffee gear.

Genuinely undecided. Argue for whichever is stronger; a clear recommendation is more
useful than neutrality.

## Anti-references

- Vendor calculator aesthetics: range sliders, scatter plots, ppm charts, marketing copy
- Dashboards. There is no data to explore here, only a dose to execute
- Onboarding carousels, tooltips, feature tours
- Laboratory/chemistry styling that makes the user feel they need to understand it
- Anything that requires reading a paragraph before acting

## Deliberately out of scope for v1

Favourites, custom concentrates, sharing, accounts, base-water profiles, drop
calibration, cross-brand recipe conversion. All planned, none designed now.

## Technical context

Likely React Native (Expo), so designs should assume standard mobile primitives and
platform behaviour — native scroll physics, keyboard, text selection — underneath
whatever visual layer is chosen. Not final, and shouldn't constrain direction B.
