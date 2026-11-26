#!/usr/bin/env node
/**
 * MCP server for DefectDojo over HTTP API.
 *
 * Env:
 * - DEFECTDOJO_URL          (e.g. http://defectdojo.example.com)
 * - DEFECTDOJO_API_TOKEN    (Token auth)
 * - DEFECTDOJO_ORGANIZATION (optional)
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const baseUrl = (process.env.DEFECTDOJO_URL || '').replace(/\/$/, '');
const token = process.env.DEFECTDOJO_API_TOKEN || '';

function authHeaders() {
  if (!baseUrl) throw new Error('DEFECTDOJO_URL is required');
  if (!token) throw new Error('DEFECTDOJO_API_TOKEN is required');
  return {
    Authorization: `Token ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
}

function parseBody(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function ddFetch(path, opts = {}) {
  const url = path.startsWith('http')
    ? path
    : `${baseUrl}/api/v2${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...opts,
    headers: { ...authHeaders(), ...(opts.headers || {}) }
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 500)}`);
  }
  return parseBody(text);
}

function qs(params = {}) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : '';
}

function ok(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
  };
}

const server = new Server(
  { name: 'defectdojo-http-api-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'defectdojo_whoami',
      description: 'Smoke: current DefectDojo user for the API token',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
      name: 'defectdojo_list_products',
      description: 'List DefectDojo products',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Optional name contains filter' },
          limit: { type: 'number', description: 'Page size (default 50)' },
          offset: { type: 'number', description: 'Offset (default 0)' }
        },
        additionalProperties: false
      }
    },
    {
      name: 'defectdojo_list_engagements',
      description: 'List engagements; optional product id',
      inputSchema: {
        type: 'object',
        properties: {
          product_id: { type: 'number' },
          limit: { type: 'number' },
          offset: { type: 'number' }
        },
        additionalProperties: false
      }
    },
    {
      name: 'defectdojo_list_tests',
      description: 'List tests; optional engagement id',
      inputSchema: {
        type: 'object',
        properties: {
          engagement_id: { type: 'number' },
          limit: { type: 'number' },
          offset: { type: 'number' }
        },
        additionalProperties: false
      }
    },
    {
      name: 'defectdojo_list_findings',
      description:
        'List findings with common triage filters (severity, active, false_p, verified, duplicate, product)',
      inputSchema: {
        type: 'object',
        properties: {
          product_id: { type: 'number' },
          test_id: { type: 'number' },
          severity: { type: 'string', description: 'e.g. Critical, High, Medium, Low, Info' },
          active: { type: 'boolean' },
          verified: { type: 'boolean' },
          false_p: { type: 'boolean' },
          duplicate: { type: 'boolean' },
          limit: { type: 'number' },
          offset: { type: 'number' }
        },
        additionalProperties: false
      }
    },
    {
      name: 'defectdojo_get_finding',
      description: 'Get one finding by id',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'number' } },
        required: ['id'],
        additionalProperties: false
      }
    },
    {
      name: 'defectdojo_update_finding',
      description:
        'PATCH finding triage fields (active, verified, false_p, out_of_scope, risk_accepted, is_mitigated, severity, notes append via separate tool)',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          active: { type: 'boolean' },
          verified: { type: 'boolean' },
          false_p: { type: 'boolean' },
          out_of_scope: { type: 'boolean' },
          risk_accepted: { type: 'boolean' },
          is_mitigated: { type: 'boolean' },
          severity: { type: 'string' }
        },
        required: ['id'],
        additionalProperties: false
      }
    },
    {
      name: 'defectdojo_add_note',
      description: 'Add a note to a finding',
      inputSchema: {
        type: 'object',
        properties: {
          finding_id: { type: 'number' },
          entry: { type: 'string', description: 'Note text' }
        },
        required: ['finding_id', 'entry'],
        additionalProperties: false
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const name = req.params.name;
  const a = req.params.arguments || {};

  try {
    switch (name) {
      case 'defectdojo_whoami':
        return ok(await ddFetch('/users/me/'));

      case 'defectdojo_list_products':
        return ok(
          await ddFetch(
            `/products/${qs({
              name: a.name,
              limit: a.limit ?? 50,
              offset: a.offset ?? 0
            })}`
          )
        );

      case 'defectdojo_list_engagements':
        return ok(
          await ddFetch(
            `/engagements/${qs({
              product: a.product_id,
              limit: a.limit ?? 50,
              offset: a.offset ?? 0
            })}`
          )
        );

      case 'defectdojo_list_tests':
        return ok(
          await ddFetch(
            `/tests/${qs({
              engagement: a.engagement_id,
              limit: a.limit ?? 50,
              offset: a.offset ?? 0
            })}`
          )
        );

      case 'defectdojo_list_findings':
        return ok(
          await ddFetch(
            `/findings/${qs({
              product: a.product_id,
              test: a.test_id,
              severity: a.severity,
              active: a.active,
              verified: a.verified,
              false_p: a.false_p,
              duplicate: a.duplicate,
              limit: a.limit ?? 50,
              offset: a.offset ?? 0
            })}`
          )
        );

      case 'defectdojo_get_finding':
        return ok(await ddFetch(`/findings/${a.id}/`));

      case 'defectdojo_update_finding': {
        const body = {};
        for (const k of [
          'active',
          'verified',
          'false_p',
          'out_of_scope',
          'risk_accepted',
          'is_mitigated',
          'severity'
        ]) {
          if (a[k] !== undefined) body[k] = a[k];
        }
        return ok(
          await ddFetch(`/findings/${a.id}/`, {
            method: 'PATCH',
            body: JSON.stringify(body)
          })
        );
      }

      case 'defectdojo_add_note':
        return ok(
          await ddFetch('/notes/', {
            method: 'POST',
            body: JSON.stringify({
              entry: a.entry,
              object_id: a.finding_id,
              // Finding content type is typically resolved by DD; if needed adjust per instance
              type: 'Finding'
            })
          })
        );

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: String(err?.message || err) }]
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
