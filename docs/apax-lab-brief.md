# Apax Lab — implementation brief

Companion to `apax-lab-recipes.json`. Adds Apax Lab to Lympha alongside the existing Lotus Drops data.

## Schema caveat

This JSON is written to be self-describing, **not** to match the existing Lotus Drops schema — map it across rather than importing as-is. The fields that matter are `brands[].concentrates[]` and `brands[].recipes[].doses`, keyed by concentrate id. Everything else is provenance and can be dropped or relocated.

## Two brands, not a toggle

Apax ships as **two separate brand entries**, not one brand with an optional KONFLUX switch:

- `apax-lab` — current 4-concentrate range, 15 recipes. Default.
- `apax-lab-original` — pre-KONFLUX range, 8 recipes.

The reasoning, in case it gets questioned later:

1. **Martin Wölfl's recipe is identical across both versions and uses zero KONFLUX.** The new range isn't "old recipes plus a splash of the new bottle" — Apax re-balanced the others. A toggle would imply subtractability, which is false, and would hand users a wrong cup.
2. **The row sets differ.** Espresso, milk drinks, both Geishas and the three barista go-tos exist only in the current range. Nothing to fall back to if KONFLUX is unticked.
3. **Light and Dark Roast inverted between versions** (see anomalies). Not expressible as an ingredient toggle.

Surface the split in the UI as a deliberate feature — users on the 3-bottle set have been vocal about the current calculator assuming a bottle they don't own. Copy suggestion: something to the effect of *"Own the original three-bottle set? Use Apax Lab (Original 3-drop) for the recipes as originally published."*

## Units and conversion

- **1.000 g = 15 drops.** `drops = round(g_per_litre * volume_l * 15)`, half-up.
- Base recipes are per **1 L**. Scale linearly by user volume.
- **Validate on grams, not drops.** Doses of 0.5 g (→ 8 drops) and 2.5 g (→ 38 drops) round up, so a valid 4.0 g/L recipe can total 61 or 62 drops. Drop totals are not a meaningful invariant.

## The 4.0 g/L invariant

Every recipe in both ranges totals 4.0 g/L, with two published exceptions. Implement as a **warning-level dev check, not a hard constraint** — it's a useful guard against data-entry slips in future recipes, but it must never auto-correct or reject vendor data.

## Anomalies — all shipped as published

Three, all recorded in `anomalies[]` in the JSON. None are to be silently fixed; if a value is wrong it should be traceably wrong in the same way Apax's own table is.

| Where | What | Decision |
|---|---|---|
| Original / Natural | JAMM 2.6 g/L → 4.1 total. Card says 2.7, pattern suggests 2.5. | Ship 2.6, flag internally |
| Current / Némo Pop | Totals 3.5 g/L. Only exception in current range, plausibly intentional for a personal recipe. | Ship as-is, no user-facing flag |
| Both / Light + Dark Roast | Profiles effectively swapped between versions — legacy Light is JAMM-dominant, current Light has JAMM 0.0; legacy Dark is TONIK-dominant, current Dark has TONIK 0.0. | Transcribe faithfully, no fix |

## Source and attribution

- **Current range:** official Apax Lab calculator, live as of 2026-08-23, unchanged since the Apr 2026 revision.
- **Original range:** official calculator as archived 2025-12-08 via the Wayback Machine, independently corroborated by a third-party calculator carrying identical values.

The **printed card** shipped with the original set is *not* a data source. Where the archived calculator gives 2.5 / 0.5, the card gives 2.7 / 0.3 — an 8:3:1 ratio against the calculator's 5:2:1, same recipe shape and same 4.0 total. The card's values look back-calculated from drops-per-200mL-cup, and it carries no Martin Wölfl row.

Attach this note to the `apax-lab-original` brand in the UI:

> Taken from the latest version of the official Apax Lab calculator. Differs slightly from supplied card.

## Out of scope for v1

Limited editions — TANAT, HYDRANGEA, NEMO AEROPRESS. Their interaction model with the standard range is unconfirmed: additive, standalone, or substitutive. Worth noting that Némo Pop's own published go-to uses only the four standard concentrates, which weakly suggests NEMO AEROPRESS is a self-contained product rather than a fifth ingredient — but that's inference, not established fact. Don't build against it.
