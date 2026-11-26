# defectdojo-http-api-mcp

MCP (Model Context Protocol) server for **DefectDojo** over the official HTTP API
(`Authorization: Token …`). Same style as `gitlab-http-api-mcp` /
`youtrack-http-api-mcp`: controlled tool surface, no OpenAPI dump.

Для новой сессии агента: **`/session-start`** (`.cursor/commands/session-start.md`).

## Requirements

- Node.js 18+
- DefectDojo URL + API token

## Install

### From source (GitLab / GitHub)

```bash
git clone git@gitlab.greenworm.ru:ai/defectdojo-http-api-mcp.git
cd defectdojo-http-api-mcp
npm install
```

Публичное зеркало: `https://github.com/rkorablin/defectdojo-http-api-mcp`.

### From npm

```bash
npm install defectdojo-http-api-mcp
# or
npm install -g defectdojo-http-api-mcp
```

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `DEFECTDOJO_URL` | Yes | Base URL without trailing slash |
| `DEFECTDOJO_API_TOKEN` | Yes | API token (`Authorization: Token …`) |
| `DEFECTDOJO_ORGANIZATION` | No | Default product type name filter (e.g. `Cubekit`) |
| `DEFECTDOJO_ENGAGEMENT` | No | Optional label for docs / host wrappers |

## Usage

### Standalone (stdio)

```bash
export DEFECTDOJO_URL="http://defectdojo.example.com"
export DEFECTDOJO_API_TOKEN="…"
node server.mjs
```

### Cursor / MCP host

#### Option 1: Local clone

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

#### Option 2: npm / npx

```json
"defectdojo": {
  "command": "npx",
  "args": ["--yes", "--prefer-online", "defectdojo-http-api-mcp@latest"],
  "env": {
    "DEFECTDOJO_URL": "http://defectdojo.example.com",
    "DEFECTDOJO_API_TOKEN": "…"
  }
}
```

#### Option 3: wrapper + secrets (recommended)

See `~/.config/ai-mcp` pattern (GitLab / YouTrack / Confluence):

- secrets in `~/.config/ai-mcp/it-aces.env` (`DEFECTDOJO_*`)
- launcher `~/.config/ai-mcp/bin/run-defectdojo-mcp-itaces.sh`
- entry in `~/ai/general/.cursor/mcp.json`

## Tools

| Tool | Purpose |
|------|---------|
| `defectdojo_whoami` | Auth smoke (`/users/me` or products-count fallback for CI tokens) |
| `defectdojo_list_product_types` | Organizations / product types |
| `defectdojo_list_products` | Products (optional org / name filter) |
| `defectdojo_list_engagements` | Engagements |
| `defectdojo_list_tests` | Tests under engagement |
| `defectdojo_list_findings` | Findings with triage filters (compact by default) |
| `defectdojo_get_finding` | One finding by id |
| `defectdojo_update_finding` | PATCH status / false_p / risk_accepted / … |
| `defectdojo_list_notes` | Notes on a finding |
| `defectdojo_add_note` | Note via `POST /findings/{id}/notes/` |

## Typical agent workflow

1. `defectdojo_whoami` — check token
2. `defectdojo_list_products` with organization — inventory
3. `defectdojo_list_findings` (`active=true`, severity filters)
4. `defectdojo_get_finding` — details
5. `defectdojo_update_finding` / `defectdojo_add_note` — triage

## Tests

```bash
npm test
```

## Remotes

- GitLab (origin, экосистема **~/ai/**): **https://gitlab.greenworm.ru/ai/defectdojo-http-api-mcp**
- GitHub (зеркало): **https://github.com/rkorablin/defectdojo-http-api-mcp**

## License

MIT
