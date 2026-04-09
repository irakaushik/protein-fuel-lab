# Cult Fuel Log Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a polished, mobile-first Cult Fuel Log prototype with Aurora styling, onboarding, manual logging, image-scan simulation, and a public GitHub Pages URL.

**Architecture:** Use a zero-build static web app so the prototype can ship quickly and deploy cleanly on GitHub Pages. Keep state local in the browser with a small ES module for goal logic, meal aggregation, seeded food data, and UI interactions, while exposing pure functions that Node tests can import directly.

**Tech Stack:** HTML, CSS, vanilla ES modules, Node built-in test runner, GitHub Pages

---

## File Structure

- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`
- Create: `package.json`
- Create: `tests/app.test.mjs`
- Modify: `.gitignore`
- Modify: `docs/superpowers/plans/2026-04-09-cult-fuel-log-prototype.md`

### Task 1: Scaffold The Static App Shell And Test Harness

**Files:**
- Create: `package.json`
- Create: `tests/app.test.mjs`
- Create: `app.js`
- Create: `index.html`

- [ ] **Step 1: Write the failing tests for core product logic and page structure**

```js
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/app.test.mjs`
Expected: FAIL because `app.js` and `index.html` do not exist yet.

- [ ] **Step 3: Add the minimal package metadata for local verification**

```json
{
  "name": "protein-fuel-lab",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/app.test.mjs"
  }
}
```

- [ ] **Step 4: Add the first-pass app module and HTML shell**

```js
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
  const lower = Math.round(weightKg * ((multiplier - 0.2) || 1.8));
  const upper = Math.round(weightKg * (multiplier + 0.2));

  return { target, rangeLabel: `${lower}-${upper}g protein/day` };
}

export function buildSeedMeals() {
  return [
    { name: "Paneer Power Bowl", protein: 42, calories: 460, carbs: 28, fats: 18, source: "manual" },
    { name: "Greek Yogurt Crunch", protein: 32, calories: 330, carbs: 24, fats: 9, source: "manual" },
    { name: "Chicken Curry Rice", protein: 38, calories: 540, carbs: 46, fats: 19, source: "scan" },
  ];
}

export function summarizeDay({ proteinGoal, calorieGoal, meals }) {
  const consumedProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const consumedCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

  return {
    consumedProtein,
    consumedCalories,
    remainingProtein: Math.max(proteinGoal - consumedProtein, 0),
    remainingCalories: Math.max(calorieGoal - consumedCalories, 0),
  };
}

export function suggestNextAction(remainingProtein) {
  return `${remainingProtein}g left today. A whey shake or paneer wrap gets you there.`;
}
```

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cult Fuel Log</title>
    <link rel="stylesheet" href="./styles.css">
  </head>
  <body>
    <main>
      <h1>Cult Fuel Log</h1>
      <nav>
        <button>Today</button>
        <button>History</button>
        <button>Profile</button>
      </nav>
      <section>
        <button>Log meal</button>
        <button>Scan meal</button>
      </section>
    </main>
    <script type="module" src="./app.js"></script>
  </body>
  </html>
```

- [ ] **Step 5: Run the tests to verify the shell passes**

Run: `node --test tests/app.test.mjs`
Expected: PASS

- [ ] **Step 6: Commit the scaffold**

```bash
git add package.json tests/app.test.mjs app.js index.html
git commit -m "feat: scaffold fuel log prototype"
```

### Task 2: Build The Aurora Dashboard And Onboarding Flow

**Files:**
- Modify: `index.html`
- Create: `styles.css`
- Modify: `app.js`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Write the failing tests for richer dashboard data and onboarding defaults**

```js
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/app.test.mjs`
Expected: FAIL because `progressPercent` and the stronger calculator behavior are not implemented yet.

- [ ] **Step 3: Expand the pure logic and build the real hero dashboard markup**

