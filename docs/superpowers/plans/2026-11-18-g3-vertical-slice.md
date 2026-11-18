# Kraterika G3 Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать первый играбельный район «Первые огни» из CT-01..CT-06 в одной постоянно развивающейся колонии.

**Architecture:** Новый чистый домен кампании отделяет `PersistentWorld` от `MissionAttempt`, исполняет data-driven контракты фиксированными тактами и атомарно применяет first-clear результаты. Phaser-сцена только отображает домен и переводит реальные pointer/touch действия в команды; G2-R остаётся отдельным regression fixture.

**Tech Stack:** TypeScript 5.8, Phaser 3.90, Vite 6, Node test runner, Playwright browser smoke.

**Spec:** `docs/GDD.md`, `docs/design/CAMPAIGN_V2.md`, `docs/acceptance/REQUIREMENTS_V2.md`, пользовательское задание G3 от 2026-11-18.

## Global Constraints

- Одна постоянная колония; контракт — операция внутри неё.
- Детерминированный домен не импортирует Phaser, DOM, storage, wall clock или RNG.
- Persistent materials и attempt budget независимы; first-clear эффекты и награды идемпотентны.
- CT-01..06 последовательно открываются и имеют достижимую gold-трассу.
- G2-R не мигрирует автоматически и остаётся regression fixture.
- Daily, achievements, leaderboard SDK и production art остаются вне G3 runtime scope.

## Review Focus

- Повторная победа и reload не дублируют материалы, производство или постройки.
- Restart/повреждённый save не уничтожает persistent world и не продолжает running attempt.
- Два робота не занимают одну клетку; priority switch разрешает конфликт CT-06.
- Зарядка и манипулятор являются необходимыми state transitions, а не визуальными метками.
- Pointer/touch координаты вычисляются из актуального canvas rect после scroll/scale.

---

### Task 1: Domain foundation, contracts and progression

**Files:**
- Create: `src/game/campaign.ts`
- Create: `src/game/campaignContracts.ts`
- Test: `tests/campaign.test.mjs`

**Interfaces:**
- Produces: `createWorld()`, `startAttempt(world, contractId)`, `dispatchAttempt(attempt, command)`, `commitCompletion(world, attempt)`, `runSolutionTrace(contractId)`, `careerScore(world)`.

- [ ] Write failing domain tests for ordered unlocks, unique mechanics, deterministic traces, collisions, energy, arm transfer, medal monotonicity and six-step solvency.
- [ ] Run `node --experimental-strip-types --test tests/campaign.test.mjs` and record RED.
- [ ] Implement contract configs, attempt transitions, building production, economy and medals.
- [ ] Run focused tests and commit the verified domain slice.

### Task 2: Versioned campaign saves

**Files:**
- Create: `src/game/campaignSave.ts`
- Test: `tests/campaignSave.test.mjs`

**Interfaces:**
- Consumes: `PersistentWorld`, `MissionAttempt`.
- Produces: `serializeCampaignSave()`, `deserializeCampaignSave()`, `restoreCampaign()`, `saveCampaign()`.

- [ ] Write failing tests for corruption, schema mismatch, interrupted running attempt, aliasing and no G2-R migration.
- [ ] Implement bounded structural validation and safe fallback.
- [ ] Run focused save tests and commit.

### Task 3: Colony map, operation HUD and result flow

**Files:**
- Create: `src/ui/ColonyScene.ts`
- Create: `src/campaignMain.ts`
- Modify: `index.html`
- Create: `g2r.html`

**Interfaces:**
- Consumes: campaign domain/save APIs.
- Produces: colony/operation/result views, pointer/touch commands, pause/step/restart/replay and read-only `window.kraterikaCampaign` observation API.

- [ ] Preserve the current G2-R page at `g2r.html` and update its smoke URL only.
- [ ] Implement one Phaser colony map with visibly distinct module states and operation overlays.
- [ ] Bind real DOM/canvas actions to domain commands and save after committed transitions.
- [ ] Verify typecheck/build and G2-R regression tests.

### Task 4: Browser acceptance and evidence

**Files:**
- Create: `scripts/g3-browser-smoke.mjs`
- Modify: `scripts/yard-browser-smoke.mjs`
- Modify: `.github/workflows/browser-smoke.yml`

**Interfaces:**
- Produces: real desktop/mobile CT-01..06 action coverage, reload/replay proof, console-error check and screenshots.

- [ ] Drive every solution via visible controls and canvas pointer/touch actions.
- [ ] Check sequential unlocks, changed colony, save reload, replay idempotence, mobile overflow and coordinates.
- [ ] Save desktop/mobile screenshots and wire CI artifact upload.

### Task 5: Approved design status and G3 evidence

**Files:**
- Modify: `docs/GDD.md`
- Modify: `docs/PROJECT_STATUS.md`
- Modify: `docs/design/CAMPAIGN_V2.md`
- Modify: `docs/design/CAMPAIGN_CONTRACTS_V2.json`
- Modify: `docs/design/CORE_LOOP.md`
- Modify: `docs/design/COLONY.md`
- Modify: `docs/design/PRESENTATION.md`
- Modify: `docs/acceptance/REQUIREMENTS_V2.md`
- Modify: `docs/architecture/PROGRESSION_SAVES_V2.md`

**Interfaces:**
- Produces: one consistent `G1_DESIGN_APPROVED` decision record and honest G3 engineering/art/product gate status.

- [ ] Record owner approval dated 2026-11-18 without promoting G3-G7.
- [ ] Replace CT-01..06 null balance/medal/trace fields with source-backed implemented values.
- [ ] Record exact verification commands/results and remaining art/human-review gates.

### Task 6: Final verification and main integration

**Files:**
- Modify: only defects found by verification.

- [ ] Run `npm ci`.
- [ ] Run focused domain/save tests, `npm run check`, G2-R smoke and G3 browser smoke.
- [ ] Run `git diff --check`, inspect the complete diff and obtain independent review if available.
- [ ] Commit staged milestones to `main`, push without force, wait for required CI and verify exact `origin/main` SHA.
