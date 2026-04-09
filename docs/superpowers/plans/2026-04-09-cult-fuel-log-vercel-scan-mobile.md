# Cult Fuel Log Vercel Scan And Mobile Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a more mobile-friendly Cult Fuel Log with swipe rails, a broader common-Indian manual meal catalog, and a real camera/gallery meal-scan flow backed by a Vercel API.

**Architecture:** Keep the static Aurora frontend, but add a lightweight Node-based local dev server plus a Vercel `/api/scan` function for production. Implement mobile swipe behavior with CSS scroll snap and tiny client-side rail state, and expand the meal catalog through structured section data rather than hardcoded UI strings.

**Tech Stack:** Vanilla HTML/CSS/JS, Node.js, Vercel Functions, OpenAI Responses API, Node test runner

---

### Task 1: Add the backend and local runtime shape

**Files:**
- Create: `api/scan.js`
- Create: `server.mjs`
- Create: `src/server/scan-handler.js`
- Modify: `package.json`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
test("package.json exposes a local dev server script for scan API work", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

  assert.equal(pkg.type, "module");
  assert.equal(pkg.scripts.dev, "node server.mjs");
});

test("index.html exposes a real scan upload flow instead of preset-only selection", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /Use camera/);
  assert.match(html, /Upload from gallery/);
  assert.match(html, /id="scan-file-input"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/app.test.mjs`
Expected: FAIL because the dev script and scan upload controls do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```js
// package.json
{
  "scripts": {
    "dev": "node server.mjs",
    "test": "node --test tests/app.test.mjs"
  }
}
```

```js
// src/server/scan-handler.js
export async function handleScanRequest({ imageBase64, mimeType, apiKey, fetchImpl, model = "gpt-4o" }) {
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      body: { error: "Scan API is not configured." },
    };
  }

  // The final implementation should call OpenAI Responses API and normalize the result.
}
```

```js
// api/scan.js
import { handleVercelScanRequest } from "../src/server/scan-handler.js";

export default {
  async fetch(request) {
    return handleVercelScanRequest(request);
  },
};
```

```js
// server.mjs
// Serve static files and POST /api/scan locally so frontend work can run outside Vercel.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/app.test.mjs`
Expected: PASS for the new runtime/upload tests.

- [ ] **Step 5: Commit**

```bash
git add package.json server.mjs api/scan.js src/server/scan-handler.js tests/app.test.mjs index.html
git commit -m "feat: add local and Vercel scan runtime"
```

### Task 2: Replace preset-only scan selection with camera/gallery upload and real review state

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `src/data/scan-catalog.js`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
test("index.html includes scan image preview and upload action controls", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /id="scan-image-preview"/);
  assert.match(html, /id="open-camera-scan"/);
  assert.match(html, /id="open-gallery-scan"/);
  assert.match(html, /id="scan-status-copy"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/app.test.mjs`
Expected: FAIL because the scan sheet still renders presets only.

- [ ] **Step 3: Write the minimal implementation**

```html
<!-- index.html -->
<div class="scan-upload-actions">
  <button class="secondary-action" id="open-camera-scan" type="button">Use camera</button>
  <button class="secondary-action" id="open-gallery-scan" type="button">Upload from gallery</button>
  <input id="scan-file-input" type="file" accept="image/*" hidden>
</div>
<div class="scan-image-shell" id="scan-image-shell">
  <img id="scan-image-preview" alt="Selected meal preview">
</div>
<p id="scan-status-copy">Upload a meal image to analyze protein and calories.</p>
```

```js
// app.js
// Track selected scan image, upload state, backend result, and errors.
// Replace preset click handling with file selection + POST /api/scan.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/app.test.mjs`
Expected: PASS for upload-flow UI tests.

- [ ] **Step 5: Commit**

```bash
git add index.html app.js styles.css src/data/scan-catalog.js tests/app.test.mjs
git commit -m "feat: add real scan upload flow"
```

### Task 3: Expand the manual catalog to common Indian meals across regions

**Files:**
- Modify: `src/data/manual-catalog.js`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/app.test.mjs`
Expected: FAIL because the catalog only contains a handful of Indian entries.

- [ ] **Step 3: Write the minimal implementation**

```js
// src/data/manual-catalog.js
export const manualSections = [
  { id: "north-indian", title: "North Indian staples", items: [/* ... */] },
  { id: "south-indian", title: "South Indian meals", items: [/* ... */] },
  { id: "west-indian", title: "West Indian meals", items: [/* ... */] },
  { id: "east-indian", title: "East Indian meals", items: [/* ... */] },
  { id: "frequent-global", title: "Frequent global meals", items: [/* ... */] },
  { id: "quick-protein", title: "Quick protein", items: [/* ... */] },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/app.test.mjs`
Expected: PASS with broader Indian coverage and existing search behavior intact.

- [ ] **Step 5: Commit**

```bash
git add src/data/manual-catalog.js tests/app.test.mjs
git commit -m "feat: expand Indian manual meal catalog"
```

### Task 4: Make dense card groups swipeable on mobile

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `app.js`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
test("index.html includes swipe rail dots for profile, log meal, and support sections", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /data-rail="profile"/);
  assert.match(html, /data-rail="log-meal"/);
  assert.match(html, /data-rail="support"/);
  assert.match(html, /data-rail-dots="profile"/);
});

test("styles.css enables mobile swipe rails with scroll snap", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(css, /scroll-snap-type: x mandatory/);
  assert.match(css, /scroll-snap-align: start/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/app.test.mjs`
Expected: FAIL because the mobile rails do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```html
<!-- index.html -->
<div class="profile-card-grid swipe-rail" data-rail="profile">...</div>
<div class="rail-dots" data-rail-dots="profile"></div>
```

```css
@media (max-width: 900px) {
  .swipe-rail {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 88%;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
  }

  .swipe-rail > * {
    scroll-snap-align: start;
  }
}
```

```js
// app.js
// Bind scroll listeners to swipe rails and update dot state.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/app.test.mjs`
Expected: PASS for swipe-rail coverage.

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css app.js tests/app.test.mjs
git commit -m "feat: add mobile swipe rails"
```

### Task 5: Verify and run the upgraded app locally

**Files:**
- Modify: `package.json`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Run the full regression suite**

Run: `node --test tests/app.test.mjs`
Expected: PASS with all tests green.

- [ ] **Step 2: Run the local app server**

Run: `npm run dev`
Expected: local static app plus `/api/scan` available on a local port.

- [ ] **Step 3: Smoke-check the app root**

Run: `curl -I http://127.0.0.1:4173/`
Expected: `HTTP/1.1 200 OK`

- [ ] **Step 4: Smoke-check the scan API**

Run: `curl -i http://127.0.0.1:4173/api/scan`
Expected: `405` or `400` on bad method/body, proving the endpoint exists.

- [ ] **Step 5: Commit**

```bash
git add package.json app.js index.html styles.css src/data/manual-catalog.js src/server/scan-handler.js api/scan.js server.mjs tests/app.test.mjs
git commit -m "feat: ship mobile-first scan and meal upgrades"
```
