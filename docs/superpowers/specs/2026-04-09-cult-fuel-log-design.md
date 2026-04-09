# Cult Fuel Log Design

Date: 2026-04-09
Status: Approved for planning
Product: Cult Fuel Log
Positioning: A new Cult-branded protein-first logging product built in the Aurora design language

## 1. Summary

Cult Fuel Log is a mobile-first protein tracker prototype that helps users hit their daily protein goals with minimal friction. The product centers on a high-impact hero dashboard, supported by guided onboarding, fast manual logging, AI-assisted meal scan flows, and lightweight recalculators for targets.

The prototype should feel like a fresh Cult product rather than a clone of Cult Peak. It should use Cult's Aurora principles verified from public Cult references: bold, energetic, immersive, intent-driven, glass-led, and motion-aware.

The MVP experience is a hybrid:

- Hero-first in presentation
- Flow-first in interaction quality

This means the dashboard is the visual centerpiece, while onboarding, manual logging, scan review, profile recalculation, and confirmation flows receive enough depth to feel believable and implementation-ready.

## 2. Product Goals

Primary goals:

- Make daily protein progress instantly visible
- Let users log common meals in under 15 seconds
- Reduce manual effort through recents, defaults, and meal scanning
- Help users understand and recalculate both protein and calorie targets
- Deliver a Cult-style premium product feel through Aurora UI

Success criteria:

- Protein consumed, goal, remaining, and completion are visible at all times on the main screen
- Manual logging is fast and dependable
- Scan flow feels magical but remains editable and trustworthy
- Protein and calorie targets can be suggested during onboarding and recalculated later in Profile
- The product feels distinctive, bold, and energetic rather than like a generic calorie tracker

## 3. Product Decisions Locked

- Product shape: prototype-first
- Experience structure: hero dashboard plus stronger guided flows
- Brand direction: new Cult product, not a direct Cult Peak clone
- Visual system: Cult Aurora-inspired
- Logo direction: animated V-Man plus wordmark
- Logo placement: compact icon beside `FUEL LOG`
- Logo motion: continuous but restrained loop
- Food coverage: mixed Indian and global
- Manual logging: production-grade nutrition database target
- Image scanning: real AI-assisted feature with editable, estimate-based results
- Calculators: protein and calorie calculators in onboarding and later in Profile
- Cult Transform: premium feature card linking out to `https://www.cult.fit/fitness/cult-transform`

## 4. Experience Principles

The experience should follow these principles:

1. Protein first
The user's main question is "How much protein have I hit today and what should I eat next?" The UI should answer that immediately.

2. Fast by default
The main logging paths should minimize typing through recents, common meals, suggested portions, and guided confirmations.

3. Trust through editability
The product should never trap the user inside opaque nutrition estimates. Scanned meals must remain editable before saving.

4. Premium energy
The visual system should feel immersive, athletic, and premium without becoming cluttered or aggressive.

5. Motivating, not judgmental
Copy should guide and encourage, not shame or medicalize.

6. Helpful calculators, not fake precision
Target recommendations should feel useful and understandable, while still staying editable and optional.

## 5. Information Architecture

The app should use a lightweight mobile-first structure:

- Today
- History
- Profile

The primary screen stack:

1. Onboarding / Goal Setup
2. Hero Dashboard
3. Manual Log Flow
4. Scan Meal Flow
5. Meal Review / Edit
6. Day History
7. Profile / Recalculate Targets

Navigation model:

- Bottom nav with `Today`, `History`, `Profile`
- `Log meal` and `Scan meal` stay highly visible on `Today`
- Day switching uses segmented chips: `Today`, `Yesterday`, `Calendar`
- Logging tasks open as full-screen overlays or stacked mobile screens
- After save, the user returns to `Today` and sees immediate progress updates

## 6. Core Screens

### 6.1 Onboarding / Goal Setup

Purpose:

- collect weight
- collect activity level
- collect goal type: maintain, lose, gain
- recommend protein goal
- recommend calorie goal when enough inputs are present

Required input model:

- weight
- goal type
- activity level
- sex
- age
- height

Behavior:

- Default values should feel helpful rather than demanding
- Recommended protein should be editable
- Recommended calorie target should be editable
- Calorie recommendation may remain blank if users skip the needed inputs
- The flow should feel guided and reassuring, not clinical

### 6.2 Hero Dashboard

Purpose:

- act as the emotional and functional center of the app

Required content:

- animated V-Man plus `CULT / FUEL LOG` wordmark
- protein hero ring or radial progress component
- consumed protein
- protein goal
- remaining protein
- percent complete
- calorie summary as secondary information
- clear suggested next action copy
- two primary CTAs: `Log meal` and `Scan meal`
- meal timeline for the current day

Example guidance copy:

- `24g left today`
- `A whey shake or paneer wrap gets you there`

### 6.3 Manual Log Flow

Purpose:

- provide a dependable and high-confidence logging path

Required interaction model:

