import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('removes the duplicate floating quick navigation', () => {
  assert.doesNotMatch(html, /quick-nav|qnLinks|qnObs|data-target=/);
});

test('renders publication venues as plain muted text', () => {
  assert.doesNotMatch(html, /pub-venue-tag|class="vyr"|\bflagship\b|\bspecial\b/);
  assert.equal((html.match(/class="pub-venue"/g) ?? []).length, 15);

  const venueRule = html.match(/\.pub-venue\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(venueRule, /color:var\(--ink-faint\)/);
  assert.doesNotMatch(venueRule, /background|border|padding|text-align/);
});
