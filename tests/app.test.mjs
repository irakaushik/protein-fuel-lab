import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
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
