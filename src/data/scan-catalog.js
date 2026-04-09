function sumMacros(items) {
  return items.reduce(
    (sum, item) => ({
      protein: sum.protein + item.protein,
      calories: sum.calories + item.calories,
      carbs: sum.carbs + item.carbs,
      fats: sum.fats + item.fats,
    }),
    { protein: 0, calories: 0, carbs: 0, fats: 0 },
  );
}

export const scanPresets = [
  {
    id: "power-thali",
    title: "Power Thali Scan",
    confidence: "High confidence",
    caption: "Paneer tikka, dal, and jeera rice",
    items: [
      { name: "Paneer tikka", protein: 24, calories: 290, carbs: 8, fats: 16 },
      { name: "Dal", protein: 12, calories: 180, carbs: 20, fats: 6 },
      { name: "Jeera rice", protein: 10, calories: 230, carbs: 42, fats: 3 },
    ],
  },
  {
    id: "chicken-rice",
    title: "Chicken Curry Rice",
    confidence: "Medium confidence",
    caption: "Chicken curry and rice bowl",
    items: [
      { name: "Chicken curry", protein: 26, calories: 310, carbs: 10, fats: 18 },
      { name: "Rice", protein: 12, calories: 230, carbs: 36, fats: 1 },
    ],
  },
  {
    id: "brunch",
    title: "Gym Brunch Scan",
    confidence: "Medium confidence",
    caption: "Eggs, toast, yogurt, fruit",
    items: [
      { name: "Masala omelette", protein: 18, calories: 220, carbs: 6, fats: 14 },
      { name: "Sourdough toast", protein: 7, calories: 170, carbs: 29, fats: 3 },
      { name: "Greek yogurt", protein: 15, calories: 140, carbs: 10, fats: 4 },
    ],
  },
];

const scanPresetMap = Object.fromEntries(scanPresets.map((preset) => [preset.id, preset]));

export const scanPresetIds = scanPresets.map((preset) => preset.id);

export function createScanDraft(presetId) {
  const preset = scanPresetMap[presetId] ?? scanPresetMap["power-thali"];
  const items = preset.items.map((item) => ({ ...item }));

  return {
    id: preset.id,
    title: preset.title,
    caption: preset.caption,
    confidence: preset.confidence,
    disclaimer: "Estimates may vary",
    items,
    totals: sumMacros(items),
  };
}
