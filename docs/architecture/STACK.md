# Техническая архитектура и границы WFA / Ludory

**Решение G1 DRAFT:** самостоятельный репозиторий игры `m-amirov/Kraterika`; Phaser 3 + TypeScript + Vite для 2D отрисовки; чистая детерминированная логика без зависимости от FPS; Ludory подключать на подтверждённых API, а не заменять им Phaser.

## Связь подсистем

| Слой | Ответственность | Источник истины |
| --- | --- | --- |
| Game/domain | Сетка, роботы, грузы, тик, route/switch/arm, колония, награды, save schema | Собственный код Kraterika |
| Phaser presentation | Canvas/WebGL, сцены, анимация, normalised pointer/touch, адаптивность | Собственный код Kraterika |
| Ludory Core | Валидируемый game manifest/definition и совместимые state contracts (после подключения) | Ludory `@ludory/core` |
| Ludory Runtime | Lifecycle/input/save/audio при подтверждении интеграционного интерфейса | Ludory `@ludory/runtime` |
| Runtime Phaser adapter | `createPhaserRenderer` с введённым Phaser 3 (опционально после POC) | Ludory `@ludory/runtime-phaser` |
| Connect | Яндекс/VK SDK и платформенные lifecycle gates | Ludory нативные Connect + реальные SDK |
| WFA | Game Production G0–G7, gameplay-design, playtesting, content-QA, regression/release gates | WFA/локальный `AGENTS.md` |

**Текущая интеграция:** только Core-compatible JSON-манифест игры и pinned toolchain instructions. Это **не** Studio-generated provenance, доверенный список компонентов или запущенный Runtime/Connect. SDK integration и generic Phaser→Yandex/VK ZIP процедура **NOT RUN / NOT VERIFIED**.

## Пиннинг исходников

См. [`integrations/toolchain.json`](../../integrations/toolchain.json). Опорные коммиты на момент проектирования:
- WFA: `6c8d80d15155cd8ccfbd245fce9450f61b5133f3`;
- Ludory: `933c73b195eaf3bfffd12a31ab1cbadb27989eea`.

Менять эти SHA можно только с повторным изучением changelog/контрактов и обновлением локальной инструкции. Пин — не доказательство того, что библиотеки установлены/загружены.

## Ludory G1/G2 Integration Gate (строго)

1. Иметь отдельный локальный checkout Ludory на exact SHA; запустить `node scripts/verify-ludory.mjs --ludory <path>`, подтвердить `defineGame`.
2. Проверить APIs, которые реально существуют в pinned исходнике, и сравнить с потребностями игры. Не использовать narrative-only платформенный экспорт на Phaser-проекте.
3. На **отдельной disposable fixture**, не переписывая Kraterika, продемонстрировать `RuntimeHost + createPhaserRenderer` lifecycle: mount/resize/input/snapshot/unmount + native test. Запись доказательств по source SHA.
4. Проверить ограничения сохранений, импорта ассетов и платформенной сборки; выбрать адаптер либо явно задокументировать несовместимость без смены движка втайне.
5. Только после этого подключать Runtime или Connect в собственную игру. Релиз через нативные API, с реальными архивами, правами и platform SDK доказательствами. До этого `G6 BLOCKED`.

**Нельзя:** делать `ludory export` на произвольную Phaser-игру (такой общий подтверждённый интерфейс отсутствует); принимать mock SDK за реальную модерацию; менять чужой Ludory main ради этой игры без отдельной задачи.

## WFA в локальном репозитории

Проектный `AGENTS.md` — постоянный маршрут действий Codex. Для реального подхвата Skills использовать pinned WFA checkout и `scripts/install-wfa.ps1 -WfaCheckout ... -Apply`; скрипт перед установкой делает dry-run и проверяет SHA. Репозиторий **не содержит** копий Skills, не изменяет глобальные конфигурации, не устанавливает ничего на пользовательской машине автоматически.

Прямые ссылки на исходные playbooks:
- https://github.com/m-amirov/workflow-for-agents/blob/6c8d80d15155cd8ccfbd245fce9450f61b5133f3/playbooks/game-production.md
- https://github.com/m-amirov/workflow-for-agents/blob/6c8d80d15155cd8ccfbd245fce9450f61b5133f3/prompts/codex/game-production.md

## Репозиторий, CI и безопасное продолжение

- Один package с Phaser/Vite и unit-checks; Node 22+; `npm install` до появления проверенного lockfile, затем переход на `npm ci`. Не подменять отсутствие lockfile мнимой воспроизводимостью.
- Исходники игры → сборка Vite → отдельно SDK adapters/candidate package. `npm run build` не является Yandex/VK экспортом.
- Main-first; если репозиторий защитит `main`, использовать PR и реально проверять merge/CI; никакой force-push.
- Не коммитить API keys, автоматический upload на платформы, чужую графику без прав или пользовательские файлы.
- У каждого gate обязательно реально исполненные команды и source SHA; запись `PASS` без этого запрещена.

**По состоянию G1:** нет реализованного игрового цикла, G2–G7 NOT_RUN, реальные user-scope / project-scope Skills install и Ludory runtime integration не выполнялись.
