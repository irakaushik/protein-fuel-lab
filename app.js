export function calculateProteinGoal({ weightKg, goalType, activityLevel }) {
  const multipliers = {
    lose: 1.8,
    maintain: 2.0,
    gain: 2.2,
  };
  const activityBonus = {
    light: 0,
    active: 0,
    intense: 0.2,
  };
  const multiplier = (multipliers[goalType] ?? 2.0) + (activityBonus[activityLevel] ?? 0);
  const target = Math.round(weightKg * multiplier);
  const lower = Math.round(weightKg * (multiplier - 0.2 || 1.8));
  const upper = Math.round(weightKg * (multiplier + 0.2));

  return {
    target,
    rangeLabel: `${lower}-${upper}g protein/day`,
  };
}

export function buildSeedMeals() {
  return [
    {
      name: "Paneer Power Bowl",
      protein: 42,
      calories: 460,
      carbs: 28,
      fats: 18,
      source: "manual",
    },
    {
      name: "Greek Yogurt Crunch",
      protein: 32,
      calories: 330,
      carbs: 24,
      fats: 9,
      source: "manual",
    },
    {
      name: "Chicken Curry Rice",
      protein: 38,
      calories: 540,
      carbs: 46,
      fats: 19,
      source: "scan",
    },
  ];
}

export function summarizeDay({ proteinGoal, calorieGoal, meals }) {
  const consumedProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const consumedCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

  return {
    consumedProtein,
    consumedCalories,
    remainingProtein: Math.max(proteinGoal - consumedProtein, 0),
    remainingCalories: Math.max(calorieGoal - consumedCalories, 0),
  };
}

export function suggestNextAction(remainingProtein) {
  return `${remainingProtein}g left today. A whey shake or paneer wrap gets you there.`;
}
