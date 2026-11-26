#!/usr/bin/env node
/**
 * MCP server for DefectDojo over HTTP API.
 *
 * Env:
 * - DEFECTDOJO_URL          (e.g. http://defectdojo.example.com)
 * - DEFECTDOJO_API_TOKEN    (Token auth)
 * - DEFECTDOJO_ORGANIZATION (optional default product_type name filter)
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  buildQuery,
  buildFindingNoteBody,
  summarizeFinding,
  summarizeProduct,
  mapResults
} from './lib/defectdojo-helpers.mjs';

const baseUrl = (process.env.DEFECTDOJO_URL || '').replace(/\/$/, '');
const token = process.env.DEFECTDOJO_API_TOKEN || '';
const defaultOrg = process.env.DEFECTDOJO_ORGANIZATION || '';

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
      description:
        'Smoke auth against DefectDojo. Uses /users/me when allowed; CI tokens often get a products-count fallback instead.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
      name: 'defectdojo_list_products',
      description: 'List DefectDojo products (compact). Optional name / product_type filters.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Optional name contains filter' },
          prod_type: {
            type: 'number',
            description: 'Product type id (organization). Overrides name lookup.'
          },
          organization: {
            type: 'string',
            description:
              'Product type name (e.g. Cubekit). Defaults to DEFECTDOJO_ORGANIZATION when set.'
          },
          limit: { type: 'number', description: 'Page size (default 50)' },
          offset: { type: 'number', description: 'Offset (default 0)' },
          raw: { type: 'boolean', description: 'Return full API objects' }
        },
        additionalProperties: false
      }
    },
    {
      name: 'defectdojo_list_product_types',
      description: 'List product types (organizations in UI terms)',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          limit: { type: 'number' },
          offset: { type: 'number' }
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
        'List findings with triage filters (severity, active, false_p, verified, duplicate, product). Compact by default.',
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
          risk_accepted: { type: 'boolean' },
          is_mitigated: { type: 'boolean' },
          limit: { type: 'number' },
          offset: { type: 'number' },
          raw: { type: 'boolean', description: 'Return full API objects' }
        },
        additionalProperties: false
      }
    },
    {
      name: 'defectdojo_get_finding',
      description: 'Get one finding by id (full object)',
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
        'PATCH finding triage fields (active, verified, false_p, out_of_scope, risk_accepted, is_mitigated, severity). Notes via defectdojo_add_note.',
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
      name: 'defectdojo_list_notes',
      description: 'List notes on a finding',
      inputSchema: {
        type: 'object',
        properties: { finding_id: { type: 'number' } },
        required: ['finding_id'],
        additionalProperties: false
      }
    },
    {
      name: 'defectdojo_add_note',
      description: 'Add a note to a finding (POST /findings/{id}/notes/)',
      inputSchema: {
        type: 'object',
        properties: {
          finding_id: { type: 'number' },
          entry: { type: 'string', description: 'Note text' },
          private: { type: 'boolean' },
          note_type: { type: 'number', description: 'Optional note type id' }
        },
        required: ['finding_id', 'entry'],
        additionalProperties: false
      }
    }
  ]
}));

async function resolveProdTypeId({ prod_type, organization }) {
  if (prod_type != null) return prod_type;
  const orgName = (organization || defaultOrg || '').trim();
  if (!orgName) return undefined;
  const data = await ddFetch(
    `/product_types/${buildQuery({ name: orgName, limit: 20, offset: 0 })}`
  );
  const exact = (data?.results || []).find(
    (pt) => String(pt.name).toLowerCase() === orgName.toLowerCase()
  );
  const hit = exact || (data?.results || [])[0];
  return hit?.id;
}

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const name = req.params.name;
  const a = req.params.arguments || {};

  try {
    switch (name) {
      case 'defectdojo_whoami': {
        try {
          return ok(await ddFetch('/users/me/'));
        } catch (err) {
          const products = await ddFetch(`/products/${buildQuery({ limit: 1, offset: 0 })}`);
          return ok({
            auth: 'ok',
            users_me: 'unavailable',
            detail: String(err?.message || err),
            organization: defaultOrg || null,
            base_url: baseUrl,
            products_count: products?.count ?? null
          });
        }
      }

      case 'defectdojo_list_product_types':
        return ok(
          await ddFetch(
            `/product_types/${buildQuery({
              name: a.name,
              limit: a.limit ?? 50,
              offset: a.offset ?? 0
            })}`
          )
        );

      case 'defectdojo_list_products': {
        const prodTypeId = await resolveProdTypeId({
          prod_type: a.prod_type,
          organization: a.organization
        });
        const data = await ddFetch(
          `/products/${buildQuery({
            name: a.name,
            prod_type: prodTypeId,
            limit: a.limit ?? 50,
            offset: a.offset ?? 0
          })}`
        );
        return ok(a.raw ? data : mapResults(data, summarizeProduct));
      }

      case 'defectdojo_list_engagements':
        return ok(
          await ddFetch(
            `/engagements/${buildQuery({
              product: a.product_id,
              limit: a.limit ?? 50,
              offset: a.offset ?? 0
            })}`
          )
        );

      case 'defectdojo_list_tests':
        return ok(
          await ddFetch(
            `/tests/${buildQuery({
              engagement: a.engagement_id,
              limit: a.limit ?? 50,
              offset: a.offset ?? 0
            })}`
          )
        );

      case 'defectdojo_list_findings': {
        const data = await ddFetch(
          `/findings/${buildQuery({
            product: a.product_id,
            test: a.test_id,
            severity: a.severity,
            active: a.active,
            verified: a.verified,
            false_p: a.false_p,
            duplicate: a.duplicate,
            risk_accepted: a.risk_accepted,
            is_mitigated: a.is_mitigated,
            limit: a.limit ?? 50,
            offset: a.offset ?? 0
          })}`
        );
        return ok(a.raw ? data : mapResults(data, summarizeFinding));
      }

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

      case 'defectdojo_list_notes':
        return ok(await ddFetch(`/findings/${a.finding_id}/notes/`));

      case 'defectdojo_add_note':
        return ok(
          await ddFetch(`/findings/${a.finding_id}/notes/`, {
            method: 'POST',
            body: JSON.stringify(
              buildFindingNoteBody({
                entry: a.entry,
                private: a.private,
                note_type: a.note_type
              })
            )
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
