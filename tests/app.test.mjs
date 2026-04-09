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
  assert.match(html, /LOG MEAL/);
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

test("manualSections cover common Indian meals across regions", () => {
  const titles = manualSections.map((section) => section.title);
  const names = manualSections.flatMap((section) => section.items.map((item) => item.name));

  assert.ok(titles.includes("North Indian staples"));
  assert.ok(titles.includes("South Indian meals"));
  assert.ok(titles.includes("West Indian meals"));
  assert.ok(titles.includes("East Indian meals"));
  assert.ok(names.includes("Poha"));
  assert.ok(names.includes("Idli Sambar"));
  assert.ok(names.includes("Rajma Chawal"));
  assert.ok(names.includes("Misal Pav"));
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
  assert.match(html, /class="brand-logo-image"/);
  assert.match(html, /FUEL LOG/);
});

test("index.html uses Cult's public header logo asset in the brand lockup", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /vman-and-white-cult-text/);
  assert.doesNotMatch(html, /brand-symbol-svg/);
});

test("index.html includes profile recalculation and Cult Transform sections", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /id="profile-panel"/);
  assert.match(html, /Recalculate targets/);
  assert.match(html, /Cult Transform/);
  assert.match(html, /https:\/\/www\.cult\.fit\/fitness\/cult-transform/);
});

test("index.html includes Cult Personal Training support beside Cult Transform", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /Cult Personal Training/);
  assert.match(html, /1:1 trainer support/);
  assert.match(html, /https:\/\/support\.cult\.fit\/support\/solutions\/articles\/25000019211-how-to-book-a-personal-training-session-/);
});

test("index.html includes real scan upload controls and preview hooks", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /Use camera/);
  assert.match(html, /Upload from gallery/);
  assert.match(html, /id="scan-file-input"/);
  assert.match(html, /id="scan-image-preview"/);
  assert.match(html, /id="scan-status-copy"/);
});

test("index.html includes mobile day chips and bottom nav targets", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /id="day-filter"/);
  assert.match(html, /data-day-key="today"/);
  assert.match(html, /data-nav-target="history"/);
  assert.match(html, /data-nav-target="profile"/);
});

test("buildSeedMeals provides timestamped entries across today and yesterday", () => {
  const now = new Date("2026-04-09T12:00:00.000Z");
  const meals = buildSeedMeals(now);
  const dayKeys = meals.map((meal) => formatDayKey(new Date(meal.timestamp)));

  assert.ok(dayKeys.includes("2026-04-09"));
  assert.ok(dayKeys.includes("2026-04-08"));
});

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

test("styles.css enables mobile swipe rails with scroll snap", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(css, /scroll-snap-type: x mandatory/);
  assert.match(css, /scroll-snap-align: start/);
  assert.match(css, /\.swipe-rail/);
});

test("index.html exposes the optional calorie helper and profile recalculation CTA", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /id="calorie-helper"/);
  assert.match(html, /id="recalculate-profile"/);
});

test("index.html keeps manual log and scan CTAs after the layout refresh", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /Log from pre-defined list/);
  assert.match(html, /Scan meal/);
  assert.match(html, /Meal timeline/);
});

test("index.html removes the old crossing hero illustration strokes over the progress ring", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.doesNotMatch(html, /id="hero-line"/);
  assert.doesNotMatch(html, /M86 219c24-48 49-86 77-114/);
});

test("index.html keeps the right-side hero illustration minimal and free of extra decorative strokes", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.doesNotMatch(html, /M90 250c24 14 48 21 73 21 40 0 74-10 110-31/);
  assert.doesNotMatch(html, /M96 102c11-14 23-24 39-33/);
  assert.doesNotMatch(html, /M207 74c18 10 33 24 45 42/);
  assert.doesNotMatch(html, /circle cx="230" cy="214" r="30"/);
});

test("index.html exposes the clearer sectioned information architecture", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, />MY PROFILE</);
  assert.match(html, />LOG MEAL</);
  assert.match(html, />MY TRACK</);
  assert.match(html, />NUTRITION SUPPORT</);
});

test("index.html makes the calculators and logging options explicit", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /Protein calculator/);
  assert.match(html, /Calorie calculator/);
  assert.match(html, /Log from pre-defined list/);
  assert.match(html, /Option to scan/);
});

test("index.html includes swipe-rail hooks for profile, log meal, and support sections", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /data-rail="profile"/);
  assert.match(html, /data-rail="log-meal"/);
  assert.match(html, /data-rail="support"/);
  assert.match(html, /data-rail-dots="profile"/);
  assert.match(html, /data-rail-dots="log-meal"/);
  assert.match(html, /data-rail-dots="support"/);
});

test("package.json exposes a local dev server script for scan API work", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

  assert.equal(pkg.type, "module");
  assert.equal(pkg.scripts.dev, "node server.mjs");
});
