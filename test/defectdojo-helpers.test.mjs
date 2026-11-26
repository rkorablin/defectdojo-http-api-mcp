import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQuery,
  buildFindingNoteBody,
  summarizeFinding,
  summarizeProduct,
  mapResults,
  compactUserProfile,
  resolveWhoamiIdentity
} from '../lib/defectdojo-helpers.mjs';

test('buildQuery skips empty and encodes booleans', () => {
  assert.equal(buildQuery({ a: 1, b: '', c: null, d: true, e: false }), '?a=1&d=true&e=false');
  assert.equal(buildQuery({}), '');
});

test('buildFindingNoteBody requires entry', () => {
  assert.throws(() => buildFindingNoteBody({}), /entry is required/);
  assert.deepEqual(buildFindingNoteBody({ entry: 'skip', private: true, note_type: 2 }), {
    entry: 'skip',
    private: true,
    note_type: 2
  });
});

test('summarizeFinding keeps triage fields', () => {
  const s = summarizeFinding({
    id: 9,
    title: 'CVE',
    severity: 'High',
    active: true,
    verified: false,
    false_p: false,
    noise: 'drop-me'
  });
  assert.equal(s.id, 9);
  assert.equal(s.severity, 'High');
  assert.equal(s.noise, undefined);
});

test('mapResults maps paginated results', () => {
  const out = mapResults(
    { count: 1, next: null, previous: null, results: [{ id: 1, name: 'P', x: 1 }] },
    summarizeProduct
  );
  assert.equal(out.count, 1);
  assert.equal(out.results[0].name, 'P');
  assert.equal(out.results[0].x, undefined);
});

test('compactUserProfile reads nested user', () => {
  const out = compactUserProfile(
    {
      user: {
        id: 5,
        username: 'rkorablin',
        email: 'rkorablin@it-aces.com',
        is_staff: true,
        is_superuser: true
      }
    },
    { organization: 'Cubekit', base_url: 'http://dd' }
  );
  assert.equal(out.source, 'user_profile');
  assert.equal(out.username, 'rkorablin');
  assert.equal(out.organization, 'Cubekit');
});

test('resolveWhoamiIdentity prefers user_profile over users/me 404', async () => {
  const calls = [];
  const out = await resolveWhoamiIdentity(
    async (path) => {
      calls.push(path);
      if (path === '/user_profile/') {
        return { user: { id: 5, username: 'rkorablin', email: 'a@b.c' } };
      }
      if (path === '/users/me/') {
        throw new Error('404 Not found');
      }
      throw new Error(`unexpected ${path}`);
    },
    { organization: 'Cubekit', base_url: 'http://dd' }
  );
  assert.equal(out.username, 'rkorablin');
  assert.equal(out.source, 'user_profile');
  assert.deepEqual(calls, ['/user_profile/']);
});

test('resolveWhoamiIdentity falls back to users/me then products', async () => {
  const calls = [];
  const out = await resolveWhoamiIdentity(async (path) => {
    calls.push(path);
    if (path === '/user_profile/') throw new Error('403');
    if (path === '/users/me/') throw new Error('403');
    if (path.startsWith('/products/')) return { count: 24, results: [] };
    throw new Error(`unexpected ${path}`);
  });
  assert.equal(out.source, 'products_fallback');
  assert.equal(out.products_count, 24);
  assert.equal(calls.length, 3);

  const mid = await resolveWhoamiIdentity(async (path) => {
    if (path === '/user_profile/') throw new Error('404');
    if (path === '/users/me/') return { id: 1, username: 'ci-bot' };
    throw new Error(`unexpected ${path}`);
  });
  assert.equal(mid.source, 'users_me');
  assert.equal(mid.username, 'ci-bot');
});
