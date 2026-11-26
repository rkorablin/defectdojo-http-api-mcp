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

/** Compact identity from GET /user_profile/ (or nested user). */
export function compactUserProfile(profile, { organization = null, base_url = null } = {}) {
  const user = profile?.user && typeof profile.user === 'object' ? profile.user : profile;
  if (!user || typeof user !== 'object') {
    throw new Error('user_profile payload missing user');
  }
  return {
    auth: 'ok',
    source: 'user_profile',
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    is_staff: user.is_staff,
    is_superuser: user.is_superuser,
    organization: organization || null,
    base_url: base_url || null
  };
}

/** Compact identity from GET /users/me/. */
export function compactUsersMe(me, { organization = null, base_url = null } = {}) {
  if (!me || typeof me !== 'object') {
    throw new Error('users/me payload missing');
  }
  return {
    auth: 'ok',
    source: 'users_me',
    id: me.id,
    username: me.username,
    email: me.email,
    first_name: me.first_name,
    last_name: me.last_name,
    is_staff: me.is_staff,
    is_superuser: me.is_superuser,
    organization: organization || null,
    base_url: base_url || null
  };
}

/**
 * Probe identity in order: user_profile → users/me → products_count fallback.
 * `fetchPath(path)` should throw on non-2xx (same contract as ddFetch).
 */
export async function resolveWhoamiIdentity(fetchPath, { organization = null, base_url = null } = {}) {
  const errors = [];

  try {
    const profile = await fetchPath('/user_profile/');
    return compactUserProfile(profile, { organization, base_url });
  } catch (err) {
    errors.push(`user_profile: ${err?.message || err}`);
  }

  try {
    const me = await fetchPath('/users/me/');
    return compactUsersMe(me, { organization, base_url });
  } catch (err) {
    errors.push(`users_me: ${err?.message || err}`);
  }

  const products = await fetchPath(`/products/${buildQuery({ limit: 1, offset: 0 })}`);
  return {
    auth: 'ok',
    source: 'products_fallback',
    users_me: 'unavailable',
    detail: errors.join(' | '),
    organization: organization || null,
    base_url: base_url || null,
    products_count: products?.count ?? null
  };
}
