import {
  ComparisonTable,
  LymphaProvider,
  View,
  componentMap,
  computeDose,
  formatDoseAmount,
  formatIdealAmount,
  formatPpm,
  getRecipe,
  missSeverity,
  space,
} from 'lympha';

export const InTheWater = () => (
  <View style={{ width: 354 }}>
    <ComparisonTable
      unit="ppm CaCO₃"
      rows={[computeDose(getRecipe('lotus-light-and-bright'), 350, componentMap).profile].flatMap(
        (p) =>
          p
            ? [
                {
                  label: 'Hardness',
                  target: formatPpm(p.target.hardness),
                  delivered: formatPpm(p.delivered.hardness),
                  tone: missSeverity(p.hardnessError, 0.1),
                  gap: p.hardnessError,
                },
                {
                  label: 'Alkalinity',
                  target: formatPpm(p.target.alkalinity),
                  delivered: formatPpm(p.delivered.alkalinity),
                  tone: missSeverity(p.alkalinityError, 0.1),
                  gap: p.alkalinityError,
                },
              ]
            : [],
      )}
    />
  </View>
);

export const PerBottleMissing = () => (
  <View style={{ width: 354 }}>
    <ComparisonTable
      unit="drops"
      rows={computeDose(getRecipe('lotus-raos-recipe'), 250, componentMap).lines.map((line) => ({
        label: line.component.name,
        target: formatIdealAmount(line.exact),
        delivered: formatDoseAmount(line.delivered, line.dispenser.step),
        tone: line.zeroed ? 'error' : null,
        gap: line.exact > 0 ? line.error / line.exact : undefined,
      }))}
    />
  </View>
);

export const PerBottleNoChemistry = () => (
  <View style={{ width: 354 }}>
    <ComparisonTable
      unit="drops"
      rows={computeDose(getRecipe('apax-lab-washed'), 350, componentMap).lines.map((line) => ({
        label: line.component.name,
        target: formatIdealAmount(line.exact),
        delivered: formatDoseAmount(line.delivered, line.dispenser.step),
        tone: missSeverity(line.relativeError, 0.1, line.zeroed),
        gap: line.exact > 0 ? line.error / line.exact : undefined,
      }))}
    />
  </View>
);

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks, width: 382 }}>
    <ComparisonTable
      unit="drops"
      rows={computeDose(getRecipe('lotus-light-and-bright'), 350, componentMap).lines.map(
        (line) => ({
          label: line.component.name,
          target: formatIdealAmount(line.exact),
          delivered: formatDoseAmount(line.delivered, line.dispenser.step),
          tone: line.zeroed ? 'error' : null,
          gap: line.exact > 0 ? line.error / line.exact : undefined,
        }),
      )}
    />
  </LymphaProvider>
);
