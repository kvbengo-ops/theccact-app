import test from 'node:test';
import assert from 'node:assert/strict';
import { enrolmentUrl, pageUrl } from '../src/lib/links.mjs';

test('preserves route context and rejects invalid routes', () => {
  assert.equal(pageUrl('courses', { slug: 'sample-partner' }), '/partners/sample-partner/courses/');
  assert.equal(pageUrl('', null), '/');
  assert.throws(() => pageUrl('contact', { slug: '../bad' }), /slug/);
  assert.throws(() => pageUrl('about-partner', null), /requires a partner/);
});

test('preserves catalog query, adds CCACT affcode, rejects other hosts', () => {
  const url = 'https://thecces.teachable.com/l/products?sortKey=recommended&sortDirection=asc';
  const expected = `${url}&affcode=1360772_ayijgwbz`;
  assert.equal(enrolmentUrl(url), expected);
  assert.equal(enrolmentUrl(url, { slug: 'sample', referralCode: '999_partner' }), `${url}&affcode=999_partner`);
  assert.throws(() => enrolmentUrl('https://the-canadian-centre-for-advanced-career-traini.teachable.com/'), /Teachable/);
  assert.throws(() => enrolmentUrl('https://example.com/'), /Teachable/);
});
