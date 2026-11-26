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
- Секреты хоста: `~/.config/ai-mcp/it-aces.env` + `bin/run-defectdojo-mcp-itaces.sh`

## Текущий этап

MVP готов к использованию: tools + helpers + unit tests, wrapper в `ai-mcp`,
запись в `general/.cursor/mcp.json`. Smoke — против инстанса через env.

**Git:** `origin` → `git@gitlab.greenworm.ru:ai/defectdojo-http-api-mcp.git`
(группа **ai**). Публичное зеркало: remote `github` →
`git@github.com:rkorablin/defectdojo-http-api-mcp.git`.

**Identity:** `defectdojo_whoami` — `/user_profile/` → `/users/me/` →
products-count fallback. На it-aces личный токен: `/users/me` = 404 (норма),
profile отдаёт username. См. [`TODO-whoami-user-profile.md`](TODO-whoami-user-profile.md).
Заметки — только через `/findings/{id}/notes/`.

## Не смешивать

Это **личный** проект `~/ai`. Рабочие Cubekit/итaces-контуры и их планы сюда
не тащить; секреты рабочих инстансов — только в локальном env хоста, не в git.
