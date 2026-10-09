# Roadmap

Outstanding work. Finished items are deleted, and any decision they produce goes to
[`decisions.md`](decisions.md).

The app is feature-complete, on TestFlight and on Play internal testing.

---

## Before v1

### Google Play

The listing, App content declarations and store settings are complete; assets are in
[`store/`](store/).

- [ ] **Recruit at least 12 closed testers.** Personal developer accounts created
      after November 2023 need 12 opted-in testers for 14 consecutive days before a
      production release. Internal testers do not count.
- [ ] **Closed test.** Create the closed track, promote the internal build to it,
      send the changes for review, share the opt-in link.
- [ ] **Production**, after the 14 days: apply for production access, then
      promote a build.

### App Store

Version 1.0 (build 2) was submitted for review on 2026-10-09.

- [ ] **Release** once approved. If App Review rejects the `lotus` or `apax`
      keywords, remove them and resubmit; see *Store listing* in
      [`decisions.md`](decisions.md).

---

## After v1

In rough order of likelihood.

- **Brand page.** A full-page brand selector with a fact sheet per brand, grown from
  Settings' Bottles section. Recipe changes far more often than brand, so the recipe
  picker stays the frequent path.
- **Non-zero starting water.** The change most likely to reshape the engine, so
  engine signatures must not assume zero-TDS input. Probably a property of the brew,
  not the recipe.
- **Barista Hustle.** The `prepared` component shape is modelled; the numbers are
  unverified. Once verified, BH and Lotus compare directly in ppm as CaCO₃.
- **R Pavlis.** Another possible non-drop recipe source, alongside Barista Hustle.
- **Third Wave Water.** Sachets are modelled as an indivisible dispenser; a
  dissolved-sachet stock is the `prepared` shape. Weigh a sachet first.
- **Apax limited editions** (TANAT, HYDRANGEA, NEMO AEROPRESS), once it is known how
  they combine with the standard range.
- **Cross-brand comparison** in ppm as CaCO₃. Apax publishes no ion data, so it
  cannot take part.
- **Further features, all additive to the data model:**
  - custom concentrates (at which point Apax's 3–4 g/L range becomes brand data)
  - favourites
  - sharing
  - sync
  - drop calibration (weigh 20 drops) as a user-scoped dispenser
  - cross-brand recipe conversion

### Maintenance

- **Expo SDK 58:** remove `ios.enableSceneSupport` from `app.json`. SDK 58 adopts the
  UIScene lifecycle by default.
- **Wordmark:** its size and tracking (16px, +0.015em) are unrefined. No test
  depends on either.
