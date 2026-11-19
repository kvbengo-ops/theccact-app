import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countByStatus,
  initials,
  validateNewPassword,
  validateAvatar,
  CONTENT_FIELDS,
  matchesQuery,
  slugify,
  validateGrant,
  SLUG_PATTERN,
} from '../src/lib/admin-helpers.mjs';

test('slugify makes URL-safe partner slugs that pass the database rule', () => {
  assert.equal(slugify('Maria Santos'), 'maria-santos');
  assert.equal(slugify('  José   Núñez!! '), 'jose-nunez');
  assert.equal(slugify('ACME Care, Inc.'), 'acme-care-inc');
  assert.equal(slugify('***'), '');
  for (const name of ['Maria Santos', 'José Núñez', 'A--B', 'x'.repeat(80)]) assert.match(slugify(name), SLUG_PATTERN);
});

test('validateGrant requires a valid slug, type and every content field', () => {
  const ok = { slug: 'maria-santos', type: 'individual', role: 'RN', location: 'Toronto', bio: 'Bio', referralCode: 'MS1' };
  assert.equal(validateGrant(ok), '');
  assert.match(validateGrant({ ...ok, slug: 'Maria Santos' }), /lowercase/);
  assert.match(validateGrant({ ...ok, slug: 'a--b' }), /lowercase/);
  assert.match(validateGrant({ ...ok, type: '' }), /individual or an organisation/);
  assert.match(validateGrant({ ...ok, bio: '  ' }), /bio/);
  assert.match(validateGrant({ ...ok, referralCode: '' }), /referral code/);
});

test('matchesQuery searches name, email, role and location', () => {
  const row = { name: 'Maria Santos', email: 'maria@example.com', role: 'RN', location: 'Toronto', introduction: 'secret' };
  assert.ok(matchesQuery(row, ''));
  assert.ok(matchesQuery(row, '  santos '));
  assert.ok(matchesQuery(row, 'EXAMPLE.COM'));
  assert.ok(matchesQuery(row, 'toronto'));
  assert.ok(!matchesQuery(row, 'secret'));
  assert.ok(matchesQuery({ name: 'A', email: null }, 'a'));
});

test('countByStatus tallies each status and the total', () => {
  const rows = [{ status: 'pending' }, { status: 'pending' }, { status: 'approved' }, { status: 'rejected' }];
  assert.deepEqual(countByStatus(rows), { all: 4, pending: 2, approved: 1, rejected: 1 });
  assert.deepEqual(countByStatus([]), { all: 0, pending: 0, approved: 0, rejected: 0 });
});

test('initials handles one word, many words and empty input', () => {
  assert.equal(initials('Maria Santos'), 'MS');
  assert.equal(initials('maria'), 'MA');
  assert.equal(initials('Ana Maria de la Cruz'), 'AC');
  assert.equal(initials(''), '?');
  assert.equal(initials(null), '?');
});

test('validateNewPassword enforces length and matching', () => {
  assert.match(validateNewPassword('short', 'short'), /at least 12/);
  assert.match(validateNewPassword('a-long-enough-pass', 'different-long-pass'), /do not match/);
  assert.equal(validateNewPassword('a-long-enough-pass', 'a-long-enough-pass'), '');
});

test('validateAvatar rejects wrong type, oversize and missing files', () => {
  assert.match(validateAvatar(null), /Choose/);
  assert.match(validateAvatar({ type: 'image/gif', size: 100 }), /JPG, PNG or WebP/);
  assert.match(validateAvatar({ type: 'image/png', size: 3 * 1024 * 1024 }), /2 MB/);
  assert.equal(validateAvatar({ type: 'image/webp', size: 1024 }), '');
});

test('content field keys match the database allow-list', () => {
  assert.deepEqual(
    CONTENT_FIELDS.map((f) => f.key),
    ['announcement', 'hero_lead', 'courses_lead', 'footer_tagline'],
  );
  assert.ok(CONTENT_FIELDS.every((f) => f.max <= 400));
});
