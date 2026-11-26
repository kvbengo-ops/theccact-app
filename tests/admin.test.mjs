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
  validateManualPage,
  SLUG_PATTERN,
  validateInvite,
  inviteStatus,
  inviteLink,
  inviteMailto,
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
  assert.match(validateGrant({ ...ok, type: '' }), /individual or an organization/);
  assert.match(validateGrant({ ...ok, bio: '  ' }), /bio/);
  assert.match(validateGrant({ ...ok, referralCode: '' }), /referral code/);
});

test('validateManualPage also needs a name, email and website', () => {
  const ok = { name: 'Maria Santos', email: 'maria@example.com', brand: 'cces', slug: 'maria-santos', type: 'individual', role: 'RN', location: 'Toronto', bio: 'Bio', referralCode: 'MS1' };
  assert.equal(validateManualPage(ok), '');
  assert.match(validateManualPage({ ...ok, name: ' ' }), /name/);
  assert.match(validateManualPage({ ...ok, email: 'maria' }), /email/);
  assert.match(validateManualPage({ ...ok, brand: '' }), /website/);
  assert.match(validateManualPage({ ...ok, referralCode: '' }), /referral code/);
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

test("invites: valid email and type, status, link to the right form, ready-to-send email", () => {
  assert.equal(validateInvite({ email: "a@b.co", type: "individual" }), "");
  assert.match(validateInvite({ email: "nope", type: "individual" }), /email/);
  assert.match(validateInvite({ email: "a@b.co", type: "company" }), /individual or organization/);
  assert.equal(inviteStatus({ used_at: "x", revoked_at: null }), "used");
  assert.equal(inviteStatus({ used_at: null, revoked_at: "x" }), "revoked");
  assert.equal(inviteStatus({ used_at: null, revoked_at: null }), "open");
  assert.equal(inviteLink("https://thecces.com", { type: "organisation", token: "t1" }), "https://thecces.com/affiliate-apply/organisation/?invite=t1");
  assert.equal(inviteLink("https://x.test", { type: "individual", token: "t2" }), "https://x.test/affiliate-apply/individual/?invite=t2");
  const mail = inviteMailto("https://x.test/a?invite=t2", { email: "maria@ex.com", note: "Maria" }, "CCES");
  assert.ok(mail.startsWith("mailto:maria%40ex.com?subject="));
  const body = decodeURIComponent(mail.split("&body=")[1]);
  assert.match(body, /^Hello Maria,/);
  assert.ok(body.includes("https://x.test/a?invite=t2") && body.includes("CCES affiliate"));
});
