# Cult Fuel Log Palette Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the leftover orange-heavy UI treatment with the approved black, blue, yellow, white, and pink Aurora palette while making the page feel cleaner and more intentional.

**Architecture:** Keep the existing static app structure and interaction logic intact. Limit this pass to view-layer updates in `index.html`, `styles.css`, and narrow copy/test adjustments so the live prototype looks cleaner without changing product behavior.

**Tech Stack:** HTML, CSS, vanilla ES modules, Node built-in test runner

---

## File Structure

- Modify: `index.html`
- Modify: `styles.css`
- Modify: `tests/app.test.mjs`

### Task 1: Lock The Palette In Tests

**Files:**
- Modify: `tests/app.test.mjs`

- [ ] **Step 1: Write the failing test for the approved palette direction**

```js
test("index.html no longer references the old aurora kicker", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.doesNotMatch(html, /Aurora design language/);
});
```

- [ ] **Step 2: Run the tests to verify the new expectation fails**

Run: `node --test tests/app.test.mjs`
Expected: FAIL because the old header kicker is still present.

- [ ] **Step 3: Keep the test in place as a regression guard**

No additional code in this step beyond the test itself.

- [ ] **Step 4: Run the tests after implementation to verify the guard passes**

Run: `node --test tests/app.test.mjs`
Expected: PASS

### Task 2: Replace Orange-Led Visual Tokens With The Approved Palette

**Files:**
- Modify: `styles.css`
- Modify: `index.html`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Write the failing test for brand treatment and illustration hooks**

```js
test("index.html keeps Cult brand treatment and illustration hooks", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /aria-label="Cult brand"/);
  assert.match(html, /aurora-illustration/);
});
```

- [ ] **Step 2: Run the tests to verify the suite captures the current UI state**

Run: `node --test tests/app.test.mjs`
Expected: FAIL only on the old kicker test until implementation is complete.

- [ ] **Step 3: Replace the main CSS tokens and glow system**

Key implementation targets:

```css
:root {
  --bg: #020409;
  --bg-deep: #050814;
  --surface: rgba(8, 14, 24, 0.82);
  --surface-strong: rgba(8, 12, 22, 0.94);
  --text: #f7f8fb;
  --muted: #9fb0c8;
  --blue: #3f7cff;
  --blue-soft: #78a6ff;
  --yellow: #ffd84d;
  --pink: #ff4fa3;
}
```

Replace:
- orange-led page glows
- orange-led hero ring gradients
- orange-led illustration strokes
- orange-led button fill with blue/yellow-led treatment and pink accent only where needed

- [ ] **Step 4: Clean the header and hero hierarchy**

Update `index.html` so:
- the Cult wordmark stays
- the extra `Aurora design language` header line is removed
- the hero feels less noisy and more balanced

- [ ] **Step 5: Run the test suite to verify the restyle passes**

Run: `node --test tests/app.test.mjs`
Expected: PASS

### Task 3: Clean Up The Manual Log Visual Hierarchy

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

- [ ] **Step 1: Simplify the manual log sheet presentation**

Implementation targets:
- reduce visual clutter in the sheet header
- make option cards easier to scan
- ensure preview card uses the new palette cleanly
- keep `Log meal` and `Scan meal` CTAs obvious without over-glowing

- [ ] **Step 2: Verify the app still serves locally**

Run: `python3 -m http.server 4173`
Then run: `curl -I -s http://localhost:4173/ | head -n 1`
Expected: `HTTP/1.0 200 OK`

- [ ] **Step 3: Run the full tests again**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit the cleanup**

```bash
git add index.html styles.css tests/app.test.mjs docs/superpowers/plans/2026-04-09-cult-fuel-log-palette-cleanup.md
git commit -m "feat: clean up Cult Fuel Log palette"
```
