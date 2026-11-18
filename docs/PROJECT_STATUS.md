# Kraterika — durable project checkpoint

**Last design update:** 2026-11-18
**Current production gate:** **G2 ENGINEERING_VERIFIED / PRODUCT_REJECTED**. Previous LV-01/LV-02 passed exact-SHA code/browser checks, but owner rejected their resemblance to «Небесная почта» on 2026-11-18. G2-R product redesign PROPOSED; G1 design revision required. G3–G7 not closed.
**Repository:** https://github.com/m-amirov/Kraterika
**Game/source SHA:** check live `origin/main`; do not trust this file as HEAD.
**Approved owner decisions:** название «Кратерика», вариант B — логистика и функциональное строительство; **Cozy Lunar Engineering / Art Pack 0.1** visual concept approved 2026-11-18. Remaining gameplay numbers and engine details are still G1 DRAFT.

## Stage status

| Gate | Status | Evidence / blocker |
| --- | --- | --- |
| G0 — Concept | DECISION_RECORDED | Название и направление подтверждены в обсуждении; официальный проектный game-brief см. GDD |
| G1 — Design | PARTIAL / DRAFT | Art Direction approved by owner; GDD gameplay, colony, levels, acceptance & architecture not yet fully accepted |
| G2 — First playable | FIRST_PLAYABLE_VERIFIED | Engineering smoke only at LV-01/LV-02. **PRODUCT_REJECTED** by owner 2026-11-18, new [G2-R](design/GAMEPLAY_RESET_2026-11-18.md) NOT_RUN. Previous [Quality](https://github.com/m-amirov/Kraterika/actions/runs/44285741527) / [Chromium](https://github.com/m-amirov/Kraterika/actions/runs/44285741577) evidence retained |
| G3 — Vertical slice | NOT_RUN | Нет 6 реально проходимых уровней/3 функциональных зданий/арт-пакета |
| G4 — Content complete | NOT_RUN | Нет approved baseline и runtime/package proof |
| G5 — Beta/player QA | NOT_RUN | Нет реальных человеческих плейтестов и browser evidence |
| G6 — Release candidate | NOT_RUN | Generic Phaser candidate builder/rights check не выполнены |
| G7 — Platform acceptance | BLOCKED | Требуются внешняя приёмка и отдельное разрешение владельца; публикация не разрешена |

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

1. **G2-R gameplay correction first:** replace separate abstract delivery-level feel with an integrated live lunar engineering scene, 2 robots, meaningful charging/manipulator/building decisions. Reconcile GDD, run real end-to-end browser and get product review. See [reset](design/GAMEPLAY_RESET_2026-11-18.md).
2. **Then Art Production 0.1:** create individual high-quality game assets around the corrected game topology using approved Cozy Lunar Engineering and supplied screenshot; require source image bytes, runtime screenshots and QA.
3. G3: add manipulator, LV-03..06, workshop/greenhouse colony building loop, production art, responsive/browser visual QA and human player study.
4. G4 content completeness only against an owner-approved requirements baseline; G6/G7 requires actual package/rights/portal authorization.

## Recovery instruction

Inspect actual git status and live HEAD, read `docs/GDD.md` and acceptance matrix, then select minimal WFA Skills. Replay stale/failed tests after edits. Never continue from a synthetic «PASS» or overwrite approved scope to match implementation.
