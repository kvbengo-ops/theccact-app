import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../netlify/functions/learn-enroll.mjs';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'secret';
process.env.PUBLIC_SUPABASE_ANON_KEY = 'public';
process.env.LEARN_CCACT_ORIGIN = 'https://ccact-learning.example';
process.env.LEARN_CCES_ORIGIN = 'https://cces-learning.example';
const event = (body, token = 'jwt') => ({ httpMethod: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, body: JSON.stringify(body) });

test('enrollment requires an authenticated owner before accessing service role', async () => {
  let privileged = false;
  const handler = createHandler((url, key) => {
    if (key === 'secret') privileged = true;
    return { auth: { getUser: async () => ({ data: { user: { id: 'student' } } }) }, rpc: async () => ({ data: false }) };
  });
  assert.equal((await handler(event({ action: 'list', courseId: 'id' }, ''))).statusCode, 401);
  assert.equal((await handler(event({ action: 'list', courseId: 'id' }))).statusCode, 403);
  assert.equal(privileged, false);
});

test('reports partial email failure without losing existing student name', async () => {
  let saved;
  const handler = createHandler((url, key) => {
    if (key === 'public') return { auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) }, rpc: async () => ({ data: true }) };
    return {
      auth: { admin: { listUsers: async () => ({ data: { users: [{ id: 'student', email: 'a@example.com' }] } }) }, signInWithOtp: async () => ({ error: new Error('mail failed') }) },
      from(table) {
        return {
          select() { return this; }, eq() { return this; },
          maybeSingle: async () => ({ data: table === 'courses' ? { id: 'course', brand: 'cces' } : { student_name: 'Existing Name' } }),
          upsert: async (row) => { saved = row; return {}; },
        };
      },
    };
  });
  const result = await handler(event({ action: 'enroll', courseId: 'course', students: [{ email: 'a@example.com' }] }));
  assert.equal(result.statusCode, 200);
  assert.equal(saved.student_name, 'Existing Name');
  assert.deepEqual(JSON.parse(result.body).results[0], { email: 'a@example.com', ok: false, enrolled: true, error: 'Enrolled, but sign-in email could not be sent. Retry enrollment.' });
});

test('bulk enrollment creates accounts and sends brand-specific sign-in links', async () => {
  const saved = [], links = [];
  let listings = 0;
  const handler = createHandler((url, key) => {
    if (key === 'public') return { auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) }, rpc: async () => ({ data: true }) };
    return {
      auth: {
        admin: {
          listUsers: async () => { listings++; return { data: { users: [] } }; },
          createUser: async ({ email }) => ({ data: { user: { id: email, email } } }),
        },
        signInWithOtp: async (options) => { links.push(options); return {}; },
      },
      from(table) {
        return {
          select() { return this; }, eq() { return this; },
          maybeSingle: async () => ({ data: table === 'courses' ? { id: 'course', brand: 'ccact' } : null }),
          upsert: async (row) => { saved.push(row); return {}; },
        };
      },
    };
  });
  const result = await handler(event({ action: 'enroll', courseId: 'course', students: [{ email: 'A@example.com', name: 'Alice' }, { email: 'b@example.com', name: 'Bob' }] }));
  assert.equal(listings, 1);
  assert.deepEqual(saved.map(({ user_id, student_name, enrolled_by }) => [user_id, student_name, enrolled_by]), [['a@example.com', 'Alice', 'owner'], ['b@example.com', 'Bob', 'owner']]);
  assert.ok(links.every(({ options }) => options.emailRedirectTo === 'https://ccact-learning.example/learn/' && options.shouldCreateUser === false));
  assert.ok(JSON.parse(result.body).results.every(({ ok }) => ok));
});

test('removal and email correction require an active enrollment', async () => {
  let active = false, update, changed;
  const handler = createHandler((url, key) => {
    if (key === 'public') return { auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) }, rpc: async () => ({ data: true }) };
    return {
      auth: { admin: { updateUserById: async (...args) => { changed = args; return {}; } } },
      from(table) {
        return {
          select() { return this; },
          eq() { return this; },
          maybeSingle: async () => ({ data: table === 'courses' ? { id: 'course', brand: 'ccact' } : active ? { user_id: 'student' } : null }),
          update(value) { update = value; return this; },
          then(resolve) { resolve({}); },
        };
      },
    };
  });
  const request = { action: 'correct', courseId: 'course', userId: 'student', email: 'new@example.com' };
  assert.equal((await handler(event(request))).statusCode, 404);
  assert.equal(changed, undefined);
  active = true;
  assert.equal((await handler(event({ ...request, email: 'invalid' }))).statusCode, 400);
  assert.equal((await handler(event(request))).statusCode, 200);
  assert.deepEqual(changed, ['student', { email: 'new@example.com', email_confirm: true }]);
  assert.equal((await handler(event({ ...request, action: 'remove' }))).statusCode, 200);
  assert.deepEqual(update, { status: 'removed' });
});

test('rejects malformed batches before creating users', async () => {
  let touched = false;
  const handler = createHandler((url, key) => {
    if (key === 'public') return { auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) }, rpc: async () => ({ data: true }) };
    return { auth: { admin: { listUsers: async () => { touched = true; } } }, from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { id: 'course', brand: 'ccact' } }) }) };
  });
  for (const students of [[], [{ email: 'bad' }], [{ email: 'a@example.com' }, { email: 'A@example.com' }]]) {
    assert.equal((await handler(event({ action: 'enroll', courseId: 'course', students }))).statusCode, 400);
  }
  assert.equal(touched, false);
});

test('missing learning origin stops enrollment before user lookup or creation', async () => {
  const previous = process.env.LEARN_CCACT_ORIGIN;
  delete process.env.LEARN_CCACT_ORIGIN;
  let touched = false;
  try {
    const handler = createHandler((url, key) => {
      if (key === 'public') return { auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) }, rpc: async () => ({ data: true }) };
      return { auth: { admin: { listUsers: async () => { touched = true; } } }, from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { id: 'course', brand: 'ccact' } }) }) };
    });
    const result = await handler(event({ action: 'enroll', courseId: 'course', students: [{ email: 'a@example.com' }] }));
    assert.equal(result.statusCode, 500);
    assert.equal(touched, false);
  } finally { process.env.LEARN_CCACT_ORIGIN = previous; }
});