- recent foods first
- frequent meals second
- search as the main full lookup method
- portion controls with serving and grams
- macro preview before save
- save to today with immediate dashboard update

The manual path should be positioned as the accuracy anchor of the product.

### 6.4 Scan Meal Flow

Purpose:

- provide the magical, low-friction logging path

Required interaction model:

- capture image or upload image
- return detected items
- return estimated portions
- return estimated protein, calories, carbs, and fats
- display confidence language
- allow edits to items and portions before save
- save result to today

The scan flow should be real AI-assisted, but its outputs should be framed as editable estimates rather than exact nutritional truth.

### 6.5 Meal Review / Edit

Purpose:

- let users fix mistakes without friction

Required actions:

- edit portion
- edit item names
- remove detected items
- delete meal
- optionally delete stored image when present

### 6.6 Day History

Purpose:

- help users review previous days and build confidence in the product

Required behavior:

- default to Today
- support Yesterday and calendar/date selection
- show meals with per-meal protein and calories
- show totals for the day

### 6.7 Profile / Recalculate Targets

Purpose:

- let users update their targets later without replaying full onboarding

Required behavior:

- show current protein target
- show current calorie target
- expose `Recalculate targets`
- allow editing or overriding both recommendations
- apply changes to dashboard immediately after confirmation

### 6.8 Cult Transform Feature Card

Purpose:

- provide a premium adjacent path into the broader Cult transformation offering

Required content:

- eyebrow: `Continue with Cult`
- title: `Go beyond logging with Cult Transform`
- short supporting copy about structured coaching and accountability
- 2 or 3 compact benefit points
- primary CTA linking to `https://www.cult.fit/fitness/cult-transform`

This should feel like a curated product extension, not an advertisement pasted into the page.

## 7. Key User Flows

### 7.1 Setup Flow

1. User opens app
2. User enters basics
3. App recommends protein target
4. App recommends calorie target when inputs are sufficient
5. User confirms or edits targets
6. User lands on Today dashboard

### 7.2 Manual Logging Flow

1. User taps `Log meal`
2. User picks recent/frequent item or searches
3. User selects portion
4. App shows macros
5. User confirms
6. Dashboard updates immediately

### 7.3 Scan Logging Flow

1. User taps `Scan meal`
2. User captures or uploads image
3. App returns detected items and macro estimates
4. User edits if needed
5. User confirms
6. Dashboard updates immediately

### 7.4 Daily Review Flow

1. User opens Today
2. User sees remaining protein
3. User checks the meal timeline
4. User edits a meal or adds another one

### 7.5 Recalculate Targets Flow

1. User opens Profile
2. User taps `Recalculate targets`
3. User updates weight, age, height, sex, activity, or goal
4. App returns updated protein and calorie recommendations
5. User accepts or edits them
6. Dashboard updates immediately

### 7.6 Cult Transform Referral Flow

1. User sees the Cult Transform card after daily summary
2. User reads the program positioning
3. User taps `Open in Cult app`
4. User is taken to `https://www.cult.fit/fitness/cult-transform`

## 8. Visual System

The visual style should follow Cult's Aurora principles verified from public Cult design references: bold, energetic, immersive, and intent-driven.

Visual direction:

- dark, high-contrast base surfaces
- black-led base with deep blue atmospheric shadows
- blue and yellow as the dominant aurora lights
- white for logo and text contrast
- pink used sparingly as an energy accent rather than a dominant glow
- glassmorphic panels and overlays
- large typography for protein numbers and calls to action
- generous negative space
- purposeful motion on progress, confirmation, transitions, and brand identity

The interface should feel:

- premium
- athletic
- modern
- focused

It should not feel:

- clinical
- spreadsheet-like
- bodybuilding-heavy
- generic wellness-app soft

### 8.1 Animated Logo System

Logo structure:

- compact V-Man icon on the left
- small `CULT` kicker
- bold `FUEL LOG` wordmark

Animation behavior:

- continuous loop
- subtle aurora glow pass through the V-Man
- very small pulse or breathing scale
- optional soft shimmer across the wordmark
- reduced-motion users receive a static or near-static version

Motion constraints:

- no spinning
- no bouncing
- no loud morphing
- no readability loss in the wordmark

The effect should feel alive, premium, and aurora-lit rather than flashy.

Note:

- the V-Man is a publicly described part of Cult's broader branding, but this implementation should use a clean, simplified product-safe version rather than assume access to a protected production asset

## 9. Content And Food Coverage

The prototype should reflect mixed Indian and global food behavior so the app feels market-relevant and aspirational.

Example foods and meals:

- paneer bowl
- dal chilla
- chicken curry rice
- egg wrap
- whey isolate
- Greek yogurt
- tofu salad
- grilled chicken sandwich

Search, recents, and scan examples should include both Indian and global foods side by side.

## 10. Data Model

### UserProfile

- weight
- height
- age
- sex
- activityLevel
- goalType
- proteinGoal
- calorieGoal
- storeMealImages

### DayLog

- date
- totalProtein
- totalCalories
- totalCarbs
- totalFats
- meals[]

