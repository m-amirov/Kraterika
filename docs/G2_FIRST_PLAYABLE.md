# G2 — First Playable: exact play contract

**Status: FIRST_PLAYABLE_VERIFIED** for LV-01/LV-02 at code SHA `59ce030c690b59520c6437049c01c0546f02c69f`, with real domain tests, build and headless browser proof. **Not G3 / Art Production 0.1 / physical-device QA.**

## What players can actually do

1. Open the game in a mobile or desktop browser. LV-01 is open, LV-02 is locked until LV-01 completion.
2. LV-01: tap the two highlighted gaps (cells **(3,3)** and **(4,3)**); each tap changes the real set of traversable cells. If the player taps a constructed tile again during planning, it removes that segment and refunds one build slot. Click **Запустить** or use **Шаг**.
3. Robots advance at deterministic **250 ms ticks**. If a segment is missing, movement stops at the edge and no energy is spent while waiting. Click **Повтор**, fix the plan, and try again. Real delivery at the destination yields **WIN** and **8** materials once.
4. LV-02: first robot carries **water** to northern delivery at (4,1), second carries **oxygen** to eastern delivery at (7,4). The switch at (4,4) starts facing north. Use **Шаг** twice so robot R-01 moves onto and then off the switch; tap the switch to turn east, use remaining steps/Play to finish. Avoid fast reaction requirements: the player can leave the simulation paused indefinitely.
5. First successful LV-02 completion yields **9** materials once, total **17** from both missions. Reloading from the same browser preserves which missions were completed and their earned materials. Replays do not award money again.
6. A game goal is satisfied only when each cargo reaches the **matching destination**, not when the robot merely moves. Invalid build/switch command reports an error and leaves the state intact.

## Controls and limitations

- Mouse/touch input on game grid; action buttons below it; keyboard **Space** (play/pause), **Shift+S** (single step), **R** (restart with confirmation).
- Route construction is **preparation-only**, while switch toggling works during plan/pause/execution (applies on next tick).
- The simulation prevents double-cell reservations, head-on swaps and occupied-cell moves; WAIT does not drain batteries.
- First-playable intentionally lacks **undo/rewind**, manipulator, buildings, full colony economy, most missions, saved in-progress simulation, art assets and platform SDK. These remain G3+; do not silently mark as satisfied.
- Browser storage is best-effort localStorage; if unavailable, gameplay still works but the UI explicitly warns that campaign progress is not persistent.

## Test mapping

| Requirement | Automated coverage |
| --- | --- |
| GP-001 deterministic tick | repeated replay pure-state test |
| GP-002 actual route placement + invalid placement | domain unit + browser canvas pointer/touch |
| GP-003 active player switch | domain test + browser canvas click |
| GP-005 collision reservation | same target / swap / stationary blocker tests |
| GP-007 correct delivery + replay | LV-01/LV-02 unit solutions + browser full run |
| ECO-001 first-clear, progression | browser reload/replay/no duplicate reward |
| UX-001 basic mouse/touch controls | Playwright Chromium desktop/mobile emulation |

Execution:
- Node 22: `npm ci && npm run check`
- Browser: built output `dist/`, Chrome + Playwright; `node scripts/browser-smoke.mjs` after CI-only dependency setup.
- Actual CI at exact code SHA: [Quality 44285741527](https://github.com/m-amirov/Kraterika/actions/runs/44285741527) **16/16 PASS + build**; [Chromium gameplay smoke 44285741577](https://github.com/m-amirov/Kraterika/actions/runs/44285741577) **G2_BROWSER_SMOKE_VERIFIED**, desktop LV01/LV02 mouse/step/switch/win, mobile emulated touch LV01/win, reload and idempotent rewards, zero JS errors; [WFA/Ludory 44285741512](https://github.com/m-amirov/Kraterika/actions/runs/44285741512) SUCCESS. Screen captures in run artifact `g2-browser-screenshots`.

**Boundaries:** automated Chromium emulation is not a physical device test, human player test, or confirmation of art quality. G3+ stays **NOT_RUN**, G7 publication **BLOCKED**.
