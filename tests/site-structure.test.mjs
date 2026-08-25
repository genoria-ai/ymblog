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

test('provides a persistent Chinese and English language switch', () => {
  assert.ok(/<html[^>]+data-language="zh"/.test(html), 'root language state is missing');
  assert.equal((html.match(/data-set-language="(?:en|zh)"/g) ?? []).length, 2);
  assert.ok(/navigator\.language/.test(html), 'browser language detection is missing');
  assert.ok(/localStorage\.getItem\('ymblog-language'\)/.test(html), 'saved language lookup is missing');
  assert.ok(/localStorage\.setItem\('ymblog-language'/.test(html), 'language persistence is missing');
});

test('pairs translated interface and prose content in both languages', () => {
  const englishContent = (html.match(/data-lang-content="en"/g) ?? []).length;
  const chineseContent = (html.match(/data-lang-content="zh"/g) ?? []).length;

  assert.equal(englishContent, chineseContent);
  assert.ok(englishContent >= 50);

  const researchCards = html.match(/<div class="research-card">[\s\S]*?<\/div>\s*<\/div>/g) ?? [];
  assert.equal(researchCards.length, 4);
  researchCards.forEach((card) => {
    assert.ok(/data-lang-content="en"/.test(card));
    assert.ok(/data-lang-content="zh"/.test(card));
  });

  const mediaCards = html.match(/<a class="media-card"[\s\S]*?<\/a>/g) ?? [];
  assert.equal(mediaCards.length, 11);
  mediaCards.forEach((card) => {
    assert.ok(/class="mc-headline" data-lang-content="en"/.test(card));
    assert.ok(/class="mc-headline" data-lang-content="zh"/.test(card));
  });
});

test('keeps publication titles in their original language', () => {
  assert.equal((html.match(/<span class="ptitle">/g) ?? []).length, 15);
  assert.doesNotMatch(html, /class="ptitle"[^>]*data-lang-content/);

  const publicationMetaRows = html.match(/<div class="pmeta-row">[\s\S]*?<\/div>/g) ?? [];
  assert.equal(publicationMetaRows.length, 15);
  publicationMetaRows.forEach((row) => {
    assert.ok(/data-lang-content="en"/.test(row));
    assert.ok(/data-lang-content="zh"/.test(row));
  });
});

test('switches identity and page title without mixing display languages', () => {
  assert.ok(/<div class="mark"><span data-lang-content="en">Meng Yang<\/span><span data-lang-content="zh">杨梦<\/span><\/div>/.test(html));
  assert.ok(/<h1 class="name anim d2"><span data-lang-content="en">Meng Yang<\/span><span data-lang-content="zh">杨梦<\/span><\/h1>/.test(html));
  assert.ok(/document\.title = language === 'zh' \? '杨梦' : 'Meng Yang'/.test(html));
  assert.doesNotMatch(html, /Meng Yang · 杨梦/);
});