### MealEntry

- id
- timestamp
- source
- name
- items[]
- totals
- optional imageUrl

### FoodItem

- name
- servingLabel
- grams
- protein
- calories
- carbs
- fats

### ScanResult

- detectedItems[]
- confidence
- edited
- finalTotals

## 11. Nutrition System Strategy

### 11.1 Manual Logging

Manual logging should target production-grade accuracy.

That implies:

- a real database-backed food search experience
- curated food coverage for Indian foods
- high-confidence macro values for manual entries
- support for custom foods and saved meals layered on top

In the product story, manual logging is the dependable path.

### 11.2 Image Scan Logging

Image scanning should be a real AI-assisted feature in this phase.

That implies:

- real meal-image analysis instead of a purely fake prototype response
- editable detected items
- editable portion estimates
- confidence communication
- save confirmation before the result becomes part of the log

In the product story, scan logging is the fast and magical path.

However, image scan should still be framed as estimate-based because:

- portion estimation from single images is inherently noisy
- mixed dishes are harder to quantify than packaged foods
- Indian foods often involve layered or combined preparations

Therefore the product must communicate that scan outputs are helpful estimates, not medical-grade nutritional facts.

### 11.3 Target Calculation Strategy

Protein target calculation should stay simple and quick:

- weight
- goal type
- activity level

Calorie intake calculation should be fuller and more explicit:

- sex
- age
- height
- weight
- activity level
- goal type

Recommended calorie logic should produce:

- maintenance calories
- suggested calorie target for lose / maintain / gain
- editable final target

The calorie calculator may be left incomplete or blank if users do not know the required inputs yet. In that case the app should avoid fake precision and defer calorie guidance until Profile or later setup.

## 12. Trust And Safety Boundaries

The app should be trustworthy without overclaiming.

Required trust behaviors:

- all scan results are editable before save
- scan results use soft confidence language
- scan results include `Estimates may vary`
- copy avoids medical or diagnostic claims
- the product focuses on practical daily guidance, not clinical nutrition advice

Out of scope claims:

- no medical-grade nutrition accuracy claims
- no body-composition diagnosis
- no prescriptive health outcomes

## 13. Error States And Edge Cases

Required states:

### No meals yet

- motivating empty dashboard
- clear first action CTA

### Scan uncertain

- lower-confidence result state
- prompt to edit items or portions

### Search no results

- offer recent foods
- offer frequent meals
- offer custom food creation

### Goal exceeded

- celebrate completion
- do not imply overconsumption is bad

### Permission denied

- offer upload fallback
- offer manual logging fallback

### Image storage disabled

- allow nutrition save without image persistence

### Calorie input unknown

- allow calorie target to remain blank
- keep protein visible as the primary metric
- prompt user to calculate or set calorie target later from Profile

## 14. MVP Scope

Included:

- goal setup with protein recommendation
- calorie intake calculator and editable calorie goal
- protein target calculator available during onboarding and later in Profile
- hero dashboard
- animated V-Man plus wordmark logo treatment
- manual logging with search and recents
- AI-assisted scan flow with editable estimates
- Cult Transform feature card
- day history
- meal edit and delete
- Aurora-aligned visual system

Excluded:

- advanced coaching plans inside Fuel Log
- streak systems
- social features
- wearables integration
- micronutrient depth beyond core macros

## 15. Prototype Delivery Expectations

The prototype should demonstrate:

- a clear Cult/Aurora visual signature
- protein-first daily clarity
- believable guided onboarding
- dependable manual logging
- impressive but honest AI-assisted scan flow
- helpful target calculation
- immediate progress feedback after every meal
- a premium, continuously animated brand lockup

The prototype should not require users to imagine the product. The core screens and transitions should be polished enough to feel pitch-ready and implementation-ready.

## 16. Technical Design Notes For Planning

Recommended build shape for implementation planning:

- mobile-first responsive web app
- local-first prototype state acceptable
- modular screen components
- reusable macro cards, meal cards, progress modules, calculator forms, and action sheets
- clear separation between food database logic, target-calculation logic, and image-scan logic

Suggested implementation slices:

1. app shell, animated logo, and Aurora design system
2. onboarding with protein and calorie calculators
3. dashboard and daily totals
4. manual logging flow
5. scan flow and editable review
6. Cult Transform card and referral section
7. history, profile, and target recalculation

## 17. Testing Expectations

The implementation plan should include:

- interaction tests for core flows
- state update checks for protein totals
- state update checks for calorie totals and recalculation
- empty/error/edit states
- responsive validation for mobile and desktop
- visual validation of Aurora hierarchy, motion restraint, and CTA clarity
- reduced-motion behavior for the animated logo

## 18. Open Decisions Deferred

These decisions should be left open for implementation planning rather than blocking the spec:

- exact nutrition data provider
- exact model/provider for image-based food detection
- image storage backend choice
- analytics stack details
- notification implementation details
- whether Cult Transform opens as web link or deep link when the Cult app is installed
