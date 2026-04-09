import {
  calculateProteinGoal,
  calculateCalorieTarget,
  normalizeCalorieGoal,
} from "./src/logic/targets.js";
import {
  summarizeDay,
  filterMealsByDay,
  formatDayKey,
} from "./src/logic/day-log.js";
import {
  manualCatalog,
  findManualMeal,
  searchManualMeals,
} from "./src/data/manual-catalog.js";
import {
  createScanDraft,
  scanPresetIds,
  scanPresets,
} from "./src/data/scan-catalog.js";

const STORAGE_KEY = "cult-fuel-log-state-v1";

const defaultProfile = {
  weightKg: 72,
  heightCm: 178,
  age: 30,
  sex: "male",
  goalType: "gain",
  activityLevel: "active",
  proteinGoal: 158,
  calorieGoal: null,
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

function atUtc(baseDate, dayOffset, hour) {
  const value = new Date(baseDate);
  value.setUTCDate(value.getUTCDate() + dayOffset);
  value.setUTCHours(hour, 0, 0, 0);
  return value.toISOString();
}

function createMeal({ name, source, subtitle, items, totals, timestamp = new Date().toISOString() }) {
  return {
    id: `${source}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp,
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

function buildMealFromTemplate(template, multiplier = 1, timestamp) {
  const scaled = scaleMacros(template, multiplier);

  return createMeal({
    name: template.name,
    source: "manual",
    subtitle: template.subtitle,
    items: [],
    timestamp,
    totals: {
      protein: scaled.protein,
      calories: scaled.calories,
      carbs: scaled.carbs,
      fats: scaled.fats,
    },
  });
}

function buildMealFromScanDraft(scanDraft, multiplier = 1, timestamp) {
  const scaledItems = scanDraft.items.map((item) => scaleMacros(item, multiplier));
  const totals = sumMacros(scaledItems);

  return createMeal({
    name: scanDraft.title,
    source: "scan",
    subtitle: `${scanDraft.confidence} • ${scanDraft.disclaimer}`,
    items: scaledItems,
    timestamp,
    totals,
  });
}

export {
  calculateProteinGoal,
  calculateCalorieTarget,
  normalizeCalorieGoal,
} from "./src/logic/targets.js";

export function buildSeedMeals(now = new Date()) {
  return [
    buildMealFromTemplate(findManualMeal("paneer-power-bowl"), 1, atUtc(now, 0, 8)),
    buildMealFromTemplate(findManualMeal("greek-yogurt-crunch"), 1, atUtc(now, 0, 13)),
    buildMealFromScanDraft(analyzeScanPreset("chicken-rice"), 1, atUtc(now, -1, 19)),
  ];
}

export {
  summarizeDay,
  filterMealsByDay,
  formatDayKey,
} from "./src/logic/day-log.js";

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
  return createScanDraft(presetId);
}

function hydrateMeals(meals) {
  const fallbackTimes = [
    atUtc(new Date(), 0, 8),
    atUtc(new Date(), 0, 13),
    atUtc(new Date(), -1, 19),
  ];

  return meals.map((meal, index) => ({
    ...meal,
    timestamp: meal.timestamp ?? fallbackTimes[index % fallbackTimes.length],
  }));
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
      meals: Array.isArray(parsed.meals) && parsed.meals.length ? hydrateMeals(parsed.meals) : buildSeedMeals(),
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
  return findManualMeal(templateId);
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
  if (!meals.length) {
    return `
      <article class="meal-card empty-state">
        <div class="meal-copy">
          <p class="meal-label">No meals yet</p>
          <h3>Start with a manual log or a quick scan.</h3>
          <p>Your protein progress will update here as soon as you add a meal.</p>
        </div>
      </article>
    `;
  }

  return meals
    .map(
      (meal) => `
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
            <button class="danger-action" type="button" data-delete-meal-id="${meal.id}">Delete</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderManualOptions(uiState) {
  const sections = searchManualMeals(uiState.manualQuery);

  if (!sections.length) {
    return `
      <div class="empty-state">
        <h3>No direct matches</h3>
        <p>Try a simpler search or add a custom food next.</p>
      </div>
    `;
  }

  return sections
    .map((section) => `
      <section class="option-group">
        <p class="option-group-title">${section.title}</p>
        ${section.items.map((meal) => `
          <button class="option-card ${meal.id === uiState.selectedManualId ? "is-active" : ""}" type="button" data-manual-option="${meal.id}">
            <span class="option-title">${meal.name}</span>
            <span class="option-copy">${meal.subtitle}</span>
            <span class="option-meta">${meal.protein}g protein • ${meal.calories} kcal • ${meal.source.toUpperCase()}</span>
          </button>
        `).join("")}
      </section>
    `)
    .join("");
}

function renderScanPresetList(uiState) {
  return scanPresets
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

function setActivePills(profile, uiState) {
  document.querySelectorAll("[data-goal]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.goal === profile.goalType);
  });

  document.querySelectorAll("[data-activity]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.activity === profile.activityLevel);
  });

  document.querySelectorAll("[data-sex]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.sex === profile.sex);
  });

  document.querySelectorAll("[data-day-key]").forEach((button) => {
    const isCustomDay = !["today", "yesterday"].includes(uiState.dayKey);
    const matches = button.dataset.dayKey === uiState.dayKey
      || (button.dataset.dayKey === "calendar" && isCustomDay);
    button.classList.toggle("is-active", matches);
  });

  document.querySelectorAll("[data-nav-target]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.navTarget === uiState.activeNav);
  });
}

