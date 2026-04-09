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

test("index.html includes Cult brand treatment and illustration hooks", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /aria-label="Cult brand"/);
  assert.match(html, /aurora-illustration/);
  assert.doesNotMatch(html, /Aurora design language/);
  assert.doesNotMatch(html, /circle cx="78" cy="90" r="46"/);
  assert.doesNotMatch(html, /circle cx="236" cy="76" r="58"/);
  assert.doesNotMatch(html, /path d="M86 219c24-48 49-86 77-114 15-14 35-29 60-45"/);
  assert.doesNotMatch(html, /circle cx="218" cy="94" r="18"/);
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
