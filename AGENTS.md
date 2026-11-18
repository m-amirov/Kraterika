# Kraterika — project instructions for Codex/agents

## Sources of truth and objective

Build **Кратерика**, an original 2D lunar logistics puzzle with functional colony building (approved direction B). Current G1 game design is [GDD](docs/GDD.md); detailed mechanics and exact acceptance IDs are in `docs/design/` and `docs/acceptance/REQUIREMENTS.md`. Read [PROJECT_STATUS](docs/PROJECT_STATUS.md) and actual `git status`/`HEAD` before starting. Distinguish approved owner decisions from **G1 DRAFT** proposals.

No unrelated novel/legacy-game migration, large refactor or framework replacement.

**Art direction approved (2026-11-18):** [Cozy Lunar Engineering](docs/art/ART_DIRECTION.md) / [Art Pack 0.1](docs/art/ART_PACK_0.1.md). Never silently substitute primitive flat placeholders for final art, mix incompatible cameras/styles, or treat concept screenshots as sprite sheets. Asset originals are not yet in Git; create separately structured, original, source-tracked game assets and verify them in Phaser/mobile before claiming acceptance.

## WFA integration (project-scoped, not globally enabled)

Pinned WFA revision and Skills: [toolchain](integrations/toolchain.json).
Game Production Pipeline: https://github.com/m-amirov/workflow-for-agents/blob/6c8d80d15155cd8ccfbd245fce9450f61b5133f3/playbooks/game-production.md

Use only needed Skills:
- `game-docs` to maintain GDD/acceptance; `gameplay-design` for core loop contract; `game-content-qa` for baseline→runtime/package completeness; `gameplay-playtesting` for actual human observations.
- `phaser-core` for verified Phaser 3 APIs; `game-ui-ux` for HUD/control states; `prototype-fast` only for a bounded throwaway proof.
- `regression-testing`, `browser-qa`, `visual-qa`, `production-art`, `release-verification` as task warrants.
- `codebase-exploration` and `git-workflow` for existing implementation and integration.

These are *routing instructions* until the actual WFA Skills are installed and activated. The script `scripts/install-wfa.ps1` checks pin/origin and supports local scoped installation. Never overwrite unmanaged Skills. No global Codex configuration or user home writes without explicit request.

## Engine boundaries

Game rendering: **Phaser 3**, TypeScript, Vite. Domain simulation must be deterministic, data-driven and independent of rendering/FPS. Ludory game manifest is `ludory.project.json`, compatible with its `defineGame` contract. Ludory Runtime+Phaser, Studio provenance and Connect SDKs are **not wired** by this bootstrap; follow [architecture](docs/architecture/STACK.md) and prove an isolated adapter integration before claiming them.

Do not invoke the existing **narrative-only** Ludory paired ZIP exporter for a generic Phaser game, and do not invent `ludory export`. WFA cannot override actual Ludory Core/Runtime/asset rights/SDK or project native gates.

## Engineering workflow

1. Scope tasks by G0–G7 and acceptance IDs, note direct/indirect effects on saves, assets, economy and controls.
2. Implement the smallest functional vertical unit. For bugs reproduce root cause, add deterministic regression and run affected checks.
3. Never mark complete from a file inventory, mock SDK, assertion that tests passed, static screenshot or imagined player review. Label PASS / FAIL / BLOCKED / NOT_RUN per real source-bound receipts. G1 is not accepted merely because docs exist.
4. Check fixed-step collision, pause/step/undo semantics, reward idempotence, build layout and touch controls. Keep external platform/publishing tests separate.
5. Main-first on active repo; if branch protection/PR review applies, use required PR and verify integration into origin/main. No force push, no copying secrets.
6. Update `docs/PROJECT_STATUS.md` on checkpoint with real commands, result, source SHA and next exact step; preserve accepted scope baseline, never silently cut missing content.

No independent publishing, live advertising, paid services, real user tracking, platform moderation or third-party art usage without separate authorization. Art must be original/verified and pass rights/pixel/runtime review. User priorities: quality, consistent visuals, no missing choices or images, desktop and mobile.
