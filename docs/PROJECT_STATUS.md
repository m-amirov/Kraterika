# Kraterika — durable project checkpoint

**Last design update:** 2026-11-18
**Current production gate:** G1 — design/architecture bootstrap, **DRAFT / NOT ACCEPTED**.
**Repository:** https://github.com/m-amirov/Kraterika
**Game/source SHA:** check live `origin/main`; do not trust this file as HEAD.
**Approved owner decisions:** название «Кратерика», вариант B — логистика и функциональное строительство. Остальные числа/технические решения пока рабочие предложения G1.

## Stage status

| Gate | Status | Evidence / blocker |
| --- | --- | --- |
| G0 — Concept | DECISION_RECORDED | Название и направление подтверждены в обсуждении; официальный проектный game-brief см. GDD |
| G1 — Design | DRAFT | GDD, gameplay, colony, levels, art, acceptance & architecture; owner acceptance NOT_RUN |
| G2 — First playable | NOT_RUN | Нет доказанного замкнутого игрового цикла/сквозного прохождения |
| G3 — Vertical slice | NOT_RUN | Нет 6 реально проходимых уровней/3 функциональных зданий/арт-пакета |
| G4 — Content complete | NOT_RUN | Нет approved baseline и runtime/package proof |
| G5 — Beta/player QA | NOT_RUN | Нет реальных человеческих плейтестов и browser evidence |
| G6 — Release candidate | NOT_RUN | Generic Phaser candidate builder/rights check не выполнены |
| G7 — Platform acceptance | BLOCKED | Требуются внешняя приёмка и отдельное разрешение владельца; публикация не разрешена |

## Integration status

- WFA main pinned `6c8d80d15155cd8ccfbd245fce9450f61b5133f3`; AGENTS/bootstrap prepared; project-scoped install verified only in disposable CI runner [44277904079](https://github.com/m-amirov/Kraterika/actions/runs/44277904079). User-machine install and real Codex activation: **NOT_RUN**.
- Ludory main pinned `933c73b195eaf3bfffd12a31ab1cbadb27989eea`; real Core schema accepted in [CI 44277904079](https://github.com/m-amirov/Kraterika/actions/runs/44277904079). Studio native provenance / Runtime Phaser POC / Connect: **NOT_RUN**.
- Phaser/Vite scaffold and committed npm lockfile: `npm ci`, 6 contract tests, TypeScript/Vite and manifest parity verified by [CI 44277904210](https://github.com/m-amirov/Kraterika/actions/runs/44277904210) on `9b7a064`. This is not a playable game or browser acceptance. See [bootstrap evidence](VERIFICATION.md).
- Art and audio assets: **NOT_CREATED**. No rights claim.

## Next precise actions (after owner G1 acceptance)

1. Read [bootstrap evidence](VERIFICATION.md), pin actual current HEAD, rerun CI on changes and verify local WFA Skills activation in Codex before coding.
2. Implement minimal domain tick and collision reservation with deterministic replay tests. Make LV-01/02 playable using actual input and win/lose/retry.
3. In isolated disposable environment prove Ludory Runtime Phaser adapter viability; do not mutate Ludory or claim native export coverage without evidence.
4. Implement 6 mission traces and workshop/greenhouse gates; after real runtime screenshot QA and player sessions proceed through G3/G4/G5.

## Recovery instruction

Inspect actual git status and live HEAD, read `docs/GDD.md` and acceptance matrix, then select minimal WFA Skills. Replay stale/failed tests after edits. Never continue from a synthetic «PASS» or overwrite approved scope to match implementation.
