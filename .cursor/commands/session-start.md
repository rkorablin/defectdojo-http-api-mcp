# Команда `/session-start` — онбординг новой сессии

Пользователь начинает новую сессию по **defectdojo-http-api-mcp**.

## Источники правды (читать по порядку)

1. **`ONBOARDING_PROMPT.md`**
2. **`README.md`**
3. **`server.mjs`** — фактический surface tools
4. При необходимости Engram: `recall` с `defectdojo-http-api-mcp` (Git важнее при конфликте)

## Обязательное поведение

1. Воркспейс — корень этого репо (или папка в `ai.code-workspace`).
2. Прочитать ONBOARDING + README; не начинать правки/publish без явной задачи.
3. Не коммитить токены; не светить `DEFECTDOJO_API_TOKEN` в чат.
4. GitLab только **gitlab.greenworm.ru**, группа **ai** (`GL_HOST=gitlab.greenworm.ru`).

## Отчёт о готовности (кратко, на русском)

1. Готовность — контекст из ONBOARDING/README.
2. Цель — HTTP MCP для DefectDojo (triage findings).
3. Стек — Node 18+, `@modelcontextprotocol/sdk`, stdio.
4. Этап — scaffold / MVP / publish (по факту репо).
5. Следующий шаг — спросить задачу (реализация tool, тест против инстанса, npm publish).
