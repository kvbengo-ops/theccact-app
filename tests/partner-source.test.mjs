import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLivePartners } from '../src/lib/partner-source.mjs';

const options = { url: 'https://example.supabase.co', key: 'secret' };
const partner = { slug: 'sample', name: 'Sample', type: 'individual', referralCode: 'code', bio: 'Bio', role: 'Nurse', location: 'Toronto', email: 'test@example.org', approvalDate: '2026-11-20', status: 'live', contentReviewedDate: '2026-11-20', partnerApprovedDate: '2026-11-20', image: null, website: null, languages: null, services: null };

test('loads only validated live records without exposing secrets in errors', async () => {
  const records = await loadLivePartners({ ...options, fetcher: async (url, request) => {
    assert.equal(url.searchParams.get('status'), 'eq.live');
    assert.equal(url.searchParams.get('brand'), 'eq.ccact');
    assert.equal(request.headers.apikey, 'secret');
    return { ok: true, json: async () => [{ ...partner }] };
  } });
  assert.equal(records[0].name, 'Sample');
  await loadLivePartners({ ...options, brand: 'cces', fetcher: async (url) => {
    assert.equal(url.searchParams.get('brand'), 'eq.cces');
    return { ok: true, json: async () => [] };
  } });
  assert.equal(records[0].image, undefined);
  await assert.rejects(loadLivePartners({ ...options, fetcher: async () => ({ ok: false, status: 403 }) }), /HTTP 403/);
  await assert.rejects(loadLivePartners({ ...options, fetcher: async () => ({ ok: true, json: async () => [{ ...partner, status: 'draft' }] }) }), /non-live/);
});

test('fails closed on partial configuration and production without credentials', async () => {
  assert.deepEqual(await loadLivePartners(), []);
  await assert.rejects(loadLivePartners({ required: true }), /required/);
  await assert.rejects(loadLivePartners({ url: 'https://example.supabase.co' }), /required/);
  await assert.rejects(loadLivePartners({ ...options, url: 'http://example.com' }), /HTTPS/);
});
