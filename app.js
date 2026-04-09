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
  const progressPercent = Math.min(100, Math.round((consumedProtein / proteinGoal) * 100));

  return {
    consumedProtein,
    consumedCalories,
    remainingProtein: Math.max(proteinGoal - consumedProtein, 0),
    remainingCalories: Math.max(calorieGoal - consumedCalories, 0),
    progressPercent,
  };
}

export function suggestNextAction(remainingProtein) {
  if (remainingProtein <= 0) {
    return "Protein goal complete. Coast with something light and hydrate well.";
  }

  if (remainingProtein <= 20) {
    return `${remainingProtein}g left today. A whey shake closes it out fast.`;
  }

  if (remainingProtein <= 35) {
    return `${remainingProtein}g left today. A paneer wrap or Greek yogurt bowl gets you there.`;
  }

  return `${remainingProtein}g left today. Split it between a chicken rice bowl and an evening shake.`;
}

const STORAGE_KEY = "cult-fuel-log-state-v1";

const defaultProfile = {
  weightKg: 72,
  goalType: "gain",
  activityLevel: "active",
  proteinGoal: 158,
  calorieGoal: 2200,
  storeMealImages: true,
  completedOnboarding: false,
};

function loadState() {
  if (typeof localStorage === "undefined") {
    return {
      profile: { ...defaultProfile },
      meals: buildSeedMeals(),
    };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return {
        profile: { ...defaultProfile },
        meals: buildSeedMeals(),
      };
    }

    const parsed = JSON.parse(saved);
    return {
      profile: { ...defaultProfile, ...parsed.profile },
      meals: Array.isArray(parsed.meals) && parsed.meals.length ? parsed.meals : buildSeedMeals(),
    };
  } catch {
    return {
      profile: { ...defaultProfile },
      meals: buildSeedMeals(),
    };
  }
}

function saveState(state) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderMealTimeline(meals) {
  return meals
    .map(
      (meal) => `
        <article class="meal-card">
          <div class="meal-copy">
            <p class="meal-label">${meal.source === "scan" ? "Scan beta" : "Manual log"}</p>
            <h3>${meal.name}</h3>
            <p>${meal.calories} kcal • ${meal.carbs}g carbs • ${meal.fats}g fats</p>
          </div>
          <div class="meal-macro">
            <span>${meal.protein}g</span>
            <small>protein</small>
          </div>
        </article>
      `,
    )
    .join("");
}

function setActivePills(state) {
  document.querySelectorAll("[data-goal]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.goal === state.profile.goalType);
  });

  document.querySelectorAll("[data-activity]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.activity === state.profile.activityLevel);
  });
}

function renderApp(state) {
  const summary = summarizeDay({
    proteinGoal: state.profile.proteinGoal,
    calorieGoal: state.profile.calorieGoal,
    meals: state.meals,
  });

  const ring = document.querySelector("#protein-ring");
  const ringValue = document.querySelector("#progress-percent");
  const proteinValue = document.querySelector("#consumed-protein");
  const proteinGoal = document.querySelector("#protein-goal");
  const remainingProtein = document.querySelector("#remaining-protein");
  const remainingCalories = document.querySelector("#remaining-calories");
  const nextAction = document.querySelector("#next-action");
  const timeline = document.querySelector("#meal-timeline");
  const recommendedGoal = document.querySelector("#recommended-goal");
  const calorieGoalField = document.querySelector("#calorie-goal");
  const storageToggle = document.querySelector("#image-storage");
  const setupCard = document.querySelector("#setup-card");
  const weightLabel = document.querySelector("#weight-label");
  const weightInput = document.querySelector("#weight-input");

  ring.style.setProperty("--progress", `${summary.progressPercent}%`);
  ringValue.textContent = `${summary.progressPercent}%`;
  proteinValue.textContent = `${summary.consumedProtein}g`;
  proteinGoal.textContent = `${state.profile.proteinGoal}g goal`;
  remainingProtein.textContent = `${summary.remainingProtein}g left today`;
  remainingCalories.textContent = `${summary.remainingCalories} kcal remaining`;
  nextAction.textContent = suggestNextAction(summary.remainingProtein);
  timeline.innerHTML = renderMealTimeline(state.meals);
  recommendedGoal.textContent = `${calculateProteinGoal(state.profile).target}g/day recommended`;
  calorieGoalField.value = String(state.profile.calorieGoal);
  storageToggle.checked = state.profile.storeMealImages;
  setupCard.classList.toggle("is-hidden", state.profile.completedOnboarding);
  weightInput.value = String(state.profile.weightKg);
  weightLabel.textContent = `${state.profile.weightKg} kg`;
  setActivePills(state);
}

function initializeApp() {
  const state = loadState();
  const weightInput = document.querySelector("#weight-input");
  const applyProfileButton = document.querySelector("#apply-profile");
  const skipSetupButton = document.querySelector("#skip-setup");
  const calorieGoalField = document.querySelector("#calorie-goal");
  const storageToggle = document.querySelector("#image-storage");

  document.querySelectorAll("[data-goal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.profile.goalType = button.dataset.goal;
      renderApp(state);
    });
  });

  document.querySelectorAll("[data-activity]").forEach((button) => {
    button.addEventListener("click", () => {
      state.profile.activityLevel = button.dataset.activity;
      renderApp(state);
    });
  });

  weightInput.addEventListener("input", () => {
    state.profile.weightKg = Number(weightInput.value);
    const recommendation = calculateProteinGoal(state.profile);
    state.profile.proteinGoal = recommendation.target;
    renderApp(state);
  });

  calorieGoalField.addEventListener("input", () => {
    state.profile.calorieGoal = Number(calorieGoalField.value) || defaultProfile.calorieGoal;
    renderApp(state);
  });

  storageToggle.addEventListener("change", () => {
    state.profile.storeMealImages = storageToggle.checked;
    saveState(state);
  });

  applyProfileButton.addEventListener("click", () => {
    state.profile.completedOnboarding = true;
    saveState(state);
    renderApp(state);
  });

  skipSetupButton.addEventListener("click", () => {
    state.profile.completedOnboarding = true;
    renderApp(state);
  });

  renderApp(state);
}

if (typeof document !== "undefined") {
  window.addEventListener("DOMContentLoaded", initializeApp);
}
