# defectdojo-http-api-mcp

MCP (Model Context Protocol) server for **DefectDojo** over the official HTTP API
(`Authorization: Token …`). Same style as `gitlab-http-api-mcp` /
`youtrack-http-api-mcp`: controlled tool surface, no OpenAPI dump.

Для новой сессии агента: **`/session-start`** (`.cursor/commands/session-start.md`).

## Requirements

- Node.js 18+
- DefectDojo URL + API token

## Install

```bash
cd ~/ai/defectdojo-http-api-mcp
npm install
```

## Configuration

Environment variables:

- `DEFECTDOJO_URL` — base URL without trailing slash (e.g. `http://defectdojo.example.com`)
- `DEFECTDOJO_API_TOKEN` — API token (`Token` auth)
- `DEFECTDOJO_ORGANIZATION` — optional default product type / org label for filters

## Usage

### Standalone (stdio)

```bash
export DEFECTDOJO_URL="http://defectdojo.example.com"
export DEFECTDOJO_API_TOKEN="…"
node server.mjs
```

### Cursor / MCP host

Local clone:

```json
"defectdojo": {
  "command": "node",
  "args": ["/absolute/path/to/defectdojo-http-api-mcp/server.mjs"],
  "env": {
    "DEFECTDOJO_URL": "http://defectdojo.example.com",
    "DEFECTDOJO_API_TOKEN": "…"
  }
}
```

Or via a wrapper that sources your secret env file (preferred for multi-host setups).

## Tools (MVP scaffold)

| Tool | Purpose |
|------|---------|
| `defectdojo_whoami` | Current user / token smoke |
| `defectdojo_list_products` | Products |
| `defectdojo_list_engagements` | Engagements (optional product filter) |
| `defectdojo_list_tests` | Tests under engagement |
| `defectdojo_list_findings` | Findings with severity/active/false_p filters |
| `defectdojo_get_finding` | One finding by id |
| `defectdojo_update_finding` | Status / verified / false_p / risk accepted / notes |
| `defectdojo_add_note` | Note on finding |

Expand incrementally; keep schemas explicit.

## GitLab

Репозиторий экосистемы **~/ai/**: **https://gitlab.greenworm.ru/ai/defectdojo-http-api-mcp**.
