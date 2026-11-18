# Кратерика

**2D логистическая головоломка + развитие лунной колонии** (вариант B).

Игрок доставляет грузы роботами, проектирует маршруты и переключатели, управляет механизмами во время детерминированной симуляции, получает материалы и строит функциональные модули базы. Название и направление утверждены; детали G1 — **DRAFT**.

**G2 FIRST PLAYABLE подтверждён:** две реально проходимые миссии (LV-01/02), строительство пути, переключение развилки, пауза/шаг/повтор и одноразовые материалы. Это **технический greybox**, не G3: нет манипулятора, строительства базы, финальных спрайтов и SDK. [Статус](docs/PROJECT_STATUS.md), [доказательства G2](docs/G2_FIRST_PLAYABLE.md).

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

Откройте локальный URL Vite. В LV-01 достройте два участка трассы и запустите доставку. В LV-02 нажмите **«Шаг» дважды**, дождитесь, пока первый робот покинет стрелку, переключите развилку нажатием и продолжите. `npm run check` выполняет доменные тесты и TypeScript/Vite; [реальный Chromium smoke](https://github.com/m-amirov/Kraterika/actions/runs/44285741577) проверил desktop и mobile emulation. Это не приёмка физического телефона, визуала или платформенного ZIP.

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

GitHub Actions: [quality.yml](.github/workflows/quality.yml). Для разработки читать [GDD](docs/GDD.md), [AGENTS.md](AGENTS.md) и [PROJECT_STATUS](docs/PROJECT_STATUS.md), продолжать G3 после подтверждённого G2 с LV-01 и LV-02. Не считать наличие файла уровнем, импорт картинки готовой графикой или локальную сборку разрешением публикации.

Никаких реальных SDK-реклам, IAP, внешней модерации, публикации или прав на чужую графику на этом этапе.
