/**
 * Pure helpers for DefectDojo API responses (triage MCP).
 */

/** Build query string; skip empty values. Booleans → "true"/"false". */
export function buildQuery(params = {}) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'boolean') {
      u.set(k, v ? 'true' : 'false');
    } else {
      u.set(k, String(v));
    }
  }
  const s = u.toString();
  return s ? `?${s}` : '';
}

/** Body for POST /api/v2/findings/{id}/notes/ */
export function buildFindingNoteBody({ entry, private: isPrivate, note_type } = {}) {
  if (entry == null || String(entry).trim() === '') {
    throw new Error('note entry is required');
  }
  const body = { entry: String(entry) };
  if (isPrivate !== undefined) body.private = Boolean(isPrivate);
  if (note_type !== undefined && note_type !== null && note_type !== '') {
    body.note_type = Number(note_type);
  }
  return body;
}

/** Compact finding for list/triage output. */
export function summarizeFinding(f) {
  if (!f || typeof f !== 'object') return f;
  return {
    id: f.id,
    title: f.title,
    severity: f.severity,
    active: f.active,
    verified: f.verified,
    false_p: f.false_p,
    duplicate: f.duplicate,
    out_of_scope: f.out_of_scope,
    risk_accepted: f.risk_accepted,
    is_mitigated: f.is_mitigated,
    numerical_severity: f.numerical_severity,
    cwe: f.cwe,
    vulnerability_ids: f.vulnerability_ids,
    component_name: f.component_name,
    component_version: f.component_version,
    file_path: f.file_path,
    line: f.line,
    test: f.test,
    product: f.product ?? f.found_by,
    created: f.created,
    date: f.date
  };
}

/** Compact product row. */
export function summarizeProduct(p) {
  if (!p || typeof p !== 'object') return p;
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    prod_type: p.prod_type,
    business_criticality: p.business_criticality,
    platform: p.platform,
    lifecycle: p.lifecycle,
    tags: p.tags
  };
}

/**
 * Map a paginated DD list response through a summarizer.
 * Pass through non-list payloads unchanged.
 */
export function mapResults(payload, mapper) {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.results)) {
    return payload;
  }
  return {
    count: payload.count,
    next: payload.next,
    previous: payload.previous,
    results: payload.results.map(mapper)
  };
}
