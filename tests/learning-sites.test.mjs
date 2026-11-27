import test from 'node:test';
import assert from 'node:assert/strict';
import { learningOrigin, learningRedirects } from '../src/lib/learning-sites.mjs';

test('learning origins accept only configured HTTPS origins for the requested brand', () => {
  const env = { LEARN_CCACT_ORIGIN: 'https://learn-a.netlify.app/', LEARN_CCES_ORIGIN: 'https://learn-b.netlify.app' };
  assert.equal(learningOrigin('ccact', env), 'https://learn-a.netlify.app');
  assert.equal(learningOrigin('cces', env), 'https://learn-b.netlify.app');
  for (const invalid of ['http://example.com', 'https://example.com/path', 'https://example.com/?x=1', 'https://user@example.com', 'nonsense']) {
    assert.equal(learningOrigin('ccact', { LEARN_CCACT_ORIGIN: invalid }), null);
  }
  assert.equal(learningOrigin('unknown', env), null);
});

test('website redirects learning routes and preserves existing redirects', () => {
  const rules = learningRedirects({ app: 'site', origin: 'https://learn-a.netlify.app', pages: [], existing: '/partners/ /affiliates/ 301\n' });
  assert.match(rules, /^\/learn https:\/\/learn-a\.netlify\.app\/learn\/ 302!/);
  assert.match(rules, /\/learn\/\* https:\/\/learn-a\.netlify\.app\/learn\/:splat 302!/);
  assert.match(rules, /\/partners\/ \/affiliates\/ 301/);
});

test('learning build redirects website pages but leaves learning pages and static assets available', () => {
  const rules = learningRedirects({ app: 'learn', pages: ['index.html', 'admin/index.html', 'about/index.html', 'learn/index.html', 'learn/course/index.html', '_astro/app.js'], existing: '/partners/ /affiliates/ 301' });
  for (const rule of ['/ /learn/ 302!', '/index.html /learn/ 302!', '/admin/* /learn/ 302!', '/admin/index.html /learn/ 302!', '/about/ /learn/ 302!', '/about/index.html /learn/ 302!', '/* /learn/ 302']) assert.ok(rules.includes(rule));
  assert.doesNotMatch(rules, /\/learn\/index\.html|\/_astro\/app\.js|\/partners\/ \/affiliates/);
});
