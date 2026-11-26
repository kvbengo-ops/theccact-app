import test from 'node:test';
import assert from 'node:assert/strict';
import { submitApplication, toApplication } from '../src/scripts/affiliate-apply.mjs';

test('submits only a valid application for the signed-in user', async () => {
  let submitted;
  const client = { from: table => ({ insert: async row => { assert.equal(table, 'affiliate_applications'); submitted = row; return { error: null }; } }) };
  await submitApplication(client, { id: 'user-1' }, { name: '  Ada  ', location: ' Toronto ' });
  assert.deepEqual(submitted, { user_id: 'user-1', name: 'Ada', location: 'Toronto', role: null, introduction: null });
  await assert.rejects(submitApplication(client, null, { name: 'Ada' }), /sign in/);
  await assert.rejects(submitApplication(client, { id: 'user-1' }, { name: ' ' }), /valid name/);
  await assert.rejects(submitApplication(client, { id: 'user-1' }, { name: 'Ada', introduction: 'x'.repeat(2001) }), /length/);
});

test('reports duplicate and failed submissions without exposing server errors', async () => {
  const client = code => ({ from: () => ({ insert: async () => ({ error: { code, message: 'private detail' } }) }) });
  await assert.rejects(submitApplication(client('23505'), { id: '1' }, { name: 'Ada' }), /already submitted/);
  await assert.rejects(submitApplication(client('other'), { id: '1' }, { name: 'Ada' }), /could not be submitted/);
});

test('organisation applications need a contact and a secure website; extras are sent only when filled', async () => {
  let submitted;
  const client = { from: () => ({ insert: async row => { submitted = row; return { error: null }; } }) };
  await submitApplication(client, { id: 'u' }, { name: 'ACME Care', type: 'organisation', contact_name: ' Lee ', website: 'https://acme.example', languages: '' });
  assert.deepEqual(submitted, { user_id: 'u', name: 'ACME Care', location: null, role: null, introduction: null, type: 'organisation', contact_name: 'Lee', website: 'https://acme.example' });
  await assert.rejects(submitApplication(client, { id: 'u' }, { name: 'ACME', type: 'organisation' }), /contact person/);
  await assert.rejects(submitApplication(client, { id: 'u' }, { name: 'ACME', type: 'organisation', contact_name: 'Lee', website: 'http://acme.example' }), /https/);
  await assert.rejects(submitApplication(client, { id: 'u' }, { name: 'Ada', type: 'robot' }), /individual or organization/);
  await submitApplication(client, { id: 'u' }, { name: 'Ada', type: 'individual', languages: 'English, Tagalog' });
  assert.equal(submitted.languages, 'English, Tagalog');
  assert.equal(submitted.type, 'individual');
});

test('full applications map to the review columns and keep every answer except login details', async () => {
  const ind = toApplication({ type: 'individual', fullLegalName: ' Ada Lovelace ', preferredName: '', email: 'a@x.ca', password: 'secret123', city: 'Toronto', country: 'Canada', currentOccupation: 'RN', website: 'http://ada.example', healthcareConnections: ['Nurse / Practical Nurse'], networkAudience: [] });
  assert.equal(ind.name, 'Ada Lovelace');
  assert.equal(ind.location, 'Toronto, Canada');
  assert.equal(ind.role, 'RN');
  assert.equal(ind.website, '');
  assert.deepEqual(Object.keys(ind.answers).sort(), ['city', 'country', 'currentOccupation', 'fullLegalName', 'healthcareConnections', 'type', 'website']);
  const org = toApplication({ type: 'organisation', contactName: 'Lee', companyName: 'ACME Care', categories: ['Nursing School or College', 'Career Consultant'], website: 'https://acme.example' });
  assert.equal(org.name, 'ACME Care');
  assert.equal(org.role, 'Nursing School or College, Career Consultant');
  let submitted;
  const client = { from: () => ({ insert: async row => { submitted = row; return { error: null }; } }) };
  await submitApplication(client, { id: 'u' }, org);
  assert.equal(submitted.contact_name, 'Lee');
  assert.equal(submitted.website, 'https://acme.example');
  assert.deepEqual(submitted.answers.categories, ['Nursing School or College', 'Career Consultant']);
  assert.throws(() => toApplication({ type: 'individual', fullLegalName: 'A', professionalBackground: 'x'.repeat(40001) }), /too long/);
});

test('invite links: only a well-formed token is read, and only an open invite is returned', async () => {
  const { inviteToken, loadInvite } = await import('../src/scripts/affiliate-apply.mjs');
  const token = '0f8fad5b-d9cb-469f-a165-70867728950e';
  assert.equal(inviteToken(`?invite=${token.toUpperCase()}`), token);
  assert.equal(inviteToken('?invite=not-a-token'), '');
  assert.equal(inviteToken(''), '');
  const client = rows => ({ rpc: async (name, args) => { assert.equal(name, 'invite_details'); assert.equal(args.invite_token, token); return rows; } });
  assert.deepEqual(await loadInvite(client({ data: [{ email: 'a@b.co', type: 'individual' }], error: null }), token), { email: 'a@b.co', type: 'individual' });
  assert.equal(await loadInvite(client({ data: [], error: null }), token), null);
  assert.equal(await loadInvite(client({ data: null, error: { code: 'x' } }), token), null);
  assert.equal(await loadInvite({ rpc: () => { throw new Error('should not call'); } }, ''), null);
});

test('a submission blocked by the invite rule explains why', async () => {
  const client = { from: () => ({ insert: async () => ({ error: { code: '42501', message: 'private detail' } }) }) };
  await assert.rejects(submitApplication(client, { id: '1' }, { name: 'Ada' }), /invitation is no longer valid/);
});
