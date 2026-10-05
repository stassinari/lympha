# Design handoff, v1

The design bundle from Claude Design: a **picture** of the intended look and feel,
not a specification. Open either `.dc.html` in a browser.

| File | What it is |
|---|---|
| `Lympha.dc.html` | Every design turn, newest first. Turn 9 is Android, turn 8 Settings and the unit override, turn 7 the v1 iOS screens, turn 6 volume, rounding and nudge, and turn 5 the colour-bar exploration. Earlier turns are rejected directions. |
| `Lympha Prototype.dc.html` | An interactive prototype, the reference for motion and behaviour. |
| `ios-frame.jsx`, `android-frame.jsx`, `support.js` | Presentation scaffolding the HTML needs to render. Never port these. |

- **Its numbers are wrong.** It predates the vendor research, so its recipes, dose
  units and gram conversion are invented.
- **Its CSS values are web mechanics, not design intent.** `AGENTS.md` covers the
  translation.
- **The app is the current design.** Where the two differ, the reason is in
  [`../../decisions.md`](../../decisions.md).
