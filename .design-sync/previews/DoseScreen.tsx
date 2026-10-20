import { LymphaProvider, DoseScreen } from 'lympha';

export const Light = () => (
  <LymphaProvider insets={{ top: 59, bottom: 34 }} style={{ width: 390, height: 844 }}>
    <DoseScreen
      onEditVolume={() => {}}
      onOpenKits={() => {}}
      onChangeRecipe={() => {}}
      onOpenSettings={() => {}}
      onOpenDetails={() => {}}
    />
  </LymphaProvider>
);

export const Dark = () => (
  <LymphaProvider
    scheme="dark"
    insets={{ top: 59, bottom: 34 }}
    style={{ width: 390, height: 844 }}
  >
    <DoseScreen
      onEditVolume={() => {}}
      onOpenKits={() => {}}
      onChangeRecipe={() => {}}
      onOpenSettings={() => {}}
      onOpenDetails={() => {}}
    />
  </LymphaProvider>
);

export const Pouring = () => (
  <LymphaProvider
    scheme="dark"
    insets={{ top: 59, bottom: 34 }}
    state={{ rangeId: 'apax-lab', done: { 'apax-lab-tonik': true, 'apax-lab-jamm': true } }}
    style={{ width: 390, height: 844 }}
  >
    <DoseScreen
      onEditVolume={() => {}}
      onOpenKits={() => {}}
      onChangeRecipe={() => {}}
      onOpenSettings={() => {}}
      onOpenDetails={() => {}}
    />
  </LymphaProvider>
);

export const OverLimit = () => (
  <LymphaProvider
    insets={{ top: 59, bottom: 34 }}
    state={{ volumeMl: 350 }}
    style={{ width: 390, height: 844 }}
  >
    <DoseScreen
      onEditVolume={() => {}}
      onOpenKits={() => {}}
      onChangeRecipe={() => {}}
      onOpenSettings={() => {}}
      onOpenDetails={() => {}}
    />
  </LymphaProvider>
);

export const CannotMake = () => (
  <LymphaProvider
    scheme="dark"
    insets={{ top: 59, bottom: 34 }}
    state={{ volumeMl: 250, recipeIds: { lotus: 'lotus-raos-recipe' } }}
    style={{ width: 390, height: 844 }}
  >
    <DoseScreen
      onEditVolume={() => {}}
      onOpenKits={() => {}}
      onChangeRecipe={() => {}}
      onOpenSettings={() => {}}
      onOpenDetails={() => {}}
    />
  </LymphaProvider>
);
