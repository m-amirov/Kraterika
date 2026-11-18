> **G2-R — новая живая площадка.** Текущая главная сцена заменена: общая карта колонии, два ровера, настоящая зарядная площадка, манипулятор и функциональные здания. [Новый контракт и прохождение](docs/G2R_LIVE_YARD.md). Это техническая версия, визуальный Art Production и пользовательская приёмка ещё впереди. Старые LV-01/02 сохранены как регрессионные fixtures, а не образец новой игры.

# Кратерика

**2D логистическая головоломка + развитие лунной колонии** (вариант B).

Игрок доставляет грузы роботами, проектирует маршруты и переключатели, управляет механизмами во время детерминированной симуляции, получает материалы и строит функциональные модули базы. Название и направление утверждены; детали G1 — **DRAFT**.

**G2-R реализован как игровое ядро:** инженерная площадка из `src/game/yard.ts` и `src/ui/YardScene.ts`, приёмка взаимодействий мышью/касаниями и проверка сохранений выполняются отдельно. Прототип не равен G3: нет финальных спрайтов, полной экономики, остальных районов и SDK. [Текущий статус](docs/PROJECT_STATUS.md), [новый G2-R](docs/G2R_LIVE_YARD.md).

## Утверждённый арт-стиль

**Cozy Lunar Engineering / Art Pack 0.1** принят владельцем 18.11.2026. Три концепта: артборд, экран колонии и экран диспетчерской. Это художественные референсы, **не готовые Phaser-ассеты и не подтверждённые экранные сборки**. Подробности: [Art Direction](docs/art/ART_DIRECTION.md), [производственный список](docs/art/ART_PACK_0.1.md), [реестр SHA](docs/art/REFERENCE_MANIFEST.json), [Art QA](docs/art/ART_QA.md).

## Документация

- [Game Design Document](docs/GDD.md) — единственный индекс дизайна.
- [Игровой цикл](docs/design/CORE_LOOP.md) — fixed-step, маршруты, переключатели, манипулятор, пауза и откат.
- [Колония](docs/design/COLONY.md) — постройки, производство, материалы и защита от софтлока.
- [Миссии](docs/design/LEVELS.md) — LV-01..06 и будущая кампания.
- [Визуальный контракт](docs/design/PRESENTATION.md) — артконцепция, доступность и мобильный UI.
- [Acceptance matrix](docs/acceptance/REQUIREMENTS.md) — стабильные ID и фактические evidence-gates.
- [Проверки и ограничения](docs/VERIFICATION.md) — exact CI receipts, отдельные подтверждения WFA и Ludory Core.
- [WFA × Ludory × Phaser](docs/architecture/STACK.md) — источники истины, допустимые интеграции и ограничения.

## Запуск локального каркаса

Требуется **Node.js 22+**; доступ к npm для установки зависимостей.

~~~bash
git clone https://github.com/m-amirov/Kraterika.git
cd Kraterika
npm ci
npm run check
npm run dev
~~~

Откройте локальный URL Vite. Главная сцена — **единая лунная площадка G2-R**, а не старые LV01/02. Выберите «Путь» и достройте клетку (6,4); поставьте «Зарядку» в (5,4), «Кран» в (8,3), «Купол» в (8,2). Сделайте два шага, переключите центральную стрелку (4,4), ещё шесть шагов и нажмите «Передать детали». Оранжерея и мастерская перейдут в рабочее состояние. Подробности — [G2-R](docs/G2R_LIVE_YARD.md). `npm run check` и CI browser-smoke обязательны, но не заменяют ручную оценку игры и визуала.

Зависимости закреплены в `package-lock.json`, полученном из успешного GitHub Actions npm-resolution; `npm ci` проверяется отдельным CI на exact HEAD.

## WFA: локальная проектная установка Codex Skills

Проектные инструкции уже находятся в [AGENTS.md](AGENTS.md). Для реального импорта Skills нужен **отдельный локальный checkout WFA** на точно указанном [SHA](integrations/toolchain.json):

~~~powershell
git clone https://github.com/m-amirov/workflow-for-agents.git ../workflow-for-agents
git -C ../workflow-for-agents checkout 6c8d80d15155cd8ccfbd245fce9450f61b5133f3
./scripts/install-wfa.ps1 -WfaCheckout ../workflow-for-agents
# Изучите dry-run и возможные конфликты. Затем:
./scripts/install-wfa.ps1 -WfaCheckout ../workflow-for-agents -Apply
~~~

Установщик не меняет глобальные Skills и не удаляет чужие. `AGENTS.md` действует отдельно от фактической установки. После `-Apply` надо проверить, что Codex действительно активирует необходимые Skills; этот шаг ещё **NOT_RUN**.

## Ludory: совместимый проектный manifest и проверка Core

`ludory.project.json` соответствует Core schema v1 для `id=kraterika`, `engine=phaser`, `targets=yandex-games,vk-games`. Для проверки настоящим `@ludory/core`:

~~~powershell
git clone https://github.com/m-amirov/ludory.git ../ludory
git -C ../ludory checkout 933c73b195eaf3bfffd12a31ab1cbadb27989eea
node scripts/verify-ludory.mjs --ludory ../ludory
~~~

**Не путать:** manifest Core-compatible ≠ Studio trusted scaffold ≠ подключённый Runtime Phaser ≠ собранный Yandex/VK SDK ZIP. В текущем Ludory общий экспорт Phaser-проектов не подтверждён. Задача отдельного integration gate описана в [архитектуре](docs/architecture/STACK.md). Исходники Ludory и WFA не копируются и не модифицируются.

## Контроль качества и разработка

GitHub Actions: [quality.yml](.github/workflows/quality.yml). Для разработки читать [GDD](docs/GDD.md), [AGENTS.md](AGENTS.md) и [PROJECT_STATUS](docs/PROJECT_STATUS.md), сначала принять обновлённый G2-R, затем переходить к настоящему Art Production и G3. Не считать наличие файла уровнем, импорт картинки готовой графикой или локальную сборку разрешением публикации.

Никаких реальных SDK-реклам, IAP, внешней модерации, публикации или прав на чужую графику на этом этапе.
