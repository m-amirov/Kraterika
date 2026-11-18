# Кратерика

**2D логистическая головоломка + развитие лунной колонии** (вариант B).

Игрок доставляет грузы роботами, проектирует маршруты и переключатели, управляет механизмами во время детерминированной симуляции, получает материалы и строит функциональные модули базы. Название и направление утверждены; детали G1 — **DRAFT**.

**Сейчас в репозитории — GDD, рабочие правила и технический Phaser-каркас. Это НЕ игровая альфа:** нет проходимых миссий, настроенной экономики в runtime или платформенных SDK. [Текущий статус](docs/PROJECT_STATUS.md).

## Документация

- [Game Design Document](docs/GDD.md) — единственный индекс дизайна.
- [Игровой цикл](docs/design/CORE_LOOP.md) — fixed-step, маршруты, переключатели, манипулятор, пауза и откат.
- [Колония](docs/design/COLONY.md) — постройки, производство, материалы и защита от софтлока.
- [Миссии](docs/design/LEVELS.md) — LV-01..06 и будущая кампания.
- [Визуальный контракт](docs/design/PRESENTATION.md) — артконцепция, доступность и мобильный UI.
- [Acceptance matrix](docs/acceptance/REQUIREMENTS.md) — стабильные ID и фактические evidence-gates.
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

Откройте локальный URL из вывода Vite. `npm run check` проверяет структуру проекта и TypeScript production build, но не подтверждает игровой цикл, браузерные устройства, рекламу или платформенный ZIP.

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

GitHub Actions: [quality.yml](.github/workflows/quality.yml). Для разработки читать [GDD](docs/GDD.md), [AGENTS.md](AGENTS.md) и [PROJECT_STATUS](docs/PROJECT_STATUS.md), двигаться от G1 к G2 с LV-01 и LV-02. Не считать наличие файла уровнем, импорт картинки готовой графикой или локальную сборку разрешением публикации.

Никаких реальных SDK-реклам, IAP, внешней модерации, публикации или прав на чужую графику на этом этапе.
