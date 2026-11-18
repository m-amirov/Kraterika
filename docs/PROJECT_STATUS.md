# Kraterika — durable project checkpoint

**Last design update:** 2026-11-18 (`G1_DESIGN_APPROVED`; G3 implementation checkpoint)
**Current production gate:** **G3_ENGINEERING_VERIFIED / ART_OR_PRODUCT_GATE_PENDING**. CT-01..CT-06 pass deterministic domain, economy, save, desktop mouse and mobile touch runs locally on implementation baseline `d1e598b9deff4936ee25d8d673f5462e299ab5d2`. Production art, independent visual acceptance and human product playtest remain pending; G4–G7 are not promoted.
**Repository:** https://github.com/m-amirov/Kraterika
**Game/source SHA:** check live `origin/main`; do not trust this file as HEAD.
**Approved owner decisions:** название «Кратерика», вариант B, **Cozy Lunar Engineering / Art Pack 0.1**, GDD v0.2: 30 контрактов/5 районов, persistent colony, daily, 22 achievements и один career leaderboard — approved 2026-11-18. Approval is design scope, not proof that daily/achievement/SDK/art/runtime beyond CT-01..06 exists.

## Stage status

| Gate | Status | Evidence / blocker |
| --- | --- | --- |
| G0 — Concept | DECISION_RECORDED | Название и направление подтверждены в обсуждении; официальный проектный game-brief см. GDD |
| G1 — Design | G1_DESIGN_APPROVED | Owner decision 2026-11-18; [GDD v0.2](GDD.md), 30 CT, daily, 22 achievements, one career leaderboard |
| G2 — First playable | FIRST_PLAYABLE_VERIFIED | Engineering smoke only at LV-01/LV-02. **PRODUCT_REJECTED** by owner 2026-11-18, new [G2-R](design/GAMEPLAY_RESET_2026-11-18.md) NOT_RUN. Previous [Quality](https://github.com/m-amirov/Kraterika/actions/runs/44285741527) / [Chromium](https://github.com/m-amirov/Kraterika/actions/runs/44285741577) evidence retained |
| G2-R — Live Yard | ENGINEERING_VERIFIED / PRODUCT_REVIEW_PENDING | [Unit/build 44304280512](https://github.com/m-amirov/Kraterika/actions/runs/44304280512), [Chromium 44304280297](https://github.com/m-amirov/Kraterika/actions/runs/44304280297); owner visual/gameplay acceptance NOT_RUN |
| G3 — Vertical slice | ENGINEERING_VERIFIED / ART_OR_PRODUCT_GATE_PENDING | CT-01..06, persistent world, functional buildings, economy, medals, v3 local save and real browser mouse/touch verified; production art and human review pending |
| G4 — Content complete | NOT_RUN | Реализованы только 6/30 контрактов; content/package proof отсутствует |
| G5 — Beta/player QA | NOT_RUN | Есть engineering browser evidence, но нет реальных человеческих плейтестов |
| G6 — Release candidate | NOT_RUN | Generic Phaser candidate builder/rights check не выполнены |
| G7 — Platform acceptance | BLOCKED | Требуются внешняя приёмка и отдельное разрешение владельца; публикация не разрешена |

## G1 v0.2 approved design and G3 runtime boundary

- **Story:** 5 connected lunar districts, **30 planned contracts** CT-01..CT-30, permanent world changes, 1–3 medals after real per-contract calibration; [design](design/CAMPAIGN_V2.md), [registry](design/CAMPAIGN_CONTRACTS_V2.json). Current G2-R prototype is **not** CT-01..06.
- **Daily:** after CT-02 exactly 3 UTC-day tasks from 12 templates with unlocked skill gating. 2/3 completion grants one cosmetic daily stamp, optional and not campaign-critical. [Specs](design/DAILY_QUESTS.md).
- **Achievements:** 22 unique event-triggered optional milestones; no duplicate awards or pay-to-win effects. [Specs](design/ACHIEVEMENTS.md).
- **Leaderboard:** one casual all-time Yandex `kraterika_mastery_v1`, score `100 * Σ(bestMedal)` in 0..9000; requires actual SDK/portal setup and voluntary authorization to publish, anti-cheat not proven without backend. [Specs](design/LEADERBOARDS.md).
- **Saves and platform:** proposed versioned campaign/attempt/daily/achievement saves, UTC serverTime, Yandex player data/cloud; [architecture](architecture/PROGRESSION_SAVES_V2.md). SDK integration, console setup, leaderboard and daily runtime **NOT_RUN**.
- **Balance:** CT-01..06 calibrated below; CT-07..30 remain `null / NOT_CALIBRATED`. Outdated 22/32 and G2-R 20/9 values are not campaign balance.
- **Scope:** G3 implements only the first district. Daily, achievement award runtime, cloud/platform leaderboard, production art, human acceptance and CT-07..30 remain open.

### First chapter economy and gold references

| Contract | Permanent cost | First-clear reward | Attempt budget | Balance after clear | Gold reference: ticks / spent / energy |
| --- | ---: | ---: | ---: | ---: | --- |
| CT-01 | 4 | 8 | 3 | 16 | 3 / 1 / 3 |
| CT-02 | 0 | 7 | 4 | 23 | 3 / 1 / 4 |
| CT-03 | 6 | 9 | 6 | 26 | 6 / 4 / 5 |
| CT-04 | 12 | 10 | 7 | 24 | 4 / 5 / 4 |
| CT-05 | 14 | 12 | 9 | 22 | 3 / 7 / 3 |
| CT-06 | 8 | 14 | 5 | 28 | 6 / 1 / 10 |

All six references replay through `dispatchAttempt`; every result is gold, collision-free and independent of wall clock/FPS. Prefix solvency starts at 12 materials and requires no replay farm, daily, achievement, ad or purchase.

## G3 implementation and local verification

- Pure domain: `src/game/campaign.ts`, data-driven scenarios/traces: `src/game/campaignContracts.ts`, versioned fail-closed save: `src/game/campaignSave.ts`.
- Product entrypoint: `index.html` + `src/campaignMain.ts` + Phaser `src/ui/ColonyScene.ts`; G2-R moved to built `g2r.html` regression entry.
- Colony consequences: dispatch/distribution/power/workshop/greenhouse/district become operational in order; workshop produces 2 components, greenhouse 2 food; CT-06 refuses to start unless both are operational.
- Construction lifecycle is visible in the domain, operation HUD and colony map: locked → available → built → waiting for resources → operational.
- Verified receipt for implementation baseline `d1e598b9`: six gold contracts on desktop mouse and mobile 390×844 touch, reload, CT-06 replay without duplicate reward, construction-state and contract-card text geometry, 0 console/page errors. Exact-source CI: [quality 44331530898](https://github.com/m-amirov/Kraterika/actions/runs/44331530898), [browser 44331530645](https://github.com/m-amirov/Kraterika/actions/runs/44331530645), [WFA/Ludory preflight 44331530789](https://github.com/m-amirov/Kraterika/actions/runs/44331530789), [screenshots 14441005261](https://github.com/m-amirov/Kraterika/actions/runs/44331530645/artifacts/14441005261).

## Current G2-R implementation — new main scene

- Implemented separate deterministic live-yard domain `src/game/yard.ts`, browser state validation/storage in `src/game/yardSave.ts`, Phaser 2.5D greybox scene `src/ui/YardScene.ts`, UI controller `src/yardMain.ts` and regression entry `g2r.html`.
- On one shared lunar station map: two rovers and independent cargo orders, functioning route construction, switch, charging pad, manipulator with manual cargo hand-off, functional workshop and player-built greenhouse. Water turns greenhouse on and exposes next food contract, parts switch workshop on; not just fake counter animations.
- Sandbox build budget: 20; route 1, charger 3, arm 4, dome 6. Staged first-clear reward flag 9 separately. These costs are G2-R test values, not the finalized G3 economy.
- Added domain tests including regression for charging resume, exact game state after win, lack of progress when equipment/building missing, invalid actions and undo cost; added Chromium gameplay smoke via real pointer/touch in `scripts/yard-browser-smoke.mjs`.
- [Real browser G2-R smoke 44304280297](https://github.com/m-amirov/Kraterika/actions/runs/44304280297) **SUCCESS** on exact code SHA `bec9d303`: desktop mouse and mobile 390×844 emulated touch both completed every build/route/charge/transfer/greenhouse/workshop interaction, restored saves after reload and verified first-clear reward idempotence; no page/console errors. [Screenshots artifact](https://github.com/m-amirov/Kraterika/actions/runs/44304280297/artifacts/14427765921). [Quality 44304280512](https://github.com/m-amirov/Kraterika/actions/runs/44304280512): **32/32 tests + TypeScript/Vite build SUCCESS**. [WFA/Ludory preflight 44304280342](https://github.com/m-amirov/Kraterika/actions/runs/44304280342): SUCCESS, still only Ludory Core and ephemeral Skill installation.
- **Root-cause fix during browser QA:** using live `getBoundingClientRect()` for client→canvas mapping rather than Phaser pointer coordinates which omitted horizontal scroll; mobile interaction is source-bound and regression tested by browser smoke. Other issues fixed: charging status not cleared on next tick, missing HUD DOM target, and deterministic browser step race.
- All source/art documents preserved; game remains **procedural 2.5D greybox**, no approved shipping sprites and no native SDK integration. Product/user acceptance still NOT_RUN. See [G2-R](G2R_LIVE_YARD.md).

## Critical product feedback — 2026-11-18

- User rejected the **gameplay and composition**, not merely the temporary graphics: too close to a previous «Небесная почта» project, lacks integrated active colony and engineering decisions visible on supplied screenshot.
- Actual visual/gameplay reference: [image metadata and SHA](art/REVIEW_REFERENCE_2026-11-18.json); full image exists only in the user conversation and has **NOT** been committed to the repo.
- Proposed correction and testable G2-R gates: [GAMEPLAY_RESET_2026-11-18](design/GAMEPLAY_RESET_2026-11-18.md). Product experience NOT approved; user’s expectation and rejection are confirmed, precise replacement mechanics are hypotheses.
- **Hold Art Production 0.1 for old G2:** no expensive sprites or art replacement on the wrong mechanics, old greybox tests are useful simulation regressions only. Real production art should target new integrated board/colony design.

## G2 exact-source implementation and proof

**Executable code SHA:** `59ce030c690b59520c6437049c01c0546f02c69f`. All three GitHub Actions workflows completed SUCCESS on this SHA:

- [Quality 44285741527](https://github.com/m-amirov/Kraterika/actions/runs/44285741527): `npm ci`, **16/16 tests**, TypeScript/Vite build, manifest parity.
- [Browser smoke 44285741577](https://github.com/m-amirov/Kraterika/actions/runs/44285741577): actual desktop pointer-built LV-01, step/switch LV-02 and both wins; emulated mobile 390×844 touch-built LV-01 and win; persistent first-clear rewards and reload replay do not duplicate materials. No JavaScript/console errors. Actual screenshots uploaded as `g2-browser-screenshots` (artifact ID `14418653566`); no claim of independent visual-art QA.
- [WFA / Ludory 44285741512](https://github.com/m-amirov/Kraterika/actions/runs/44285741512): WFA project install in disposable CI and Ludory Core manifest only; **not** Runtime Phaser or SDK proof.

Actual game logic: `src/game/simulation.ts`; missions: `src/game/missions.ts`; real pointer/touch scene: `src/ui/PlayScene.ts`; controls, first-clear persistence: `src/main.ts`; test contract: [G2_FIRST_PLAYABLE.md](G2_FIRST_PLAYABLE.md).

**Boundary:** G2 is a deliberately visible technical greybox. Approved [Art Direction](art/ART_DIRECTION.md) remains mandatory, not replaced by final flat primitives. Buildings, arm, 4 further levels, real assets, game-state save/rewind, native SDK export, human tests and physical devices: NOT_RUN.

## Integration status

- WFA main pinned `6c8d80d15155cd8ccfbd245fce9450f61b5133f3`; AGENTS/bootstrap prepared; project-scoped install verified only in disposable CI runner [44277904079](https://github.com/m-amirov/Kraterika/actions/runs/44277904079). User-machine install and real Codex activation: **NOT_RUN**.
- Ludory main pinned `933c73b195eaf3bfffd12a31ab1cbadb27989eea`; real Core schema accepted in [CI 44277904079](https://github.com/m-amirov/Kraterika/actions/runs/44277904079). Studio native provenance / Runtime Phaser POC / Connect: **NOT_RUN**.
- Phaser G2 real gameplay at exact code SHA `59ce030c`: 16/16 tests plus built Phaser and desktop/mobile-emulated Chromium gameplay, verified in [Quality](https://github.com/m-amirov/Kraterika/actions/runs/44285741527) and [Browser](https://github.com/m-amirov/Kraterika/actions/runs/44285741577). See [G2 evidence](G2_FIRST_PLAYABLE.md) and [bootstrap evidence](VERIFICATION.md).
- Art direction is **ART_DIRECTION_APPROVED**, with three concept PNGs registered by exact hash in [art manifest](art/REFERENCE_MANIFEST.json); they are stored as conversation attachments, **not** in Git and **not** importable Phaser sprites. Runtime art, art QA, source rights clearance and audio: **NOT_RUN / NOT_CREATED**.

## Next precise actions

1. **Owner/human playtest G3**: проверить понятность целей, три класса решений и ощущение единой растущей колонии; инженерный smoke это не заменяет.
2. **Art Production 0.1** для G3 live-world layout из оригинальных source-tracked assets, independent visual/pixel/rights review.
3. **Plan CT-07..12** только после продуктовой обратной связи; не копировать шесть операций механически.
4. **Separate social SDK gates:** trusted serverTime, guest/cloud, daily idempotence, achievement events, leaderboard console + voluntary auth.
5. G4–G7 only after content QA, real players, SDK proof, rights verification and owner authorization; publication is not approved.

## Recovery instruction

Inspect actual git status and live HEAD, read `docs/GDD.md` and acceptance matrix, then select minimal WFA Skills. Replay stale/failed tests after edits. Never continue from a synthetic «PASS» or overwrite approved scope to match implementation.
