/**
 * The content registry.
 *
 * Data is authored in TypeScript rather than loaded from JSON, so shape is
 * checked by the compiler and there is nothing to validate at runtime. The
 * invariants a type system cannot express — referential integrity, unique ids,
 * Apax's 4.0 g/L envelope, agreement with the vendors' published tables — are
 * enforced by `data.test.ts` at build time instead. A runtime schema validator
 * would earn its place the moment this data becomes JSON, remote, or
 * user-authored; today it would only be ceremony.
 */

import { apaxBrands, apaxComponents, apaxRecipes } from './apax';
import { lotusBrand, lotusComponents, lotusRecipes } from './lotus';
import type { Brand, Component, Recipe, RecipeGroup } from './types';

export * from './types';

export const brands: Brand[] = [lotusBrand, ...apaxBrands];
export const components: Component[] = [...lotusComponents, ...apaxComponents];
export const recipes: Recipe[] = [...lotusRecipes, ...apaxRecipes];

const brandIndex = new Map(brands.map((b) => [b.id, b]));
const componentIndex = new Map(components.map((c) => [c.id, c]));
const recipeIndex = new Map(recipes.map((r) => [r.id, r]));

export const getBrand = (id: string): Brand | undefined => brandIndex.get(id);
export const getComponent = (id: string): Component | undefined => componentIndex.get(id);
export const getRecipe = (id: string): Recipe | undefined => recipeIndex.get(id);

/** All components, keyed by id. Passed to the engine, which never reaches into
 *  the registry itself so it stays testable against fixtures. */
export const componentMap: ReadonlyMap<string, Component> = componentIndex;

export const recipesForBrand = (brandId: string): Recipe[] =>
  recipes.filter((r) => r.brand === brandId);

/** Recipes for a brand, in the vendor's own grouping. Apax's current range has
 *  fifteen, which is too many to read as one flat list. */
export function groupedRecipesForBrand(
  brandId: string,
): { group?: RecipeGroup; recipes: Recipe[] }[] {
  const groups: { group?: RecipeGroup; recipes: Recipe[] }[] = [];
  for (const recipe of recipesForBrand(brandId)) {
    const last = groups[groups.length - 1];
    if (last && last.group === recipe.group) last.recipes.push(recipe);
    else groups.push({ group: recipe.group, recipes: [recipe] });
  }
  return groups;
}

export const componentsForBrand = (brandId: string): Component[] =>
  components.filter((c) => c.brand === brandId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

/** Brands sharing one concentrate-unit preference. */
export const unitGroupOf = (brandId: string): string => getBrand(brandId)?.unitGroup ?? brandId;

/**
 * One entry per unit preference the user can actually set, rather than one per
 * brand — Apax's two ranges are the same jars and share a setting.
 */
export function unitGroups(): { id: string; label: string; brandIds: string[] }[] {
  const groups = new Map<string, { id: string; label: string; brandIds: string[] }>();
  for (const brand of brands) {
    const id = unitGroupOf(brand.id);
    const existing = groups.get(id);
    if (existing) existing.brandIds.push(brand.id);
    // The first brand in a group names it: the base range, so "Apax Lab" rather
    // than "Apax Lab with KONFLUX".
    else groups.set(id, { id, label: brand.name, brandIds: [brand.id] });
  }
  return [...groups.values()];
}

/** The dispenser a component uses unless the user has chosen otherwise. */
export function defaultDispenser(component: Component) {
  return component.dispensers.find((d) => d.isDefault) ?? component.dispensers[0];
}
