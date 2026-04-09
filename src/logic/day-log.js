export function formatDayKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function filterMealsByDay(meals, dayKey, now = new Date()) {
  const todayKey = formatDayKey(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterdayKey = formatDayKey(yesterdayDate);
  const resolvedDayKey = dayKey === "today" ? todayKey : dayKey === "yesterday" ? yesterdayKey : dayKey;

  return meals.filter((meal) => formatDayKey(new Date(meal.timestamp)) === resolvedDayKey);
}

export function summarizeDay({ proteinGoal, calorieGoal, meals }) {
  const consumedProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const consumedCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const progressPercent = proteinGoal > 0
    ? Math.min(100, Math.round((consumedProtein / proteinGoal) * 100))
    : 0;
  const remainingCalories = calorieGoal == null
    ? null
    : Math.max(calorieGoal - consumedCalories, 0);

  return {
    consumedProtein,
    consumedCalories,
    remainingProtein: Math.max(proteinGoal - consumedProtein, 0),
    remainingCalories,
    calorieStatus: remainingCalories == null ? "Set calorie target" : `${remainingCalories} kcal remaining`,
    progressPercent,
  };
}
