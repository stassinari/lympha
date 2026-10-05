# Water recipe data model

A data model that fits Apax, Lotus, Barista Hustle and a powder without per-brand code,
and the verified Lotus numbers.

Lotus is specified from primary sources. Apax numbers are in
[`apax-lab-brief.md`](apax-lab-brief.md) and `src/data/sources/apax-lab.json`. Barista
Hustle and Third Wave Water are shapes only; their numbers are unverified.

---

## The one structural decision

Vendors specify recipes in two incompatible ways:

- **Dose-first** (Apax): "2.0 g/L TONIK". The dose *is* the recipe; ppm is a side effect.
- **Target-first** (Lotus): "50 ppm Mg". The target is the recipe; drops are computed.

A schema that picks one breaks on the other. The fix is to separate three things
vendor calculators smash together:

1. **What the recipe means** — a target profile, if stated (optional)
2. **What you add** — component + amount at a reference volume (required)
3. **How you measure it** — the dispenser, including its quantisation

Layer 3 is a display concern and never lives inside a recipe. That split is what
makes Apax and Lotus the same object.

---

## Entities

### Brand

```json
{
  "id": "lotus",
  "name": "Lotus Coffee Products",
  "source": {
    "url": "https://lotuscoffeeproducts.com/pages/product-instructions",
    "verified_on": "2026-08-22",
    "confidence": "high",
    "notes": "Derived from the calculator's page script and confirmed against four manual readings."
  }
}
```

`confidence`: `high` (primary source, recent), `medium` (third party or old),
`low` (inferred). The UI can treat `low` differently.

### Component

```json
{
  "id": "lotus-magnesium",
  "brand": "lotus",
  "name": "Magnesium",
  "type": "product",
  "dose_unit": "drop",
  "dispensers": [
    {
      "id": "lotus-round",
      "label": "Round dropper",
      "unit": "drop",
      "step": 1,
      "allow_partial": false,
      "default": true
    }
  ],
  "ions_per_dose_unit_per_litre": {
    "as_caco3": { "hardness": 8.04 },
    "mg_per_l": { "Mg": 1.953, "Cl": 5.698 }
  }
}
```

**`dose_unit`** is the vendor's natural unit — `g` for Apax, `drop` for Lotus,
`sachet` for a powder, `ml` for a prepared stock. No universal canonical: we can't
honestly convert Lotus drops to grams without data nobody publishes.

**`dispensers[]`** carries both drop variance and **quantisation**. A dropper is
`step: 1, allow_partial: false`. A scale is `step: 0.01, allow_partial: true`.
A sachet is `step: 1, allow_partial: false` — the same shape as a dropper, not a
special case. User calibration (weigh 20 drops ÷ 20) writes a user-scoped dispenser
that overrides the default.

Only Lotus's Round dropper is modelled. Straight was the original and hasn't been
sold in years; it's a second array entry whenever someone asks.

**`ions_per_dose_unit_per_litre`** is the v2 hook. Optional — Lotus supports it fully,
Apax publishes nothing comparable. Absence means no cross-brand comparison for that
component, not a broken record.

### Recipe

```json
{
  "id": "apax-washed",
  "brand": "apax-lab",
  "name": "Washed",
  "reference_volume_ml": 1000,
  "stated_as": "dose",
  "additions": [
    { "component": "apax-tonik",   "amount": 2.0 },
    { "component": "apax-jamm",    "amount": 0.5 },
    { "component": "apax-lylac",   "amount": 0.5 },
    { "component": "apax-konflux", "amount": 1.0 }
  ],
  "scaling": "linear"
}
```

Amounts are always in the component's `dose_unit`, so there's no per-addition unit
field and no class of mismatch bug.

`stated_as` is `dose` or `target` — it documents which way the vendor thinks, which
matters when the numbers need re-checking.

**No per-recipe constraints.** Apax's 3–4 g/L envelope is a build-time test on
authored recipes, not shipped data. The underlying fact — *Apax concentrates are intended at 3–4 g/L
combined* — is a property of the **brand**, and only becomes load-bearing once users
build custom recipes. Add it to Brand then, as `intended_dose_range`.

---

## The four cases

### 1. Apax — dose-first, capped total

Recipes are ratios inside a 4.0 g/L envelope, with two documented exceptions. One
dispenser: 15 drops to the gram, from Apax's own table. Recipes, sources and anomalies
are in [`apax-lab-brief.md`](apax-lab-brief.md).

No ion data. Apax publishes ingredient lists but not quantities, so Apax cannot
participate in cross-brand comparison. Known limitation, not a gap to fill.

### 2. Lotus — target-first, fully solved

Read from the calculator's page script, then confirmed against four manual readings
(50 ppm, 1000 mL, round) which reproduced to the digit.

**The model:** everything is **ppm as CaCO₃**. Divalent ions (Mg²⁺, Ca²⁺) map 1:1;
monovalent ions (Na⁺, K⁺, HCO₃⁻, Cl⁻) take a factor of 2. Chloride derives only from
the Mg/Ca inputs and bicarbonate only from Na/K, so:

- **Magnesium, Calcium** — chlorides. Hardness donors.
- **Sodium, Potassium** — bicarbonates. Alkalinity donors.

Which makes Lotus structurally identical to Barista Hustle: a hardness source and a
buffer source, pre-dissolved and split four ways.

**Their formula:**

```
drops = ppm_caco3 x (volume_ml / 4500) x dropper_factor x (2 if monovalent else 1)
dropper_factor: round 0.56, straight 1.0
```

The 4500 mL base is an arbitrary hidden constant. A round drop is ~1.79x a straight one.

**Per round drop per litre:**

