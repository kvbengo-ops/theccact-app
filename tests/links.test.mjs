import test from 'node:test';
import assert from 'node:assert/strict';
import { enrolmentUrl, pageUrl } from '../src/lib/links.mjs';

test('preserves route context and rejects invalid routes', () => {
  assert.equal(pageUrl('courses', { slug: 'sample-partner' }), '/partners/sample-partner/courses/');
  assert.equal(pageUrl('', null), '/');
  assert.throws(() => pageUrl('contact', { slug: '../bad' }), /slug/);
  assert.throws(() => pageUrl('about-partner', null), /requires a partner/);
});

test('preserves catalog query and fails closed for unverified referrals', () => {
  const url = 'https://the-canadian-centre-for-advanced-career-traini.teachable.com/l/products?sortKey=name&page=1';
  assert.equal(enrolmentUrl(url), url);
  // Unattributed until CCACT supplies the referral format: partner links still resolve to the CCACT school only.
  assert.equal(enrolmentUrl(url, { slug: 'sample', referralCode: 'X' }), url);
  assert.throws(() => enrolmentUrl('https://example.com/'), /Teachable/);
});
