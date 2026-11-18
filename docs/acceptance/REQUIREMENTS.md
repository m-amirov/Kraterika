# Acceptance matrix — Кратерика

**Статус:** G1 DRAFT, **NOT APPROVED**. Имя игры и формат B утверждены; количественные требования, правила симуляции и границы vertical slice предлагаются к подтверждению. Любое изменение/удаление MUST требует явного scope decision, а не адаптации перечня к готовому коду.

| ID | Priority | Проверяемое требование | Доказательство на целевом этапе | Состояние |
| --- | --- | --- | --- | --- |
| GP-001 | MUST | Детерминированная логика миссии на одинаковом состоянии/списке команд | G2 unit replay по state hash | NOT_RUN |
| GP-002 | MUST | Планирование секций маршрута; недопустимый ввод не меняет состояние | G2 domain tests + браузер | NOT_RUN |
| GP-003 | MUST | Стрелка меняет путь робота со следующего тика и при паузе | G2 integration + UI capture | NOT_RUN |
| GP-004 | MUST | Манипулятор переносит груз при валидной зоне/слоте с cooldown | G3 deterministic test | NOT_RUN |
| GP-005 | MUST | Два робота не сталкиваются/не обмениваются клетками одновременно | G2 collision tests | NOT_RUN |
| GP-006 | MUST | Пауза, шаг, повтор и откат восстанавливают полное состояние | G3 200 ticks snapshot test | NOT_RUN |
| GP-007 | MUST | Все обязательные грузы достигли правильных адресов для WIN | G2 graph/flow tests | NOT_RUN |
| GP-008 | MUST | Шесть миссий LV-01..06 существуют, решаемы и доступны по правилам открытия | G4 native solver + real runtime | NOT_RUN |
| GP-009 | MUST | Инструменты реально используются в обучающих миссиях, не декоративны | G3 mission-specific trace | NOT_RUN |
| COL-001 | MUST | Диспетчерский центр доступен с начала и отображает контракты | G3 runtime + screenshot | NOT_RUN |
| COL-002 | MUST | Мастерская открывается после LV-03, строительство расходует 22 материалов | G3 save/reward tests | NOT_RUN |
| COL-003 | MUST | Оранжерея открывается после LV-06, строительство расходует 32 материала | G3 save/reward tests | NOT_RUN |
| COL-004 | MUST | Размещение зданий учитывает свободные площадки и бюджет мощности | G3 domain tests + browser | NOT_RUN |
| COL-005 | MUST | Строительство функционально: открывает инструмент/контракт, меняет карту | G3 event + visual observation | NOT_RUN |
| ECO-001 | MUST | Единожды выдать материалы по наградам [8,9,10,10,11,12] | G2 reward/replay tests | NOT_RUN |
| ECO-002 | MUST | Неудача и откат не забирают ресурсы и не дают дублировать награду | G3 regression | NOT_RUN |
| ECO-003 | MUST | Нет обязательных покупок и гринда для прохождения первой серии | G4 source-derived solvency proof | NOT_RUN |
| SAVE-001 | MUST | Сохранить первые прохождения, постройки и прогрессию, вернуть после reload | G3 real-browser storage tests | NOT_RUN |
| UX-001 | MUST | Управление мышью/тачем; пауза и шаг не требуют реакции на скорость | G3 Chromium mobile/desktop | NOT_RUN |
| UX-002 | MUST | Контейнеры различимы по символу и цвету, ошибок без hover | G3 screenshots + accessibility review | NOT_RUN |
| ART-001 | MUST | Все отгружаемые ассеты реально существуют, имеют происхождение/права, видны в runtime | G3/G6 art & archive review | NOT_RUN |
| SDK-001 | MUST | Поддержка целевых платформ только после отдельного Ludory/Connect proof-of-concept | G6 platform SDK browser & package receipt | NOT_RUN |
| PLAY-001 | MUST | Наблюдения реальных игроков с указанием сборки, consent и ограничений | G5 human sessions | NOT_RUN |
| FUT-001 | OPTIONAL | 5 районов/ориентир до 30 уровней | Отдельный scope decision после G3 | BACKLOG |
| FUT-002 | OPTIONAL | Программируемые стрелки, гравитация, дроны, дополнительные производственные цепи | Отдельный scope decision | BACKLOG |
| MON-001 | OPTIONAL | Необязательные rewarded hints без обязательной рекламы | Отдельная платформа/owner авторизация | BACKLOG |

## Подтверждённый G2-поднабор, не закрывающий полный scope

На точном игровом SHA `59ce030c690b59520c6437049c01c0546f02c69f` проверки [Quality 44285741527](https://github.com/m-amirov/Kraterika/actions/runs/44285741527) (**16/16**) и [Chromium browser 44285741577](https://github.com/m-amirov/Kraterika/actions/runs/44285741577) (mouse LV01/LV02; mobile emulation LV01; сохранения и награды) подтверждают **G2-поднабор** GP-001, GP-002, GP-003, GP-005, GP-007, а также частичную ECO-001 (только LV01/02), базовые mouse/touch и first-clear persistence. Статусы `NOT_RUN` выше относятся к **полной** матрице G3/G4 для всех 6 миссий/построек/физических устройств; нельзя считать их реализованными на основании G2.

## Обязательный порядок приёмки

1. G1 — согласовать формулировки и зависимости требований; создать **версионированный** утверждённый baseline. Сейчас baseline **не утверждён**.
2. G2 — отдельно доказать GP-001..003, GP-005 и GP-007 в работающем first playable; кодовая проверка ≠ качество опыта.
3. G3 — закрыть колонию и UI только реальными сборками/ассетами, не скриншотами макетов.
4. G4 — game-content-qa сравнивает **утверждённый baseline** и реальное содержимое; отсутствие или unreachable MUST → FAIL.
5. G5 — реальная сессия игроков, не имитация. G6 — реальные архивы и права, тот же SHA, что QA; G7 — только после отдельного разрешения.

Тестовый game-content-qa manifest не создаётся заранее: он не должен выдавать DRAFT требований за утверждённый baseline или ложно отмечать content complete.
