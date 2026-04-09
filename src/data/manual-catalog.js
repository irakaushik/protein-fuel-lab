export const manualSections = [
  {
    id: "frequent-indian",
    title: "Frequent Indian meals",
    items: [
      {
        id: "paneer-power-bowl",
        name: "Paneer Power Bowl",
        subtitle: "Paneer, quinoa, greens, mint yogurt",
        servingLabel: "1 bowl",
        source: "anuvaad",
        protein: 42,
        calories: 460,
        carbs: 28,
        fats: 18,
      },
      {
        id: "paneer-bhurji-roll",
        name: "Paneer Bhurji Roll",
        subtitle: "Paneer bhurji, whole-wheat wrap, onions",
        servingLabel: "1 roll",
        source: "anuvaad",
        protein: 24,
        calories: 340,
        carbs: 29,
        fats: 14,
      },
      {
        id: "rajma-rice-bowl",
        name: "Rajma Rice Bowl",
        subtitle: "Rajma, rice, onions, coriander",
        servingLabel: "1 bowl",
        source: "anuvaad",
        protein: 19,
        calories: 390,
        carbs: 58,
        fats: 8,
      },
      {
        id: "dal-chilla-stack",
        name: "Dal Chilla Stack",
        subtitle: "Moong dal chilla, hung curd, greens",
        servingLabel: "2 chilla",
        source: "anuvaad",
        protein: 28,
        calories: 370,
        carbs: 29,
        fats: 11,
      },
    ],
  },
  {
    id: "frequent-global",
    title: "Frequent global meals",
    items: [
      {
        id: "grilled-chicken-sandwich",
        name: "Grilled Chicken Sandwich",
        subtitle: "Chicken breast, sourdough, slaw",
        servingLabel: "1 sandwich",
        source: "usda",
        protein: 36,
        calories: 420,
        carbs: 31,
        fats: 14,
      },
      {
        id: "greek-yogurt-crunch",
        name: "Greek Yogurt Crunch",
        subtitle: "Greek yogurt, berries, granola, seeds",
        servingLabel: "1 bowl",
        source: "usda",
        protein: 32,
        calories: 330,
        carbs: 24,
        fats: 9,
      },
      {
        id: "tofu-salad-bowl",
        name: "Tofu Salad Bowl",
        subtitle: "Tofu, lettuce, cucumber, sesame dressing",
        servingLabel: "1 bowl",
        source: "usda",
        protein: 22,
        calories: 290,
        carbs: 18,
        fats: 13,
      },
      {
        id: "egg-wrap",
        name: "Egg Wrap",
        subtitle: "Eggs, tortilla, spinach, chilli sauce",
        servingLabel: "1 wrap",
        source: "usda",
        protein: 21,
        calories: 280,
        carbs: 20,
        fats: 12,
      },
    ],
  },
  {
    id: "quick-protein",
    title: "Quick protein",
    items: [
      {
        id: "whey-isolate-shot",
        name: "Whey Isolate Shot",
        subtitle: "Fastest 25g top-up in the day",
        servingLabel: "1 shake",
        source: "usda",
        protein: 25,
        calories: 130,
        carbs: 4,
        fats: 1,
      },
      {
        id: "double-egg-bhurji-cup",
        name: "Double Egg Bhurji Cup",
        subtitle: "Scrambled eggs, onions, chilli, coriander",
        servingLabel: "1 cup",
        source: "anuvaad",
        protein: 18,
        calories: 220,
        carbs: 6,
        fats: 14,
      },
    ],
  },
];

export const manualCatalog = manualSections.flatMap((section) => section.items);

export function findManualMeal(mealId) {
  return manualCatalog.find((meal) => meal.id === mealId) ?? manualCatalog[0];
}

export function searchManualMeals(query) {
  const normalizedQuery = query.trim().toLowerCase();

  return manualSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => (
        !normalizedQuery
        || item.name.toLowerCase().includes(normalizedQuery)
        || item.subtitle.toLowerCase().includes(normalizedQuery)
      )),
    }))
    .filter((section) => section.items.length > 0);
}
