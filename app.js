const manualMealCatalog = [
  {
    id: "paneer-power-bowl",
    name: "Paneer Power Bowl",
    protein: 42,
    calories: 460,
    carbs: 28,
    fats: 18,
    subtitle: "Paneer, quinoa, greens, mint yogurt",
  },
  {
    id: "greek-yogurt-crunch",
    name: "Greek Yogurt Crunch",
    protein: 32,
    calories: 330,
    carbs: 24,
    fats: 9,
    subtitle: "Greek yogurt, berries, granola, seeds",
  },
  {
    id: "dal-chilla-stack",
    name: "Dal Chilla Stack",
    protein: 28,
    calories: 370,
    carbs: 29,
    fats: 11,
    subtitle: "Moong dal chilla, hung curd, greens",
  },
  {
    id: "grilled-chicken-sando",
    name: "Grilled Chicken Sando",
    protein: 36,
    calories: 420,
    carbs: 31,
    fats: 14,
    subtitle: "Chicken breast, sourdough, slaw",
  },
  {
    id: "whey-shot",
    name: "Whey Isolate Shot",
    protein: 25,
    calories: 130,
    carbs: 4,
    fats: 1,
    subtitle: "Fastest 25g top-up in the day",
  },
];

const scanPresetCatalog = {
  "power-thali": {
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
  "chicken-rice": {
    id: "chicken-rice",
    title: "Chicken Curry Rice",
    confidence: "Medium confidence",
    caption: "Chicken curry and rice bowl",
    items: [
      { name: "Chicken curry", protein: 26, calories: 310, carbs: 10, fats: 18 },
      { name: "Rice", protein: 12, calories: 230, carbs: 36, fats: 1 },
    ],
  },
  brunch: {
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
};

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

function round(value) {
  return Math.round(value);
}

function scaleMacros(item, multiplier) {
  return {
    ...item,
    protein: round(item.protein * multiplier),
    calories: round(item.calories * multiplier),
    carbs: round(item.carbs * multiplier),
    fats: round(item.fats * multiplier),
  };
}

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

function createMeal({ name, source, subtitle, items, totals }) {
  return {
    id: `${source}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    source,
    subtitle,
    items,
    protein: totals.protein,
    calories: totals.calories,
    carbs: totals.carbs,
    fats: totals.fats,
  };
}

function buildMealFromTemplate(template, multiplier = 1) {
  const scaled = scaleMacros(template, multiplier);

  return createMeal({
    name: template.name,
    source: "manual",
    subtitle: template.subtitle,
    items: [],
    totals: {
      protein: scaled.protein,
      calories: scaled.calories,
      carbs: scaled.carbs,
      fats: scaled.fats,
    },
  });
}

function buildMealFromScanDraft(scanDraft, multiplier = 1) {
  const scaledItems = scanDraft.items.map((item) => scaleMacros(item, multiplier));
  const totals = sumMacros(scaledItems);

  return createMeal({
    name: scanDraft.title,
    source: "scan",
    subtitle: `${scanDraft.confidence} • ${scanDraft.disclaimer}`,
    items: scaledItems,
    totals,
  });
}

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
  const target = round(weightKg * multiplier);
  const lower = round(weightKg * Math.max(multiplier - 0.2, 1.6));
  const upper = round(weightKg * (multiplier + 0.2));

  return {
    target,
    rangeLabel: `${lower}-${upper}g protein/day`,
  };
}

export function buildSeedMeals() {
  return [
    buildMealFromTemplate(manualMealCatalog[0], 1),
    buildMealFromTemplate(manualMealCatalog[1], 1),
    buildMealFromScanDraft(analyzeScanPreset("chicken-rice"), 1),
  ];
}

export function summarizeDay({ proteinGoal, calorieGoal, meals }) {
  const consumedProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const consumedCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const progressPercent = Math.min(100, round((consumedProtein / proteinGoal) * 100));

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

export function analyzeScanPreset(presetId) {
  const preset = scanPresetCatalog[presetId] ?? scanPresetCatalog["power-thali"];
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

function getManualTemplate(templateId) {
  return manualMealCatalog.find((item) => item.id === templateId) ?? manualMealCatalog[0];
}

function getManualPreview(uiState) {
  const template = getManualTemplate(uiState.selectedManualId);
  const scaled = scaleMacros(template, uiState.manualMultiplier);
  return {
    ...template,
    ...scaled,
  };
}

function getScanPreview(uiState) {
  const scaledItems = uiState.scanDraft.items.map((item) => scaleMacros(item, uiState.scanMultiplier));
  return {
    ...uiState.scanDraft,
    totals: sumMacros(scaledItems),
    items: scaledItems,
  };
}

function renderMealTimeline(meals) {
  return meals
    .map(
      (meal, index) => `
        <article class="meal-card">
          <div class="meal-copy">
            <p class="meal-label">${meal.source === "scan" ? "Scan beta" : "Manual log"}</p>
            <h3>${meal.name}</h3>
            <p>${meal.calories} kcal • ${meal.carbs}g carbs • ${meal.fats}g fats</p>
            <p>${meal.subtitle ?? ""}</p>
          </div>
          <div class="meal-side">
            <div class="meal-macro">
              <span>${meal.protein}g</span>
              <small>protein</small>
            </div>
            <button class="danger-action" type="button" data-delete-meal="${index}">Delete</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderManualOptions(uiState) {
  const query = uiState.manualQuery.trim().toLowerCase();

  return manualMealCatalog
    .filter((meal) => !query || meal.name.toLowerCase().includes(query) || meal.subtitle.toLowerCase().includes(query))
    .map(
      (meal) => `
        <button class="option-card ${meal.id === uiState.selectedManualId ? "is-active" : ""}" type="button" data-manual-option="${meal.id}">
          <span class="option-title">${meal.name}</span>
          <span class="option-copy">${meal.subtitle}</span>
          <span class="option-meta">${meal.protein}g protein • ${meal.calories} kcal</span>
        </button>
      `,
    )
    .join("");
}

function renderScanPresetList(uiState) {
  return Object.values(scanPresetCatalog)
    .map(
      (preset) => `
        <button class="scan-card ${preset.id === uiState.selectedScanId ? "is-active" : ""}" type="button" data-scan-preset="${preset.id}">
          <span class="scan-card-title">${preset.title}</span>
          <span class="scan-card-copy">${preset.caption}</span>
        </button>
      `,
    )
    .join("");
}

function renderScanItemsEditor(uiState) {
  return uiState.scanDraft.items
    .map(
      (item, index) => `
        <label class="scan-item">
          <input type="text" value="${item.name}" data-scan-item-name="${index}">
          <span>${item.protein}g protein • ${item.calories} kcal</span>
        </label>
      `,
    )
    .join("");
}

function setActivePills(profile) {
  document.querySelectorAll("[data-goal]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.goal === profile.goalType);
  });

  document.querySelectorAll("[data-activity]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.activity === profile.activityLevel);
  });
}

function showToast(message) {
  const toast = document.querySelector("#save-toast");
  toast.textContent = message;
  toast.classList.add("is-visible");

  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

function renderApp(state, uiState) {
  const summary = summarizeDay({
    proteinGoal: state.profile.proteinGoal,
    calorieGoal: state.profile.calorieGoal,
    meals: state.meals,
  });
  const recommendation = calculateProteinGoal(state.profile);
  const manualPreview = getManualPreview(uiState);
  const scanPreview = getScanPreview(uiState);
  const sheetOpen = uiState.manualOpen || uiState.scanOpen;

  document.body.classList.toggle("sheet-open", sheetOpen);
  document.querySelector("#sheet-backdrop").hidden = !sheetOpen;
  document.querySelector("#sheet-backdrop").classList.toggle("is-visible", sheetOpen);

  document.querySelector("#protein-ring").style.setProperty("--progress", `${summary.progressPercent}%`);
  document.querySelector("#progress-percent").textContent = `${summary.progressPercent}%`;
  document.querySelector("#consumed-protein").textContent = `${summary.consumedProtein}g`;
  document.querySelector("#protein-goal").textContent = `${state.profile.proteinGoal}g goal`;
  document.querySelector("#remaining-protein").textContent = `${summary.remainingProtein}g left today`;
  document.querySelector("#remaining-calories").textContent = `${summary.remainingCalories} kcal remaining`;
  document.querySelector("#next-action").textContent = suggestNextAction(summary.remainingProtein);
  document.querySelector("#meal-timeline").innerHTML = renderMealTimeline(state.meals);

  document.querySelector("#setup-card").classList.toggle("is-hidden", state.profile.completedOnboarding);
  document.querySelector("#weight-input").value = String(state.profile.weightKg);
  document.querySelector("#weight-label").textContent = `${state.profile.weightKg} kg`;
  document.querySelector("#recommended-goal").textContent = `${recommendation.target}g/day recommended • ${recommendation.rangeLabel}`;
  document.querySelector("#calorie-goal").value = String(state.profile.calorieGoal);
  document.querySelector("#image-storage").checked = state.profile.storeMealImages;
  setActivePills(state.profile);

  document.querySelector("#manual-sheet").classList.toggle("is-open", uiState.manualOpen);
  document.querySelector("#scan-sheet").classList.toggle("is-open", uiState.scanOpen);
  document.querySelector("#manual-search").value = uiState.manualQuery;
  document.querySelector("#manual-options").innerHTML = renderManualOptions(uiState);
  document.querySelector("#manual-portion").value = String(uiState.manualMultiplier);
  document.querySelector("#manual-portion-label").textContent = `${uiState.manualMultiplier.toFixed(1)}x portion`;
  document.querySelector("#manual-preview-name").textContent = manualPreview.name;
  document.querySelector("#manual-preview-copy").textContent = manualPreview.subtitle;
  document.querySelector("#manual-preview-protein").textContent = `${manualPreview.protein}g`;
  document.querySelector("#manual-preview-calories").textContent = `${manualPreview.calories}`;
  document.querySelector("#manual-preview-carbs").textContent = `${manualPreview.carbs}g`;
  document.querySelector("#manual-preview-fats").textContent = `${manualPreview.fats}g`;

  document.querySelector("#scan-preset-list").innerHTML = renderScanPresetList(uiState);
  document.querySelector("#scan-portion").value = String(uiState.scanMultiplier);
  document.querySelector("#scan-portion-label").textContent = `${uiState.scanMultiplier.toFixed(1)}x plate`;
  document.querySelector("#scan-confidence").textContent = scanPreview.confidence;
  document.querySelector("#scan-caption").textContent = scanPreview.caption;
  document.querySelector("#scan-disclaimer").textContent = scanPreview.disclaimer;
  document.querySelector("#scan-items-editor").innerHTML = renderScanItemsEditor(uiState);
  document.querySelector("#scan-preview-protein").textContent = `${scanPreview.totals.protein}g`;
  document.querySelector("#scan-preview-calories").textContent = `${scanPreview.totals.calories}`;
  document.querySelector("#scan-preview-carbs").textContent = `${scanPreview.totals.carbs}g`;
  document.querySelector("#scan-preview-fats").textContent = `${scanPreview.totals.fats}g`;
}

function initializeApp() {
  const state = loadState();
  const uiState = {
    manualOpen: false,
    scanOpen: false,
    manualQuery: "",
    selectedManualId: manualMealCatalog[0].id,
    manualMultiplier: 1,
    selectedScanId: "power-thali",
    scanMultiplier: 1,
    scanDraft: analyzeScanPreset("power-thali"),
  };

  document.querySelectorAll("[data-goal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.profile.goalType = button.dataset.goal;
      state.profile.proteinGoal = calculateProteinGoal(state.profile).target;
      renderApp(state, uiState);
    });
  });

  document.querySelectorAll("[data-activity]").forEach((button) => {
    button.addEventListener("click", () => {
      state.profile.activityLevel = button.dataset.activity;
      state.profile.proteinGoal = calculateProteinGoal(state.profile).target;
      renderApp(state, uiState);
    });
  });

  document.querySelector("#weight-input").addEventListener("input", (event) => {
    state.profile.weightKg = Number(event.target.value);
    state.profile.proteinGoal = calculateProteinGoal(state.profile).target;
    renderApp(state, uiState);
  });

  document.querySelector("#calorie-goal").addEventListener("input", (event) => {
    state.profile.calorieGoal = Number(event.target.value) || defaultProfile.calorieGoal;
    renderApp(state, uiState);
  });

  document.querySelector("#image-storage").addEventListener("change", (event) => {
    state.profile.storeMealImages = event.target.checked;
    saveState(state);
  });

  document.querySelector("#apply-profile").addEventListener("click", () => {
    state.profile.completedOnboarding = true;
    saveState(state);
    renderApp(state, uiState);
  });

  document.querySelector("#skip-setup").addEventListener("click", () => {
    state.profile.completedOnboarding = true;
    saveState(state);
    renderApp(state, uiState);
  });

  document.querySelector("#open-manual-log").addEventListener("click", () => {
    uiState.manualOpen = true;
    uiState.scanOpen = false;
    renderApp(state, uiState);
  });

  document.querySelector("#open-scan-log").addEventListener("click", () => {
    uiState.scanOpen = true;
    uiState.manualOpen = false;
    renderApp(state, uiState);
  });

  document.querySelector("#sheet-backdrop").addEventListener("click", () => {
    uiState.manualOpen = false;
    uiState.scanOpen = false;
    renderApp(state, uiState);
  });

  document.querySelectorAll("[data-close-sheet]").forEach((button) => {
    button.addEventListener("click", () => {
      uiState.manualOpen = false;
      uiState.scanOpen = false;
      renderApp(state, uiState);
    });
  });

  document.querySelector("#manual-search").addEventListener("input", (event) => {
    uiState.manualQuery = event.target.value;
    renderApp(state, uiState);
  });

  document.querySelector("#manual-options").addEventListener("click", (event) => {
    const option = event.target.closest("[data-manual-option]");
    if (!option) {
      return;
    }

    uiState.selectedManualId = option.dataset.manualOption;
    renderApp(state, uiState);
  });

  document.querySelector("#manual-portion").addEventListener("input", (event) => {
    uiState.manualMultiplier = Number(event.target.value);
    renderApp(state, uiState);
  });

  document.querySelector("#add-manual-meal").addEventListener("click", () => {
    const template = getManualTemplate(uiState.selectedManualId);
    state.meals.unshift(buildMealFromTemplate(template, uiState.manualMultiplier));
    saveState(state);
    uiState.manualOpen = false;
    uiState.manualMultiplier = 1;
    uiState.manualQuery = "";
    renderApp(state, uiState);
    showToast(`${template.name} added to today`);
  });

  document.querySelector("#scan-preset-list").addEventListener("click", (event) => {
    const option = event.target.closest("[data-scan-preset]");
    if (!option) {
      return;
    }

    uiState.selectedScanId = option.dataset.scanPreset;
    uiState.scanDraft = analyzeScanPreset(uiState.selectedScanId);
    uiState.scanMultiplier = 1;
    renderApp(state, uiState);
  });

  document.querySelector("#scan-portion").addEventListener("input", (event) => {
    uiState.scanMultiplier = Number(event.target.value);
    renderApp(state, uiState);
  });

  document.querySelector("#scan-items-editor").addEventListener("input", (event) => {
    const input = event.target.closest("[data-scan-item-name]");
    if (!input) {
      return;
    }

    const index = Number(input.dataset.scanItemName);
    uiState.scanDraft.items[index].name = input.value;
  });

  document.querySelector("#save-scan-meal").addEventListener("click", () => {
    state.meals.unshift(buildMealFromScanDraft(uiState.scanDraft, uiState.scanMultiplier));
    saveState(state);
    uiState.scanOpen = false;
    uiState.scanMultiplier = 1;
    renderApp(state, uiState);
    showToast("Scan saved to today");
  });

  document.querySelector("#meal-timeline").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-meal]");
    if (!button) {
      return;
    }

    const index = Number(button.dataset.deleteMeal);
    const [removed] = state.meals.splice(index, 1);
    saveState(state);
    renderApp(state, uiState);
    showToast(`${removed.name} removed`);
  });

  renderApp(state, uiState);
}

if (typeof document !== "undefined") {
  window.addEventListener("DOMContentLoaded", initializeApp);
}
