import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQuery,
  buildFindingNoteBody,
  summarizeFinding,
  summarizeProduct,
  mapResults
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
