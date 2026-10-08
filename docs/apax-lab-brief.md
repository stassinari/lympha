# Apax Lab — data notes

Provenance for `src/data/sources/apax-lab.json`, the Apax numbers the app bundles.
The decisions that follow from it are in [`decisions.md`](decisions.md).

The JSON is self-describing, not in the app's schema; `src/data/apax.ts` maps it. The
fields that matter are `brands[].concentrates[]` and `brands[].recipes[].doses`; the
rest is provenance.

## Ranges

- `apax-lab-original`: the three-bottle range (TONIK, JAMM, LYLAC), 8 recipes.
  Default.
- `apax-lab`: the four-bottle range with KONFLUX, 15 recipes.

The IDs keep the research's names; *Data* in [`decisions.md`](decisions.md) says why.

## Units and conversion

- **1.000 g = 15 drops.** `drops = round(g_per_litre * volume_l * 15)`, half-up.
- Base recipes are per **1 L** and scale linearly.
- **Validate on grams, not drops.** Doses of 0.5 g (8 drops) and 2.5 g (38 drops)
  round up, so a valid 4.0 g/L recipe can total 61 or 62 drops. Drop totals are not
  an invariant.

## The 4.0 g/L invariant

Every recipe in both ranges totals 4.0 g/L, except two published ones. The check
catches data-entry slips; it never corrects or rejects vendor data.

## Anomalies, all shipped as published

All are recorded in `anomalies[]` in the JSON.

| Where | What | Handling |
|---|---|---|
| Three-bottle / Natural | JAMM 2.6 g/L gives a 4.1 g/L total. The card says 2.7; the pattern suggests 2.5. | Ship 2.6, flagged internally |
| KONFLUX / Némo Pop | Totals 3.5 g/L, the only exception in the KONFLUX range. Plausibly intentional for a personal recipe. | Ship as-is, with no user-facing flag |
| Both / Light and Dark Roast | Profiles effectively swapped between ranges. The three-bottle Light is JAMM-dominant and the KONFLUX Light has no JAMM; the three-bottle Dark is TONIK-dominant and the KONFLUX Dark has no TONIK. | Transcribed faithfully |

## Sources

- **KONFLUX range:** the official Apax Lab calculator, live as of 2026-08-23 and
  unchanged since the April 2026 revision.
- **Three-bottle range:** the official calculator as archived on 2025-12-08 by the
  Wayback Machine. A third-party calculator carrying identical values corroborates
  it.

The **printed card** that shipped with the three-bottle set is *not* a data source. Where
the archived calculator gives 2.5 / 0.5, the card gives 2.7 / 0.3: an 8:3:1 ratio
against the calculator's 5:2:1, with the same recipe shape and the same 4.0 total.
The card's values look back-calculated from drops per 200 ml cup, and it has no
Martin Wölfl row.

## Limited editions

TANAT, HYDRANGEA and NEMO AEROPRESS are not modelled. It is unconfirmed whether they
add to the standard range, stand alone, or substitute for part of it. Némo Pop's own
published recipe uses only the four standard concentrates. That weakly suggests NEMO
AEROPRESS is a self-contained product, but this is inference, not fact.
