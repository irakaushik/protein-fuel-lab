# Cult Fuel Log Prototype Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the current static Cult Fuel Log prototype with the approved animated logo, richer protein and calorie calculators, grouped Indian and global meal suggestions, profile recalculation, day navigation, and the Cult Transform referral section.

**Architecture:** Preserve the current GitHub Pages-compatible static web app, but stop growing the single large `app.js` file by extracting pure nutrition and catalog logic into focused ES modules. Keep the UI local-first and source-tagged, using curated local data derived from the approved Anuvaad INDB plus USDA strategy so the prototype can ship immediately while staying compatible with a later backend-backed search or scan service.

**Tech Stack:** HTML, CSS, vanilla ES modules, Node built-in test runner, GitHub Pages

---

## File Structure

- Create: `src/logic/targets.js`
- Create: `src/logic/day-log.js`
- Create: `src/data/manual-catalog.js`
- Create: `src/data/scan-catalog.js`
- Modify: `app.js`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `tests/app.test.mjs`
- Modify: `docs/superpowers/plans/2026-04-09-cult-fuel-log-prototype.md`

### Task 1: Extract Target And Day Summary Logic Into Focused Modules

**Files:**
- Create: `src/logic/targets.js`
- Create: `src/logic/day-log.js`
- Modify: `app.js`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Write the failing tests for calorie calculation, blank calorie handling, and day filtering**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateProteinGoal,
  calculateCalorieTarget,
  normalizeCalorieGoal,
} from "../src/logic/targets.js";
import {
  summarizeDay,
  filterMealsByDay,
  formatDayKey,
} from "../src/logic/day-log.js";

test("calculateCalorieTarget returns maintenance and target calories when inputs are complete", () => {
  const result = calculateCalorieTarget({
    sex: "male",
    age: 30,
    heightCm: 178,
    weightKg: 72,
    activityLevel: "active",
    goalType: "gain",
  });

  assert.deepEqual(result, {
    maintenanceCalories: 2616,
    targetCalories: 2866,
    helperLabel: "2616 kcal maintain • 2866 kcal target",
  });
});

test("normalizeCalorieGoal keeps blank input optional", () => {
  assert.equal(normalizeCalorieGoal(""), null);
  assert.equal(normalizeCalorieGoal("2050"), 2050);
});

test("summarizeDay leaves remaining calories blank when no calorie target is set", () => {
  const summary = summarizeDay({
    proteinGoal: 160,
    calorieGoal: null,
    meals: [
      { protein: 40, calories: 420 },
      { protein: 28, calories: 310 },
    ],
  });

  assert.equal(summary.consumedProtein, 68);
  assert.equal(summary.remainingProtein, 92);
  assert.equal(summary.remainingCalories, null);
  assert.equal(summary.calorieStatus, "Set calorie target");
});