function getDayHeading(dayKey) {
  if (dayKey === "today") {
    return "Today";
  }

  if (dayKey === "yesterday") {
    return "Yesterday";
  }

  const date = new Date(`${dayKey}T00:00:00`);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function getCalorieRecommendation(profile) {
  return calculateCalorieTarget(profile);
}

function applyRecommendedTargets(profile, { forceCalorie = false } = {}) {
  const proteinRecommendation = calculateProteinGoal(profile);
  const calorieRecommendation = getCalorieRecommendation(profile);

  profile.proteinGoal = proteinRecommendation.target;
  if (calorieRecommendation && (forceCalorie || profile.calorieGoal == null)) {
    profile.calorieGoal = calorieRecommendation.targetCalories;
  }

  return {
    proteinRecommendation,
    calorieRecommendation,
  };
}

function showScreen(target) {
  const profilePanel = document.querySelector("#profile-panel");
  profilePanel.hidden = target !== "profile";

  if (target === "today") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (target === "history") {
    document.querySelector(".timeline-section").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (target === "profile") {
    profilePanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
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
  const visibleMeals = filterMealsByDay(state.meals, uiState.dayKey);
  const summary = summarizeDay({
    proteinGoal: state.profile.proteinGoal,
    calorieGoal: state.profile.calorieGoal,
    meals: visibleMeals,
  });
  const recommendation = calculateProteinGoal(state.profile);
  const calorieRecommendation = getCalorieRecommendation(state.profile);
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
  document.querySelector("#remaining-calories").textContent = summary.calorieStatus;
  document.querySelector("#calorie-copy").textContent = state.profile.calorieGoal == null
    ? "Calories stay optional until you calculate or set a target."
    : "Calories stay visible, but protein always leads the page.";
  document.querySelector("#next-action").textContent = suggestNextAction(summary.remainingProtein);
  document.querySelector("#meal-timeline").innerHTML = renderMealTimeline(visibleMeals);
  document.querySelector("#day-heading-eyebrow").textContent = getDayHeading(uiState.dayKey);

  document.querySelector("#setup-card").classList.toggle("is-hidden", state.profile.completedOnboarding);
  document.querySelector("#weight-input").value = String(state.profile.weightKg);
  document.querySelector("#weight-label").textContent = `${state.profile.weightKg} kg`;
  document.querySelector("#height-input").value = String(state.profile.heightCm);
  document.querySelector("#age-input").value = String(state.profile.age);
  document.querySelector("#recommended-goal").textContent = `${recommendation.target}g/day recommended • ${recommendation.rangeLabel}`;
  document.querySelector("#recommended-calories").textContent = calorieRecommendation?.helperLabel
    ?? "Add age, height, and sex to estimate calories";
  document.querySelector("#calorie-goal").value = state.profile.calorieGoal == null ? "" : String(state.profile.calorieGoal);
  document.querySelector("#calorie-helper").textContent = calorieRecommendation?.helperLabel
    ?? "We will calculate this if you know your basics.";
  document.querySelector("#image-storage").checked = state.profile.storeMealImages;
  document.querySelector("#profile-weight-input").value = String(state.profile.weightKg);
  document.querySelector("#profile-height-input").value = String(state.profile.heightCm);
  document.querySelector("#profile-age-input").value = String(state.profile.age);
  document.querySelector("#profile-panel").hidden = uiState.activeNav !== "profile";
  setActivePills(state.profile, uiState);

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
    activeNav: "today",
    dayKey: "today",
    manualOpen: false,
    scanOpen: false,
    manualQuery: "",
    selectedManualId: manualCatalog[0].id,
    manualMultiplier: 1,
    selectedScanId: scanPresetIds[0],
    scanMultiplier: 1,
    scanDraft: analyzeScanPreset(scanPresetIds[0]),
  };

  const updateProteinRecommendation = () => {
    state.profile.proteinGoal = calculateProteinGoal(state.profile).target;
  };

  document.querySelectorAll("[data-goal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.profile.goalType = button.dataset.goal;
      updateProteinRecommendation();
      renderApp(state, uiState);
    });
  });

  document.querySelectorAll("[data-activity]").forEach((button) => {
    button.addEventListener("click", () => {
      state.profile.activityLevel = button.dataset.activity;
      updateProteinRecommendation();
      renderApp(state, uiState);
    });
  });

  document.querySelectorAll("[data-sex]").forEach((button) => {
    button.addEventListener("click", () => {
      state.profile.sex = button.dataset.sex;
      renderApp(state, uiState);
    });
  });

  document.querySelector("#weight-input").addEventListener("input", (event) => {
    state.profile.weightKg = Number(event.target.value);
    updateProteinRecommendation();
    renderApp(state, uiState);
  });

  document.querySelector("#height-input").addEventListener("input", (event) => {
    state.profile.heightCm = Number(event.target.value);
    renderApp(state, uiState);
  });

  document.querySelector("#age-input").addEventListener("input", (event) => {
    state.profile.age = Number(event.target.value);
    renderApp(state, uiState);
  });

  document.querySelector("#calorie-goal").addEventListener("input", (event) => {
    state.profile.calorieGoal = normalizeCalorieGoal(event.target.value);
    renderApp(state, uiState);
  });

  document.querySelector("#image-storage").addEventListener("change", (event) => {
    state.profile.storeMealImages = event.target.checked;
    saveState(state);
  });

  document.querySelector("#apply-profile").addEventListener("click", () => {
    applyRecommendedTargets(state.profile);
    state.profile.completedOnboarding = true;
    saveState(state);
    renderApp(state, uiState);
  });

  document.querySelector("#skip-setup").addEventListener("click", () => {
    state.profile.completedOnboarding = true;
    saveState(state);
    renderApp(state, uiState);
  });

  document.querySelector("#cult-fuel-logo").addEventListener("click", () => {
    uiState.activeNav = "today";
    showScreen("today");
    renderApp(state, uiState);
  });

  document.querySelectorAll("[data-nav-target]").forEach((button) => {
    button.addEventListener("click", () => {
      uiState.activeNav = button.dataset.navTarget;
      showScreen(uiState.activeNav);
      renderApp(state, uiState);
    });
  });

  document.querySelector("#day-filter").addEventListener("click", (event) => {
    const chip = event.target.closest("[data-day-key]");
    if (!chip) {
      return;
    }

    if (chip.dataset.dayKey === "calendar") {
      const input = document.querySelector("#calendar-input");
      if (typeof input.showPicker === "function") {
        input.showPicker();
      } else {
        input.click();
      }
      return;
    }

    uiState.dayKey = chip.dataset.dayKey;
    renderApp(state, uiState);
  });

  document.querySelector("#calendar-input").addEventListener("change", (event) => {
    if (!event.target.value) {
      return;
    }

    uiState.dayKey = event.target.value;
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

  document.querySelector("#recalculate-profile").addEventListener("click", () => {
    state.profile.weightKg = Number(document.querySelector("#profile-weight-input").value);
    state.profile.heightCm = Number(document.querySelector("#profile-height-input").value);
    state.profile.age = Number(document.querySelector("#profile-age-input").value);

    applyRecommendedTargets(state.profile, { forceCalorie: true });
    saveState(state);
    renderApp(state, uiState);
    showToast("Targets recalculated");
  });

  document.querySelector("#meal-timeline").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-meal-id]");
    if (!button) {
      return;
    }

    const index = state.meals.findIndex((meal) => meal.id === button.dataset.deleteMealId);
    if (index === -1) {
      return;
    }

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
