# ONBOARDING: defectdojo-http-api-mcp

**Рекомендуемый способ:** **`/session-start`** (`.cursor/commands/session-start.md`).

Личный MCP-сервер для **DefectDojo** через HTTP API (не JSON-RPC плагин).
Стиль и структура — как у `gitlab-http-api-mcp` / `youtrack-http-api-mcp` /
`confluence-http-api-mcp`.

## Цель

1. Узкий набор tools для triage findings (list/get/update status/notes/products).
2. Без дампа всего OpenAPI в MCP.
3. Env-only конфигурация (`DEFECTDOJO_URL`, `DEFECTDOJO_API_TOKEN`).
4. Публикация на npm (по аналогии с соседними `*-http-api-mcp`) — когда MVP стабилен.

## Контекст в экосистеме ~/ai/

- Корень: `~/ai/defectdojo-http-api-mcp`
- Воркспейс: `~/ai/general/ai.code-workspace`
- `.cursor/mcp.json` → симлинк на `../../general/.cursor/mcp.json`
- `.cursor/rules/` → симлинки на `../general/.cursor/rules/*.mdc`

## Текущий этап

Scaffold: `server.mjs` с MVP tools, README, `/session-start`, git на
`gitlab.greenworm.ru:ai/defectdojo-http-api-mcp`.

**Следующее (отдельная сессия разработки):** довести API-обёртки, тесты,
npm publish, wrapper под секретный env, подключение в нужные MCP-конфиги хоста.

## Не смешивать

Это **личный** проект `~/ai`. Рабочие Cubekit/итaces-контуры и их планы сюда
не тащить; секреты рабочих инстансов — только в локальном env хоста, не в git.
