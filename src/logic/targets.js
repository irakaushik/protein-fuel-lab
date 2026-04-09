const ACTIVITY_FACTORS = {
  light: 1.375,
  active: 1.55,
  intense: 1.725,
};

const GOAL_ADJUSTMENTS = {
  lose: -350,
  maintain: 0,
  gain: 250,
};

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
  const lower = Math.round(weightKg * Math.max(multiplier - 0.2, 1.6));
  const upper = Math.round(weightKg * (multiplier + 0.2));

  return {
    target,
    rangeLabel: `${lower}-${upper}g protein/day`,
  };
}

export function calculateCalorieTarget({ sex, age, heightCm, weightKg, activityLevel, goalType }) {
  if (!sex || !age || !heightCm || !weightKg) {
    return null;
  }

  const sexOffset = sex === "female" ? -161 : 5;
  const baseMetabolicRate = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + sexOffset;
  const maintenanceCalories = Math.round(baseMetabolicRate * (ACTIVITY_FACTORS[activityLevel] ?? 1.375));
  const targetCalories = maintenanceCalories + (GOAL_ADJUSTMENTS[goalType] ?? 0);

  return {
    maintenanceCalories,
    targetCalories,
    helperLabel: `${maintenanceCalories} kcal maintain • ${targetCalories} kcal target`,
  };
}

export function normalizeCalorieGoal(rawValue) {
  if (rawValue === "" || rawValue == null) {
    return null;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed >= 1200 ? parsed : null;
}
