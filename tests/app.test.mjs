import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  analyzeScanPreset,
  calculateProteinGoal,
  buildSeedMeals,
  summarizeDay,
  suggestNextAction,
} from "../app.js";
import {
  calculateCalorieTarget,
  normalizeCalorieGoal,
} from "../src/logic/targets.js";
import {
  filterMealsByDay,
  formatDayKey,
} from "../src/logic/day-log.js";
import {
  manualSections,
  searchManualMeals,
} from "../src/data/manual-catalog.js";
import {
  createScanDraft,
  scanPresetIds,
} from "../src/data/scan-catalog.js";

test("calculateProteinGoal recommends a higher target for muscle gain", () => {
  const result = calculateProteinGoal({
    weightKg: 72,
    goalType: "gain",
    activityLevel: "active",
  });

  assert.equal(result.target, 158);
  assert.match(result.rangeLabel, /144-173g/);
});

test("seed meals include mixed Indian and global foods", () => {
  const meals = buildSeedMeals();
  const mealNames = meals.map((meal) => meal.name);

  assert.ok(mealNames.includes("Paneer Power Bowl"));
  assert.ok(mealNames.includes("Greek Yogurt Crunch"));
});

test("summarizeDay totals protein and calories", () => {
  const summary = summarizeDay({
    proteinGoal: 160,
    calorieGoal: 2200,
    meals: buildSeedMeals().slice(0, 2),
  });

  assert.equal(summary.consumedProtein, 74);
  assert.equal(summary.remainingProtein, 86);
  assert.equal(summary.consumedCalories, 790);
});

test("suggestNextAction recommends a practical protein top-up", () => {
  const message = suggestNextAction(24);
  assert.match(message, /24g left today/);
});

test("index.html contains the primary product CTAs", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /Cult Fuel Log/);
  assert.match(html, /Log meal/);
  assert.match(html, /Scan meal/);
  assert.match(html, /Today/);
});

test("index.html includes illustration hooks and no old cult.fit chip header", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /aurora-illustration/);
  assert.doesNotMatch(html, /Aurora design language/);
  assert.doesNotMatch(html, /cult-brand-fit/);
  assert.doesNotMatch(html, /Protein-first tracker/);
});

test("index.html does not include the old Aurora performance eyebrow", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.doesNotMatch(html, /Aurora Performance Nutrition/);
});

test("calculateProteinGoal supports intense training with a stronger target", () => {
  const result = calculateProteinGoal({
    weightKg: 80,
    goalType: "maintain",
    activityLevel: "intense",
  });

  assert.equal(result.target, 176);
  assert.match(result.rangeLabel, /160-192g/);
});

test("summarizeDay returns completion percentage", () => {
  const summary = summarizeDay({
    proteinGoal: 180,
    calorieGoal: 2400,
    meals: buildSeedMeals(),
  });

  assert.equal(summary.progressPercent, 62);
});

test("analyzeScanPreset returns editable beta scan data", () => {
  const result = analyzeScanPreset("power-thali");

  assert.equal(result.confidence, "High confidence");
  assert.equal(result.items[0].name, "Paneer tikka");
  assert.equal(result.totals.protein, 46);
  assert.equal(result.disclaimer, "Estimates may vary");
});

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

test("index.html contains the animated Cult Fuel Log logo shell", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /id="cult-fuel-logo"/);
  assert.match(html, /class="vman-mark"/);
  assert.match(html, /FUEL LOG/);
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
