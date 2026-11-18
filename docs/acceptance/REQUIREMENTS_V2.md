# Acceptance Matrix v0.2 — после переработки GDD

**Статус:** `DESIGN_DRAFT / OWNER_APPROVAL_NOT_RUN`. Это **предлагаемый** baseline, не формально утверждённый G4 content contract. Исторические исходные требования и инженерные G2/G2-R receipts остаются в [REQUIREMENTS.md](REQUIREMENTS.md); данные старого прототипа не считаются выполнением v0.2.

**Источники:** [GDD](../GDD.md) · [30 контрактов](../design/CAMPAIGN_V2.md) · [daily](../design/DAILY_QUESTS.md) · [achievements](../design/ACHIEVEMENTS.md) · [leaderboards](../design/LEADERBOARDS.md) · [state/SDK](../architecture/PROGRESSION_SAVES_V2.md).

| ID | Priority | Проверяемое требование | Необходимое доказательство | Status |
| --- | --- | --- | --- | --- |
| CAM-001 | MUST | Все 30 уникальных CT-01..CT-30 определены в пяти районах без дублей и циклов | G1 registry structural checks | DESIGN_ONLY |
| CAM-002 | MUST | Контракт исполняется в секторе постоянно развивающейся колонии, не в отдельном пустом мире | G3 browser gameplay, world map and scene transition | NOT_RUN |
| CAM-003 | MUST | CT-01..CT-06 реально проходимы, каждый с минимум одним solver solution trace | G3 exact SHA unit+browser trace | NOT_RUN |
| CAM-004 | MUST | Открытие района зависит от сюжетных контрактов, daily/achievements не блокируют | G3 domain unlock tests | NOT_RUN |
| CAM-005 | MUST | Повтор миссии не повторяет first-clear worldEffect и материал | G3 reload/duplicate action tests | NOT_RUN |
| CAM-006 | MUST | Перманентные здания и транспорт влияют на физические контракты и производственные цепочки | G3 domain+render, screenshot before/after | NOT_RUN |
| CAM-007 | MUST | В каждом районе новые задачи комбинируют механики, а не только увеличивают длину трассы | G4 content coverage + human playtest | NOT_RUN |
| ECO-101 | MUST | Первичный сюжетный прогресс достижим без daily, наград, рекламы и покупки | Prefix-solver and 30-step economy invariants | NOT_RUN |
| ECO-102 | MUST | Временный бюджет попытки отделён от постоянного материала; fail/restart без софтлока | G3 atomic commit, economy tests | NOT_RUN |
| MED-001 | MUST | 1–3 медали с нормативами для каждого реально реализованного контракта; старые результаты не падают | Medal solver exact trace, best-move replay | NOT_RUN |
| MED-002 | MUST | Нельзя получить медаль по FPS/скорости кликов; нет фиктивного золота при null limits | Domain + rate invariance tests | NOT_RUN |
| DAY-001 | MUST | После CT-02 показывать три daily задания из доступных механик | UI+registry tests, blocked tool negative | NOT_RUN |
| DAY-002 | MUST | UTC-date определяется trusted time; изменение часов не даёт второй день | Trusted UTC boundary tests, clock tamper | NOT_RUN |
| DAY-003 | MUST | Засчитывать только уникальные успешные event IDs; 2/3 дают максимум 1 штамп на дату | Idempotent claims, replay, concurrent saves | NOT_RUN |
| DAY-004 | MUST | Daily и косметика не обязательны для глав/экономики; без trusted time игра продолжает работать | No-auth/offline flows and full campaign reachability | NOT_RUN |
| ACH-101 | MUST | 22 achievement IDs уникальны; каждому есть однозначный достижимый trigger | Registry coverage and event binding tests | DESIGN_ONLY |
| ACH-102 | MUST | Нельзя получить достижение из неудачной операции/двойного события | Unit, reload, replay tests | NOT_RUN |
| ACH-103 | MUST | Полученные достижения сохраняются guest/cloud; нет платных обязательных наград | Local/cloud merge and UI screenshot | NOT_RUN |
| LB-101 | MUST | Глобальный mastery: 100*sum(best medals), score 0..9000, replay monotonic | Unit golden cases incl 1300/9000, cloud merge | NOT_RUN |
| LB-102 | MUST | Рейтинг можно посмотреть без обязательного входа; публикация только по явной авторизации | Real auth and guest browser tests | NOT_RUN |
| LB-103 | MUST | SDK exact names, созданный portal leaderboard, 404/offline/rate limits | Yandex SDK real portal receipt + mock negative | NOT_RUN |
| LB-104 | MUST | Не обещать anti-cheat/server-trusted scoring в client-only версии; без призов | Threat model review and UI/marketing QA | DESIGN_ONLY |
| SAVE-101 | MUST | Версионированное сохранение CT/world/medals/daily/achievements, restore after reload/rotation | Real browser + storage and cloud merge | NOT_RUN |
| SAVE-102 | MUST | Гостевой прогресс не теряется при входе; конфликт кошельков не суммируется | Guest→Yandex authenticated merge QA | NOT_RUN |
| ART-101 | MUST | Утверждённый Cozy Lunar Engineering реально в Phaser, арт файлы и права, 2.5D на мобильном | Art pack, runtime images, physical device and archive | NOT_RUN |
| SDK-101 | MUST | Yandex serverTime/player cloud/leaderboards adapter не попадает в domain; VK отдельно | SDK lifecycle/browser and static architecture | NOT_RUN |
| QA-101 | MUST | Human playtest: 3 класса решений и постоянный рост колонии понятны, а не старый clone | Real participant observations on exact build | NOT_RUN |
| REL-101 | MUST | Вся кампания и социальные возможности проходят G4–G7, без ложных PASS | Runtime/package/content rights + actual owner approval | NOT_RUN |

## Этапы сдачи

- **G1 Revision:** пройти owner review новых правил (30 уровней, первичные/повторные награды, косметические daily, 22 достижения, публичный рейтинг), зафиксировать каждую правку. Все три новые системы пока **проектные**, не работающие.
- **G3 Vertical slice:** CT-01..06 + 3 функциональных здания, перманентный мир, локальное save/restore, первые реальные медали. Daily может начать работу только при проверенном доверенном времени; SDK leaderboard с реальной публикацией позже, но интерфейсную архитектуру не блокировать.
- **G4 Content completeness:** source-bound контракт для *утверждённого* объёма и реально достижимых уровней, включая повтор, валюту и условия. Файловые JSON без runtime не «content complete».
- **G5 User QA:** реальные сессии новичков, понятно ли почему надо строить базу, честны ли daily/medals/achievements, не воспринимается ли новая игра клоном старой.
- **G6 Platform integration:** настоящие save/cloud/day/leaderboard вызовы в реальной платформенной сборке, art rights и bundle verification; no-server leaderboard threat model остаётся открытым ограничением.
- **G7 Owner release:** без согласия и фактических portal checks не заявлять «релиз готов».

## Запрещённые ложные PASS

`GDD file exists` ≠ `CAM-001 runtime pass`; `30 records exist` ≠ `30 levels playable`; `achievement registry exists` ≠ `award unlocked in game`; `yt leaderboard docs` ≠ `registered real leaderboard`; `mock serverTime` ≠ `verified UTC reward`; `CI green` ≠ `human user accepted gameplay`.

Прежние подтверждённые G2-R механики сохраняются как инкрементальные доказательства *части* функций и тестируемая основа, не как свидетельство реализации CAMPAIGN_V2, ежедневных заданий и рейтинга.