```js
const progressPercent = Math.min(100, Math.round((consumedProtein / proteinGoal) * 100));
return {
  consumedProtein,
  consumedCalories,
  remainingProtein: Math.max(proteinGoal - consumedProtein, 0),
  remainingCalories: Math.max(calorieGoal - consumedCalories, 0),
  progressPercent,
};
```

```html
<section class="hero-card">
  <p class="eyebrow">Aurora Performance Nutrition</p>
  <h1 class="hero-title">Cult Fuel Log</h1>
  <div class="ring" id="protein-ring"></div>
  <div class="cta-row">
    <button class="primary-action" id="open-manual-log">Log meal</button>
    <button class="secondary-action" id="open-scan-log">Scan meal</button>
  </div>
</section>
```

```css
:root {
  --bg: #07111a;
  --surface: rgba(10, 18, 28, 0.72);
  --surface-strong: rgba(13, 23, 36, 0.9);
  --text: #f7f4ee;
  --muted: #b8c2cc;
  --accent: #ff8f32;
  --accent-soft: #ffc86b;
  --teal: #43e7c5;
  --lime: #baff5d;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/app.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit the dashboard layer**

```bash
git add index.html styles.css app.js tests/app.test.mjs
git commit -m "feat: add aurora dashboard and onboarding"
```

### Task 3: Build Manual Logging, Scan Review, And Local Persistence

**Files:**
- Modify: `app.js`
- Modify: `index.html`
- Modify: `styles.css`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Write the failing tests for scan behavior and action copy**

```js
import { analyzeScanPreset } from "../app.js";

test("analyzeScanPreset returns editable beta scan data", () => {
  const result = analyzeScanPreset("power-thali");

  assert.equal(result.confidence, "High confidence");
  assert.equal(result.items[0].name, "Paneer tikka");
  assert.equal(result.totals.protein, 46);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/app.test.mjs`
Expected: FAIL because `analyzeScanPreset` does not exist yet.

- [ ] **Step 3: Implement the interaction layer**

```js
export function analyzeScanPreset(presetId) {
  const presets = {
    "power-thali": {
      confidence: "High confidence",
      items: [
        { name: "Paneer tikka", protein: 24, calories: 290 },
        { name: "Dal", protein: 12, calories: 180 },
        { name: "Jeera rice", protein: 10, calories: 230 },
      ],
    },
  };
  const preset = presets[presetId] ?? presets["power-thali"];
  const totals = preset.items.reduce(
    (sum, item) => ({
      protein: sum.protein + item.protein,
      calories: sum.calories + item.calories,
    }),
    { protein: 0, calories: 0 },
  );

  return { ...preset, totals };
}
```

Implementation details:

- store profile and meals in `localStorage`
- support onboarding modal, manual meal drawer, scan drawer, history chips, and profile toggle for image storage
- update the dashboard ring, remaining protein text, calories, and meal timeline after every add/edit action
- keep scan results editable before confirmation

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/app.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit the interaction layer**

```bash
git add app.js index.html styles.css tests/app.test.mjs
git commit -m "feat: add meal logging and scan flows"
```

### Task 4: Deploy To GitHub Pages And Verify The Public URL

**Files:**
- Modify: `.gitignore`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `app.js`

- [ ] **Step 1: Run the full verification suite before deployment**

Run: `node --test tests/app.test.mjs`
Expected: PASS

- [ ] **Step 2: Commit the final production-ready prototype**

```bash
git add .gitignore index.html styles.css app.js package.json tests/app.test.mjs
git commit -m "feat: ship cult fuel log prototype"
```

- [ ] **Step 3: Push the branch**

Run: `git push`
Expected: push succeeds with local branch tracking remote

- [ ] **Step 4: Enable GitHub Pages from `main` root**

Run:

```bash
$HOME/.local/bin/gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/irakaushik/protein-fuel-lab/pages \
  -f source[branch]=main \
  -f source[path]=/
```

Expected: GitHub Pages source configured

- [ ] **Step 5: Verify the live URL**

Run:

```bash
curl -I https://irakaushik.github.io/protein-fuel-lab/
```

Expected: `HTTP/2 200`