| Bottle | ppm CaCO₃ | Ions (mg/L) |
| --- | --- | --- |
| Magnesium | 8.04 hardness | Mg 1.953, Cl 5.698 |
| Calcium | 8.04 hardness | Ca 3.221, Cl 5.698 |
| Sodium | 4.02 alkalinity | Na 1.847, HCO₃ 4.903 |
| Potassium | 4.02 alkalinity | K 3.142, HCO₃ 4.903 |

**Named recipes**, lifted from the `data-ppm*` attributes on the page's `<option>`
elements. All values are ppm as CaCO₃.

| Recipe | Mg | Ca | Na | K | GH | KA | Author |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Light and Bright | 0 | 60 | 0 | 25 | 60 | 25 | Lance Hedrick |
| Simple and Sweet | 30 | 60 | 25 | 15 | 90 | 40 | Lance Hedrick |
| Light and Bright (espresso) | 20 | 0 | 0 | 45 | 20 | 45 | Lance Hedrick |
| Simple and Sweet (espresso) | 20 | 0 | 55 | 0 | 20 | 55 | Lance Hedrick |
| Bright and Juicy | 36 | 36 | 9 | 9 | 72 | 18 | Mike Bawden |
| Rao's Recipe | 32.1 | 40.2 | 12.1 | 8 | 72.3 | 20.1 | Scott Rao |
| Ultra Light | 15 | 20 | 0 | 10 | 35 | 10 | Lotus |

Two ingest rules:

- **Exclude `Custom Recipe`.** It's a UI sentinel with all-zero attributes, not a recipe.
  Ingested naively it becomes a selectable option that produces plain water.
- **Store attribution, not description.** The `data-description` fields are Lotus's
  marketing copy. Keep the author name and link to the source page.

**Quantisation at 1 litre** (round dropper), which is the case for the error display:

| Recipe | Drops Mg/Ca/Na/K | GH error | KA error |
| --- | --- | --- | --- |
| Light and Bright | 0 / 7 / 0 / 6 | −6.3% | −3.6% |
| Simple and Sweet | 4 / 7 / 6 / 4 | −1.8% | +0.4% |
| Light and Bright (esp) | 2 / 0 / 0 / 11 | −19.6% | −1.8% |
| Simple and Sweet (esp) | 2 / 0 / 14 / 0 | −19.6% | +2.3% |
| Bright and Juicy | 4 / 4 / 2 / 2 | −10.7% | −10.7% |
| Rao's Recipe | 4 / 5 / 3 / 2 | +0.0% | −0.1% |
| Ultra Light | 2 / 2 / 0 / 2 | −8.2% | −19.6% |

Rao's odd decimals (32.1, 40.2, 12.1) are clearly reverse-engineered to land on whole
drops at exactly 1 L — it's the only recipe that comes out clean. Everything else
carries an error the vendor never surfaces, up to ~20%.

Below a litre it degrades badly. Rao's at 250 mL rounds potassium to **zero drops**,
silently dropping a mineral from the recipe. This is the strongest argument for the
"try 300 mL instead and it lands exactly" suggestion — at cup scale the recipes are
not really reproducible at all.

### 3. Barista Hustle — two-stage

A prepared component. Recursion depth 1 is enough; nobody makes a stock from a stock.

```json
{
  "id": "bh-hardness-stock",
  "type": "prepared",
  "dose_unit": "ml",
  "preparation": {
    "ingredients": [{ "name": "Epsom salt (MgSO4.7H2O)", "amount": null, "unit": "g" }],
    "solvent": "distilled water",
    "yield_ml": 1000
  },
  "status": "unverified",
  "todo": "Numbers not checked against baristahustle.com. Do not ship."
}
```

The recipe referencing it is an ordinary recipe; the two stages are contained in the
component.

Note this is the same hardness+buffer system Lotus sells pre-mixed, so once the
numbers are in, BH and Lotus should be directly comparable in CaCO₃ terms.

### 4. Third Wave Water — fixed pairing

```json
{
  "id": "tww-classic-recipe",
  "reference_volume_ml": 3785,
  "additions": [{ "component": "tww-classic-sachet", "amount": 1 }],
  "scaling": "linear"
}
```

The recipe is ordinary. The sachet's indivisibility lives on its
dispenser (`step: 1, allow_partial: false`), same as a dropper. Scaling to 500 mL
yields 0.13 sachets, which the runtime must refuse to print as an instruction.

**Future: a TWW stock.** Dissolve a sachet into a bottle and dose from that — exactly
the `prepared` shape above, so the model already supports it. Physical caveat: a
sachet is dosed for a US gallon, so in 500 mL you'd pour ~130 mL per litre of brew
water, no better than the jug. Drop-scale would need dissolution into a few mL, which
those salts probably won't hold. A small bottle drawn with a syringe is the realistic
version. Weigh a sachet before designing this.

---

## Runtime

```
target_volume_ml
  -> scale each addition by (target / reference)
  -> convert dose_unit to display unit via dispenser
  -> quantise per the dispenser's step / allow_partial
  -> report ideal vs delivered, and the error
```

The last step is the differentiator, and Lotus proves the need. 50 ppm Mg at 1 L is
6.22 drops; their calculator rounds to 6 and the ion panel still reports the ideal
50 ppm. You actually get 48.2 — a 3.6% error the tool knows about and hides.

Error grows as volume shrinks and is unavoidable at cup scale. Surfacing it honestly
is free arithmetic and nothing else on the market does it. The fix the app can offer
is "brew a slightly different volume and it lands exactly".

---

## Open questions and deferred work

Barista Hustle numbers, non-zero starting water, cross-brand comparison and everything
deliberately not built yet are tracked in [`roadmap.md`](roadmap.md).
