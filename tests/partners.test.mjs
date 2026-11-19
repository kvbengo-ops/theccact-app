import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePartners, publicPartners, canTransition } from '../src/lib/partners.mjs';

const partner = {
  slug: 'example-person', name: 'Example Person', type: 'individual', referralCode: 'sample',
  bio: 'Example only', role: 'Nurse', location: 'Toronto, Canada', email: 'example@example.org',
  approvalDate: '2026-11-19', status: 'live', contentReviewedDate: '2026-11-19', partnerApprovedDate: '2026-11-19',
};

test('validates records and excludes non-live partners', () => {
  assert.equal(publicPartners([partner, { ...partner, slug: 'other', status: 'suspended' }]).length, 1);
  assert.throws(() => validatePartners([partner, partner]), /duplicate slug/);
  assert.throws(() => validatePartners([{ ...partner, partnerApprovedDate: undefined }]), /approval dates/);
  assert.throws(() => validatePartners([{ ...partner, approvalDate: '2026-02-30' }]), /approval date/);
  assert.throws(() => validatePartners([{ ...partner, slug: '../unsafe' }]), /slug/);
  assert.throws(() => validatePartners([{ ...partner, email: 'bad' }]), /email/);
  assert.throws(() => validatePartners([{ ...partner, referralCode: '' }]), /referralCode/);
});

test('allows retirement and restoration without bypassing initial review', () => {
  assert.equal(canTransition('live', 'retired'), true);
  assert.equal(canTransition('suspended', 'live'), true);
  assert.equal(canTransition('draft', 'live'), false);
  assert.equal(canTransition('retired', 'live'), false);
});

test('loadLivePartners can load preview pages for local dev but rejects unexpected statuses', async () => {
  const { loadLivePartners } = await import('../src/lib/partner-source.mjs');
  const base = { slug: 'a-b', name: 'A', type: 'individual', referralCode: 'R', bio: 'B', role: 'RN', location: 'T', email: 'a@b.co', approvalDate: '2026-11-19' };
  const fetcher = (rows, seen) => async (url) => { seen.push(url.searchParams.get('status')); return { ok: true, json: async () => rows }; };
  const seen = [];
  const rows = [{ ...base, status: 'preview', contentReviewedDate: '2026-11-19' }];
  const got = await loadLivePartners({ url: 'https://x.supabase.co', key: 'k', fetcher: fetcher(rows, seen), statuses: ['live', 'preview'] });
  assert.equal(got.length, 1);
  assert.equal(seen[0], 'in.(live,preview)');
  await assert.rejects(loadLivePartners({ url: 'https://x.supabase.co', key: 'k', fetcher: fetcher(rows, []) }), /unexpected partner status: preview/);
});
