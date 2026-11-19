import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAffiliate } from '../src/scripts/affiliate-portal.mjs';

test('loads only the signed-in user application and propagates lookup failures', async () => {
  const client = (user, data, error = null) => ({
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from: table => {
      assert.equal(table, 'affiliate_applications');
      return { select: fields => { assert.equal(fields, 'name,status'); return { maybeSingle: async () => ({ data, error }) }; } };
    },
  });
  assert.equal(await loadAffiliate(client(null, null)), null);
  assert.deepEqual(await loadAffiliate(client({ id: '1' }, { name: 'Ada', status: 'approved' })), { user: { id: '1' }, application: { name: 'Ada', status: 'approved' } });
  assert.deepEqual((await loadAffiliate(client({ id: '1' }, { name: 'Ada', status: 'pending' }))).application.status, 'pending');
  await assert.rejects(loadAffiliate(client({ id: '1' }, null, { message: 'private detail' })), /Unable to check/);
});
