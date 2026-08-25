# Before v1 rolls out

Everything that stands between the current TestFlight build and something worth
handing to people who did not help build it. Grouped by kind, not by priority —
priority is Saverio's call.

Verified on device 2026-08-25: haptics land and read as pleasant rather than
noisy, the screen transitions do the job of tying the screens together, and cold
start is effectively instant.

---

## Bugs

- [ ] **The volume numeral is clipped on its right edge.** Volume edit screen,
      visible on an iPhone and reproducible in the simulator, missed until it was
      seen on hardware. Android unverified — the emulator is currently a Pixel 3a,
      where it is too small to judge.

      Likely cause, to be confirmed rather than assumed: the `hero` role carries
      `trackingEm: -0.04`, which at 72px is **-2.88px of letter-spacing**. React
      Native applies tracking after *every* character including the last, so the
      text box measures ~3px narrower than the ink it contains and the final
      glyph loses its right edge. If that is it, the fix belongs in the type
      system as a tracking-derived right inset, not as a padding fudge on one
      screen — every negatively-tracked role has the same latent problem, and the
      display roles carry the most tracking.
- [ ] **Volume entry is awkward to correct.** Reported independently by two people
      on the first Android build. The field starts with a fully filled number, and
      the caret sits to its right. This suggests the user has to first delete the
      current characters, then type the new value. This is not actually what
      happens. What happens is on the first keystroke the new character replaces
      the current selection but appends afterwards. This is likely the right UX
      pattern to use, but the visual cues are misleading.

---

## Design

- [ ] **A completed dose row fades away rather than receding.** Its surface drops
      to the page background, which is so close to the card colour that the row
      reads as disappearing instead of as done-and-still-there. The list is meant
      to keep its shape so you can see what you already poured. Needs a distinct
      treatment — the recession is right, the value chosen for it is not.
- [ ] **Remove the border on Sodium's colour bar.** Sodium is the one component
      with `edgeOnLight` set (`#DFC0C3` inside `#F0DADC`), added because the
      published label colour is too pale to hold an edge against a white card.
      Saverio does not want the border. The accessible replacement is to darken
      the bar itself rather than outline it — but the bar colour is vendor data,
      so darkening is a *display* transform and must be recorded as one, not
      edited into `lotus.ts`. Everything else in the app has a flush, unbordered
      bar; this should match.
- [ ] **Settings button placement** — deferred; being reworked with Claude Design.
- [ ] **KONFLUX has no published label colour.** It post-dates the design handoff
      and currently takes the documented fallback of neutral slate. Needs a real
      value.

---

## Copy

- [ ] **A full copywriting round.** Every string, read as a set rather than one at
      a time.
- [ ] **Drop "millilitres" beneath the volume presets.** The screen is titled
      Water, the value is followed by `ml`, and the presets are plainly volumes.
      The caption says nothing the screen has not already said.
- [ ] **Drop "Adding your own concentrates is not in this version."** from the
      bottom of Settings. It answers a question nobody asked and dates the build.

---

## Release

- [ ] **App icon.** Still Expo's default blue "A" on both platforms.
- [ ] **Splash: deliberately leave it alone.** Cold start is effectively instant,
      and Saverio's judgement on device is that a designed splash would be *more*
      jarring than none. Recorded as a decision so it is not mistaken for an
      oversight later. The native splash is still held until fonts and stored
      state are ready, which is what keeps the app from flashing a wrong volume.

---

## Explicitly not v1

- **A brand selector as its own screen, with a fact sheet per brand.** The
  "Bottles" section in Settings is a useful short description of what each brand
  is, and the idea is worth expanding into a real page — but the bottom of
  Settings is the wrong home for it.
  The UX rationale is that **recipe changes far more often than brand**. So the
  recipe picker stays as the frequent path, and brand selection grows into a
  separate full-page thing that can afford to explain itself. Too large for v1;
  1.1 or later.
- **Non-zero starting water.** Parked in the schema and out of v1, but the most
  likely thing to change the engine's shape later. Engine signatures should not
  assume zero TDS input.