test("filterMealsByDay isolates today and yesterday entries", () => {
  const now = new Date("2026-04-09T09:00:00.000Z");
  const meals = [
    { id: "today", timestamp: "2026-04-09T06:00:00.000Z", protein: 24, calories: 220 },
    { id: "yesterday", timestamp: "2026-04-08T19:00:00.000Z", protein: 35, calories: 380 },
  ];

  assert.deepEqual(
    filterMealsByDay(meals, "today", now).map((meal) => meal.id),
    ["today"],
  );
  assert.deepEqual(
    filterMealsByDay(meals, "yesterday", now).map((meal) => meal.id),
    ["yesterday"],
  );
  assert.equal(formatDayKey(now), "2026-04-09");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/app.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/logic/targets.js` and `src/logic/day-log.js`

- [ ] **Step 3: Add the new pure logic modules and switch `app.js` to import from them**

```js
// src/logic/targets.js
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
```

```js
// src/logic/day-log.js
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
```

```js
// app.js
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
```

- [ ] **Step 4: Run the tests to verify the extracted logic passes**

Run: `node --test tests/app.test.mjs`
Expected: PASS for the new calculator and day-log assertions

- [ ] **Step 5: Commit the logic extraction**

```bash
git add src/logic/targets.js src/logic/day-log.js app.js tests/app.test.mjs
git commit -m "refactor: extract target and day-log logic"
```

### Task 2: Split Meal Catalog Data And Expand Indian Plus Global Suggestions

**Files:**
- Create: `src/data/manual-catalog.js`
- Create: `src/data/scan-catalog.js`
- Modify: `app.js`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Write the failing tests for grouped suggestions and scan draft creation**

```js
import {
  manualSections,
  findManualMeal,
  searchManualMeals,
} from "../src/data/manual-catalog.js";
import {
  createScanDraft,
  scanPresetIds,
} from "../src/data/scan-catalog.js";

test("manualSections includes both Indian and global grouped suggestions", () => {
  const titles = manualSections.map((section) => section.title);
  const flatNames = manualSections.flatMap((section) => section.items.map((item) => item.name));

  assert.ok(titles.includes("Frequent Indian meals"));
  assert.ok(titles.includes("Frequent global meals"));
  assert.ok(flatNames.includes("Paneer Bhurji Roll"));
  assert.ok(flatNames.includes("Grilled Chicken Sandwich"));
});

test("searchManualMeals filters by name and subtitle", () => {
  const sections = searchManualMeals("paneer");
  const names = sections.flatMap((section) => section.items.map((item) => item.name));

  assert.ok(names.includes("Paneer Power Bowl"));
  assert.ok(names.includes("Paneer Bhurji Roll"));
});

test("createScanDraft returns an editable scan result with disclaimer copy", () => {
  const draft = createScanDraft(scanPresetIds[0]);

  assert.equal(draft.disclaimer, "Estimates may vary");
  assert.ok(Array.isArray(draft.items));
  assert.ok(draft.items.length > 0);
  assert.equal(typeof draft.totals.protein, "number");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/app.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for the new catalog modules

- [ ] **Step 3: Add grouped meal sections and move scan presets out of `app.js`**

```js
// src/data/manual-catalog.js
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

const flatCatalog = manualSections.flatMap((section) => section.items);

export function findManualMeal(mealId) {
  return flatCatalog.find((meal) => meal.id === mealId) ?? flatCatalog[0];
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
```

```js
// src/data/scan-catalog.js
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

const scanPresets = {
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

export const scanPresetIds = Object.keys(scanPresets);

export function createScanDraft(presetId) {
  const preset = scanPresets[presetId] ?? scanPresets["power-thali"];
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
```

```js
// app.js
import {
  manualSections,
  findManualMeal,
  searchManualMeals,
} from "./src/data/manual-catalog.js";
import {
  createScanDraft,
  scanPresetIds,
} from "./src/data/scan-catalog.js";
```

- [ ] **Step 4: Run the tests to verify the catalog split and grouped search pass**

Run: `node --test tests/app.test.mjs`
Expected: PASS for grouped meal sections and scan draft creation

- [ ] **Step 5: Commit the catalog split**

```bash
git add src/data/manual-catalog.js src/data/scan-catalog.js app.js tests/app.test.mjs
git commit -m "feat: add grouped meal catalogs"
```

### Task 3: Replace The Header And Screen Markup With The Approved Brand And Navigation Structure

**Files:**
- Modify: `index.html`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Write the failing markup tests for the new logo, profile panel, day chips, and Cult Transform card**

```js
test("index.html contains the animated Cult Fuel Log logo shell and no cult.fit chip", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /id="cult-fuel-logo"/);
  assert.match(html, /class="vman-mark"/);
  assert.doesNotMatch(html, /cult-brand-fit/);
  assert.doesNotMatch(html, /Protein-first tracker/);
});

test("index.html includes profile recalculation and Cult Transform sections", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /id="profile-panel"/);
  assert.match(html, /Recalculate targets/);
  assert.match(html, /Go beyond logging with Cult Transform/);
  assert.match(html, /https:\/\/www\.cult\.fit\/fitness\/cult-transform/);
});

test("index.html includes mobile day chips and bottom nav targets", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /id="day-filter"/);
  assert.match(html, /data-day-key="today"/);
  assert.match(html, /data-nav-target="history"/);
  assert.match(html, /data-nav-target="profile"/);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/app.test.mjs`
Expected: FAIL because the current markup still contains the old topbar chip layout and does not have the new logo shell or profile section

- [ ] **Step 3: Replace the current header, setup, timeline heading, and lower-page sections with the approved markup**

```html
<header class="topbar">
  <button class="brand-lockup" id="cult-fuel-logo" type="button" aria-label="Cult Fuel Log home">
    <span class="vman-mark" aria-hidden="true">
      <svg viewBox="0 0 64 64" role="presentation">
        <path d="M10 16 31 48 54 16" />
        <path d="M22 16 31 29 42 16" />
      </svg>
    </span>
    <span class="brand-copy">
      <small>CULT</small>
      <strong>FUEL LOG</strong>
    </span>
  </button>
</header>
```

```html
<section class="setup-card" id="setup-card">
  <div class="setup-copy">
    <p class="eyebrow">Set your daily target</p>
    <h2>Build your fuel profile in under 20 seconds.</h2>
    <p>We recommend both protein and calories from your weight, height, age, goal, and training load, then keep both editable.</p>
  </div>

  <div class="setup-controls">
    <label class="control-block" for="weight-input">
      <span>Weight</span>
      <strong id="weight-label">72 kg</strong>
    </label>
    <input id="weight-input" type="range" min="45" max="120" value="72">

    <div class="inline-fields">
      <label class="control-block" for="height-input">
        <span>Height</span>
        <input id="height-input" type="number" min="140" max="210" value="178">
      </label>
      <label class="control-block" for="age-input">
        <span>Age</span>
        <input id="age-input" type="number" min="16" max="80" value="30">
      </label>
    </div>

    <div class="pill-group" id="sex-group">
      <button class="pill-button is-active" data-sex="male" type="button">Male</button>
      <button class="pill-button" data-sex="female" type="button">Female</button>
    </div>

    <div class="pill-group" id="goal-group">
      <button class="pill-button" data-goal="lose" type="button">Lose</button>
      <button class="pill-button is-active" data-goal="gain" type="button">Gain</button>
      <button class="pill-button" data-goal="maintain" type="button">Maintain</button>
    </div>

    <div class="pill-group" id="activity-group">
      <button class="pill-button" data-activity="light" type="button">Light</button>
      <button class="pill-button is-active" data-activity="active" type="button">Active</button>
      <button class="pill-button" data-activity="intense" type="button">Intense</button>
    </div>

    <label class="control-block" for="calorie-goal">
      <span>Calorie target</span>
      <input id="calorie-goal" type="number" min="1200" step="50" placeholder="Optional">
      <small id="calorie-helper">We will calculate this if you know your basics.</small>
    </label>

    <p class="recommendation" id="recommended-goal">158g/day recommended</p>
    <p class="recommendation secondary" id="recommended-calories">2616 kcal maintain • 2866 kcal target</p>

    <div class="setup-actions">
      <button id="apply-profile" class="primary-action" type="button">Use targets</button>
      <button id="skip-setup" class="secondary-action" type="button">Skip for now</button>
    </div>
  </div>
</section>
```

```html
<section class="transform-card glass-card">
  <p class="eyebrow">Continue with Cult</p>
  <h2>Go beyond logging with Cult Transform</h2>
  <p>Structured coaching, accountability, and progression if you want a bigger change than logging alone.</p>
  <ul class="transform-list">
    <li>Goal-led coaching</li>
    <li>Habit and nutrition accountability</li>
    <li>Structured training journey</li>
  </ul>
  <a class="primary-action transform-link" href="https://www.cult.fit/fitness/cult-transform" target="_blank" rel="noreferrer">Open in Cult app</a>
</section>
```

```html
<section class="timeline-section" id="timeline-section">
  <div class="section-heading">
    <div>
      <p class="eyebrow" id="day-heading-eyebrow">Today</p>
      <h2>Meal timeline</h2>
    </div>
    <div class="history-chip-row" id="day-filter">
      <button class="history-chip is-active" data-day-key="today" type="button">Today</button>
      <button class="history-chip" data-day-key="yesterday" type="button">Yesterday</button>
      <button class="history-chip" data-day-key="calendar" type="button">Calendar</button>
    </div>
  </div>
  <div class="meal-timeline" id="meal-timeline"></div>
</section>

<section class="profile-panel glass-card" id="profile-panel" hidden>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Profile</p>
      <h2>Recalculate targets</h2>
    </div>
    <button class="secondary-action" id="recalculate-profile" type="button">Recalculate targets</button>
  </div>
  <div class="profile-grid">
    <label class="control-block" for="profile-weight-input"><span>Weight</span><input id="profile-weight-input" type="number" min="45" max="120"></label>
    <label class="control-block" for="profile-height-input"><span>Height</span><input id="profile-height-input" type="number" min="140" max="210"></label>
    <label class="control-block" for="profile-age-input"><span>Age</span><input id="profile-age-input" type="number" min="16" max="80"></label>
  </div>
</section>

<nav class="bottom-nav" aria-label="Primary">
  <button class="nav-item is-active" data-nav-target="today" type="button">Today</button>
  <button class="nav-item" data-nav-target="history" type="button">History</button>
  <button class="nav-item" data-nav-target="profile" type="button">Profile</button>
</nav>
```

- [ ] **Step 4: Run the tests to verify the new page shell passes**

Run: `node --test tests/app.test.mjs`
Expected: PASS for the new markup assertions

- [ ] **Step 5: Commit the markup refresh**

```bash
git add index.html tests/app.test.mjs
git commit -m "feat: refresh app shell and profile layout"
```

### Task 4: Wire The New UI State, Recalculation Flows, And Day Navigation

**Files:**
- Modify: `app.js`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Write the failing tests for suggestion copy and grouped search empty states**

```js
import { searchManualMeals } from "../src/data/manual-catalog.js";
import { suggestNextAction } from "../app.js";

test("searchManualMeals returns no sections for an unmatched query", () => {
  assert.deepEqual(searchManualMeals("zxqv"), []);
});

test("suggestNextAction celebrates completion when protein goal is already met", () => {
  assert.equal(
    suggestNextAction(0),
    "Protein goal complete. Coast with something light and hydrate well.",
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/app.test.mjs`
Expected: FAIL because the current grouped search module is not yet hooked into the UI and the app still renders flat manual options

- [ ] **Step 3: Update `app.js` so the new state model drives setup, profile, nav, day chips, and grouped manual results**

```js
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

function createMeal({ name, source, subtitle, items, totals }) {
  return {
    id: `${source}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
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

  return sections.map((section) => `
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
  `).join("");
}

function recalculateTargets(profile) {
  const protein = calculateProteinGoal(profile);
  const calories = calculateCalorieTarget(profile);
  return {
    proteinGoal: protein.target,
    calorieGoal: profile.calorieGoal ?? calories?.targetCalories ?? null,
    proteinLabel: `${protein.target}g/day recommended • ${protein.rangeLabel}`,
    calorieLabel: calories?.helperLabel ?? "Add age, height, and sex to estimate calories",
  };
}

function showScreen(target) {
  document.querySelector("#profile-panel").hidden = target !== "profile";

  if (target === "history") {
    document.querySelector("#timeline-section").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (target === "profile") {
    document.querySelector("#profile-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function syncProfileInputs(profile) {
  document.querySelector("#height-input").value = String(profile.heightCm);
  document.querySelector("#age-input").value = String(profile.age);
  document.querySelector("#calorie-goal").value = profile.calorieGoal == null ? "" : String(profile.calorieGoal);
  document.querySelector("#profile-weight-input").value = String(profile.weightKg);
  document.querySelector("#profile-height-input").value = String(profile.heightCm);
  document.querySelector("#profile-age-input").value = String(profile.age);
}
```

```js
const uiState = {
  activeNav: "today",
  dayKey: "today",
  manualOpen: false,
  scanOpen: false,
  manualQuery: "",
  selectedManualId: manualSections[0].items[0].id,
  manualMultiplier: 1,
  selectedScanId: scanPresetIds[0],
  scanMultiplier: 1,
  scanDraft: createScanDraft(scanPresetIds[0]),
};

document.querySelectorAll("[data-nav-target]").forEach((button) => {
  button.addEventListener("click", () => {
    uiState.activeNav = button.dataset.navTarget;
    showScreen(uiState.activeNav);
  });
});

document.querySelector("#day-filter").addEventListener("click", (event) => {
  const chip = event.target.closest("[data-day-key]");
  if (!chip) {
    return;
  }

  uiState.dayKey = chip.dataset.dayKey;
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

document.querySelectorAll("[data-sex]").forEach((button) => {
  button.addEventListener("click", () => {
    state.profile.sex = button.dataset.sex;
    renderApp(state, uiState);
  });
});

document.querySelector("#calorie-goal").addEventListener("input", (event) => {
  state.profile.calorieGoal = normalizeCalorieGoal(event.target.value);
  renderApp(state, uiState);
});

document.querySelector("#recalculate-profile").addEventListener("click", () => {
  state.profile.weightKg = Number(document.querySelector("#profile-weight-input").value);
  state.profile.heightCm = Number(document.querySelector("#profile-height-input").value);
  state.profile.age = Number(document.querySelector("#profile-age-input").value);

  const targets = recalculateTargets(state.profile);
  state.profile.proteinGoal = targets.proteinGoal;
  if (state.profile.calorieGoal == null) {
    state.profile.calorieGoal = targets.calorieGoal;
  }

  saveState(state);
  renderApp(state, uiState);
  showToast("Targets recalculated");
});
```

- [ ] **Step 4: Run the tests to verify the new UI-driven logic passes**

Run: `node --test tests/app.test.mjs`
Expected: PASS for grouped-search empty states, celebration copy, and the previously added logic tests

- [ ] **Step 5: Commit the state and interaction wiring**

```bash
git add app.js tests/app.test.mjs
git commit -m "feat: add target recalculation and day navigation"
```

### Task 5: Restyle The App With The Approved Aurora Palette And Animated Brand Lockup

**Files:**
- Modify: `styles.css`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Write the failing CSS tests for the new palette, reduced motion support, and animated logo**

```js
test("styles.css uses the approved black blue yellow white pink palette and drops orange", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(css, /--blue:/);
  assert.match(css, /--yellow:/);
  assert.match(css, /--pink:/);
  assert.doesNotMatch(css, /#ff8f32/i);
});

test("styles.css includes reduced motion handling for the animated logo", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@keyframes vman-pulse/);
  assert.match(css, /@keyframes wordmark-shimmer/);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/app.test.mjs`
Expected: FAIL because `styles.css` still contains orange Aurora values and does not define the new brand animation keyframes

- [ ] **Step 3: Replace the palette and add the logo, profile, chip, and transform-card styling**

```css
:root {
  --bg: #03070c;
  --bg-deep: #07111f;
  --surface: rgba(8, 13, 22, 0.82);
  --surface-strong: rgba(10, 17, 28, 0.94);
  --border: rgba(255, 255, 255, 0.12);
  --text: #ffffff;
  --muted: #a8b6c8;
  --blue: #58a6ff;
  --blue-soft: #1f6bff;
  --yellow: #ffe45c;
  --pink: #ff4fbf;
  --shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
  --ring-track: rgba(255, 255, 255, 0.12);
}

html {
  min-height: 100%;
  background:
    radial-gradient(circle at top left, rgba(88, 166, 255, 0.22), transparent 30%),
    radial-gradient(circle at top right, rgba(255, 228, 92, 0.12), transparent 24%),
    radial-gradient(circle at 70% 70%, rgba(255, 79, 191, 0.10), transparent 22%),
    linear-gradient(180deg, var(--bg) 0%, var(--bg-deep) 100%);
}

.brand-lockup {
  display: inline-flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0;
  color: var(--text);
  background: transparent;
}

.vman-mark {
  display: inline-grid;
  place-items: center;
  width: 3.4rem;
  height: 3.4rem;
  border-radius: 1.1rem;
  background:
    radial-gradient(circle at 30% 30%, rgba(88, 166, 255, 0.24), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
  animation: vman-pulse 5s ease-in-out infinite, vman-glow 7s linear infinite;
}

.vman-mark svg {
  width: 2rem;
  height: 2rem;
  fill: none;
  stroke: url(#unused);
}

.vman-mark path:first-child {
  stroke: var(--blue);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.vman-mark path:last-child {
  stroke: var(--yellow);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.brand-copy {
  display: grid;
  gap: 0.15rem;
}

.brand-copy small {
  letter-spacing: 0.24em;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.72);
}

.brand-copy strong {
  position: relative;
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(2rem, 5vw, 3.4rem);
  letter-spacing: 0.03em;
}

.brand-copy strong::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.22) 40%, transparent 72%);
  transform: translateX(-130%);
  animation: wordmark-shimmer 8s ease-in-out infinite;
  pointer-events: none;
}

.history-chip-row,
.pill-group {
  gap: 0.5rem;
}

.history-chip.is-active,
.pill-button.is-active {
  color: #04111d;
  background: linear-gradient(135deg, var(--blue), var(--yellow));
}

.transform-card,
.profile-panel,
.empty-state {
  border-radius: 1.5rem;
}

@keyframes vman-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

@keyframes vman-glow {
  0% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 0 rgba(88,166,255,0.00); }
  50% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.10), 0 0 32px rgba(88,166,255,0.18); }
  100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 18px rgba(255,79,191,0.12); }
}

@keyframes wordmark-shimmer {
  0%, 100% { transform: translateX(-130%); }
  45%, 55% { transform: translateX(130%); }
}

@media (prefers-reduced-motion: reduce) {
  .vman-mark,
  .brand-copy strong::after,
  .aurora-wave {
    animation: none;
  }
}
```

- [ ] **Step 4: Run the tests to verify the new theme and motion behavior pass**

Run: `node --test tests/app.test.mjs`
Expected: PASS for the palette and reduced-motion assertions

- [ ] **Step 5: Commit the Aurora visual refresh**

```bash
git add styles.css tests/app.test.mjs
git commit -m "feat: add animated logo and aurora palette refresh"
```

### Task 6: Final Integration Pass, Smoke Checks, And Deployment-Ready Verification

**Files:**
- Modify: `app.js`
- Modify: `index.html`
- Modify: `styles.css`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Add the final regression tests for the integrated prototype surface**

```js
test("index.html exposes the optional calorie helper and profile recalculation CTA", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /id="calorie-helper"/);
  assert.match(html, /id="recalculate-profile"/);
});

test("index.html keeps manual log and scan CTAs after the layout refresh", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /Log meal/);
  assert.match(html, /Scan meal/);
  assert.match(html, /Meal timeline/);
});
```

- [ ] **Step 2: Run the full test suite before the final cleanup**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Start a local static server and run a manual smoke pass**

Run: `python3 -m http.server 4173`
Expected: `Serving HTTP on :: port 4173`

Check these flows in the browser:

```text
1. Header shows the animated V-Man plus CULT / FUEL LOG wordmark.
2. Clearing the calorie target leaves the field blank and the summary says "Set calorie target".
3. Today / Yesterday chips change the visible meals and heading state.
4. Profile opens from the bottom nav and recalculates both targets.
5. Manual log shows grouped Indian and global suggestions, and unmatched queries show the empty state.
6. Cult Transform card opens the external Cult link in a new tab.
7. Scan flow still allows editing detected item names before save.
```

- [ ] **Step 4: Commit the finished prototype upgrade**

```bash
git add app.js index.html styles.css tests/app.test.mjs src/logic/targets.js src/logic/day-log.js src/data/manual-catalog.js src/data/scan-catalog.js
git commit -m "feat: upgrade Cult Fuel Log prototype"
```

- [ ] **Step 5: Push the branch once review is complete**

```bash
git push origin HEAD
```
