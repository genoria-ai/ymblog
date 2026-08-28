import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('removes the duplicate floating quick navigation', () => {
  assert.doesNotMatch(html, /quick-nav|qnLinks|qnObs|data-target=/);
});

test('renders publication venues as plain muted text', () => {
  assert.doesNotMatch(html, /pub-venue-tag|class="vyr"|\bflagship\b|\bspecial\b/);
  assert.equal((html.match(/class="pub-venue"/g) ?? []).length, 17);

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
  assert.equal(mediaCards.length, 10);
  assert.doesNotMatch(html, /The First Personalized Neoantigen Therapy Achieves Phase III Success/);
  assert.doesNotMatch(html, /首个个体化新抗原疗法III期成功/);
  mediaCards.forEach((card) => {
    assert.ok(/class="mc-headline" data-lang-content="en"/.test(card));
    assert.ok(/class="mc-headline" data-lang-content="zh"/.test(card));
  });
});

test('keeps publication titles in their original language', () => {
  assert.equal((html.match(/<span class="ptitle">/g) ?? []).length, 17);
  assert.doesNotMatch(html, /class="ptitle"[^>]*data-lang-content/);

  const publicationMetaRows = html.match(/<div class="pmeta-row">[\s\S]*?<\/div>/g) ?? [];
  assert.equal(publicationMetaRows.length, 17);
  publicationMetaRows.forEach((row) => {
    assert.ok(/data-lang-content="en"/.test(row));
    assert.ok(/data-lang-content="zh"/.test(row));
  });
});

test('lists all three 2026 articles with corresponding-author metadata', () => {
  const publications2026 = html.match(/<div class="pub-year">2026<\/div>([\s\S]*?)<\/div>\s*<\/div>\s*<div class="pub-year-group">/)?.[1] ?? '';

  assert.equal((publications2026.match(/class="pub-item"/g) ?? []).length, 3);
  assert.ok(publications2026.includes('<div class="pub-venue">arXiv</div>'));
  assert.ok(publications2026.includes('A self-evolving agentic system for automated generation and execution of biological protocols'));
  assert.ok(publications2026.includes('<div class="pub-venue">Genome Medicine</div>'));
  assert.ok(publications2026.includes('Single-cell omics data-driven decoding of tumor clonal evolution through reinforcement learning'));
  assert.equal((publications2026.match(/Corresponding author/g) ?? []).length, 3);
  assert.equal((publications2026.match(/通讯作者/g) ?? []).length, 3);
});

test('switches identity and page title without mixing display languages', () => {
  assert.ok(/<div class="mark"><span data-lang-content="en">Meng Yang<\/span><span data-lang-content="zh">杨梦<\/span><\/div>/.test(html));
  assert.ok(/<h1 class="name anim d2"><span data-lang-content="en">Meng Yang<\/span><span data-lang-content="zh">杨梦<\/span><\/h1>/.test(html));
  assert.ok(/document\.title = language === 'zh' \? '杨梦' : 'Meng Yang'/.test(html));
  assert.doesNotMatch(html, /Meng Yang · 杨梦/);
});

test('uses the approved bilingual opening biography', () => {
  const bio = html.match(/<div class="bio anim d4">([\s\S]*?)<\/div>/)?.[1] ?? '';

  assert.equal((bio.match(/<p data-lang-content="en">/g) ?? []).length, 3);
  assert.equal((bio.match(/<p data-lang-content="zh">/g) ?? []).length, 3);
  assert.ok(bio.includes('a Visiting Researcher at the Shanghai Artificial Intelligence Laboratory'));
  assert.ok(bio.includes('上海人工智能实验室客座研究员'));
  assert.ok(bio.includes('<strong>Scale Agentic Discovery</strong>'));
  assert.doesNotMatch(bio, /Chief AI Officer|华大智造首席AI官/);
});

test('labels the two requested publications as privacy-preserving computation', () => {
  const humanGenetics = html.match(/<div class="pub-venue">Human Genetics<\/div>[\s\S]*?<div class="pmeta-row">([\s\S]*?)<\/div>/)?.[1] ?? '';
  const medicalInformatics = html.match(/<div class="pub-venue">International Journal of Medical Informatics<\/div>[\s\S]*?<div class="pmeta-row">([\s\S]*?)<\/div>/)?.[1] ?? '';

  [humanGenetics, medicalInformatics].forEach((metadata) => {
    assert.ok(metadata.includes('Privacy-Preserving Computation'));
    assert.ok(metadata.includes('隐私计算'));
    assert.doesNotMatch(metadata, /Blockchain|区块链/);
  });
});

test('uses a minimal articles heading without a publication count', () => {
  assert.match(html, /<a href="#publications"><span data-lang-content="en">Publications<\/span><span data-lang-content="zh">文章<\/span><\/a>/);
  assert.match(html, /<span data-lang-content="en">Articles<\/span><span data-lang-content="zh">文章<\/span>/);
  assert.doesNotMatch(html, /15 representative articles|15 篇代表性论文/);
});

test('places the Chulalongkorn University adjunct professorship in the biography', () => {
  const roleLine = html.match(/<div class="role-line anim d3">([\s\S]*?)<\/div>/)?.[1] ?? '';
  const bio = html.match(/<div class="bio anim d4">([\s\S]*?)<\/div>/)?.[1] ?? '';

  assert.doesNotMatch(roleLine, /Adjunct professor of Chulalongkorn University|泰国朱拉隆功大学客座教授/);
  assert.ok(bio.includes('a Visiting Researcher at the Shanghai Artificial Intelligence Laboratory, an Adjunct professor of Chulalongkorn University, and a Shenzhen Municipal High-Level Professional Talent'));
  assert.ok(bio.includes('上海人工智能实验室客座研究员、泰国朱拉隆功大学客座教授、深圳市国内高层次人才'));
});

test('uses the contact email in the footer instead of copyright text', () => {
  const footer = html.match(/<footer>([\s\S]*?)<\/footer>/)?.[1] ?? '';

  assert.ok(footer.includes('href="mailto:yangmeng@genoria.ai"'));
  assert.ok(footer.includes('>yangmeng@genoria.ai<'));
  assert.doesNotMatch(footer, /All rights reserved|版权所有|©/);
});
