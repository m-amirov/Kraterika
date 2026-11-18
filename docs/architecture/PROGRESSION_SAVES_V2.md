# Прогресс и платформенные адаптеры v0.2

**Статус:** `G1_DESIGN_APPROVED / G3_LOCAL_SAVE_IMPLEMENTED`. Версионированный local save v3 хранит persistent world, attempt и best medals; running attempt после reload восстанавливается на паузе, corruption fail-closed, G2-R автоматически не мигрирует. SDK/cloud/daily/achievements/leaderboard integration: **NOT_RUN**.

## Источники истины и события

**Domain-first:** Phaser управляет только отображением. Доменные события формируются после детерминированного тика или подтверждённого успешного контракта. Совокупный `PlayerProgressV3`:

| Поле | Правила |
| --- | --- |
| `schemaVersion: 3`, `campaignVersion: 2` | Разделить версии контента, сохранения и ядра |
| `clearedContracts: string[]` | Set по `CT-01..CT-30`; не восстанавливать по сумме материалов |
| `bestMedals: Record<CT-ID,0..3>` | Максимум по каждому ID, отсутствие=0; никогда не уменьшать при merge |
| `world` | Постоянные здания, разрешённые сектора, технологии, выбранная планировка, события активации |
| `attempt` | Отдельный slot для текущего CT ID, source SHA/версия rules, тики, роботы, груз, временный бюджет и журнал |
| `economy` | Материалы, список одноразовых first-clear reward IDs, резерв будущих обязательных зданий |
| `daily` | UTC день, выбранные quest IDs, event IDs/counters, claimed IDs и stamped day keys |
| `achievements` | Набор присвоенных ID, timestamps, косметические unlock IDs |
| `leaderboard` | Локальный career score, last submitted score, очередь `outbox`, статус SDK |
| `metadata` | last successful locally saved revision, cloud revision, content version, feature flags; **не использовать browser clock как доказательство ежедневной награды** |

**Согласование:** в рамках одной локальной попытки коммитить `contract.completed`, медаль, first-clear вознаграждение, world effect, daily progress и achievements как **одно новое immutable состояние** (атомарная запись localStorage snapshot с контрольной версией). Для облака хранить event IDs и reconciliation rules; чужой/cloud state считать недоверенным до структурной валидации.

## Граница постоянного и временного

- Контракт привязан к сектору единой карты, но перезапуск/проигрыш возвращает **только операцию** к корректному snapshot; здания и технологические решения, ранее подтверждённые успешной миссией, остаются.
- Предпросмотр строений/проводимых путей в попытке не списывает постоянные материалы до успешного однозначного коммита. Нельзя дублировать first-clear при другом имени attempt.
- Постоянные модули сохраняют координаты/состояния и **real functional effects**, иначе это декоративная карта. Будущие district streaming/multi-sector renderers читают одну модель мира.
- Не ломать ранее проверенные legacy LV01/LV02 и live-yard G2-R tests, но **не конвертировать** их state автоматически в `CT-01...`: прямого однозначного соответствия нет.

## Локальные и облачные сохранения

1. После каждого действия пользователя и важных доменных событий — save новой локальной версии. Разделить часто изменяемую attempt (локально) и компактную синхронизируемую campaign snapshot.
2. При доступной Yandex SDK сохранить авторизованный прогресс в `player.setData`. Документированные лимиты: **200 КБ** данных игрока, до **100 setData/5 мин**. Не отправлять полный snapshot через SDK на каждом 250 ms simulation tick. Гарантировать восстановление после refresh/ориентации за счёт локального snapshot; облако синхронизировать после достижения/контракта, при уходе из игры и по контролируемой очереди. При критичном save использовать `flush:true`, await результат и error UI; у `flush:false` Promise **не доказывает отправку**.
3. На двух устройствах объединять **монотонные множества** (firstClear IDs, bestMedals max, earned achievement IDs, stamped UTC days). Для mutable world/бюджета нужен conflict resolver по версиям состояния и подтверждённым транзакциям; **нельзя** складывать два баланса из разных snapshots. При нерешённом конфликте предложить восстановление/выбор, не тихо откатывать постройки.
4. При гостевой игре сохранять локально. После добровольной авторизации загружать cloud, мигрировать гостевой progress по правилам merge, не подменять cloud пустым локальным; не хранить платформенные приватные ID в публичных логах. Отказ авторизации не блокирует игру.
5. Локальные повреждения/старые schema/невыполненные миграции — fail closed с backup export/debug и понятным UI; не считать неизвестные ключи полученными достижениями/материалами. Не переносить историческую `kraterika:yard:g2r:v2` в сюжетные cleared contracts без явно утверждённой migration mapping.

**Source:** [Yandex player SDK](https://yandex.ru/dev/games/doc/ru/sdk/sdk-player), [save requirement 1.9](https://yandex.ru/dev/games/doc/ru/requirements/1/9), [auth requirement 1.2](https://yandex.ru/dev/games/doc/ru/requirements/1/2).

## Платформенные интерфейсы, без привязки доменной логики

Три абстракции:
- `TrustedCalendar` → `getUtcDayKey(): Promise<YYYY-MM-DD | Unavailable>`, источник Yandex `ysdk.serverTime()`; не делать награды по локальному времени при отсутствии надёжного источника.
- `ProgressStore` → `load / save / merge / status`; local guest, Yandex cloud adapter, будущий VK adapter после проверки **фактических** API.
- `LeaderboardPort` → `getEntries / getPersonalEntry / submitVerifiedBest / status`; Yandex native adapter + local-only fallback. Имя `submitVerifiedBest` отражает проверку **доменных условий**, а не защищённую серверную аутентификацию; без backend нельзя объявлять anti-cheat verified.

Никакой `window.ysdk` или платформенный SDK не должен находиться внутри детерминированного `yard.ts` / новых campaign domain modules. Ludory Core pin **не доказывает** готовность этих адаптеров; separate integration gate.

## Транзакция успешного контракта

`attempt.end → validate contract ID/steps & destination → evaluate medals → if firstClear: apply world unlock + materials once → update best medals → evaluate daily templates → unlock achievements → persist local snapshot → enqueue cloud save + leaderboard submit if score improved`.

В очереди на отправку содержатся `idempotencyKey` и `lastKnownScore`. Никакой отдельный UI клик «Забрать награду» не выдаёт новых ресурсов без проверенной транзакции. Если cloud/save/leaderboard API временно недоступны, **кампания продолжается**, локальный snapshot остаётся; UI не выдаёт «синхронизировано» без соответствующего подтверждения.

## QA и release gates

- Сохранения после каждого действия, поворота экрана, reload, при 2 вкладках, после logout/login, offline/online, 0KB / 200KB / quota exceeded.
- Дедупликация reward IDs и daily UTC stamped days, 30 отдельных medals, отсутствие двойного строительства, неотрицательные балансы, невозможность потерять обязательный сюжетный unlock.
- Медали, достижения, daily events и leaderboard score согласованы после локального rollback и cloud merge.
- Реальные SDK проверки на Яндекс Игр + платформенная Консоль и авторизация. VK Play/VK Игры — отдельный адаптер с собственными gates, нельзя копировать Yandex API без проверки.
- Нельзя объявлять G3/G6/релиз готовыми на одном лишь mock SDK, исходнике или симулированной таблице.
