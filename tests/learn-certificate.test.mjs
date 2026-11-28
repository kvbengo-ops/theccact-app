import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { createHandler, printable } from '../netlify/functions/learn-certificate.mjs';

process.env.SUPABASE_URL = 'https://db.example';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
process.env.PUBLIC_SUPABASE_ANON_KEY = 'public';

const COURSE = '11111111-1111-4111-8111-111111111111';
const event = (course = COURSE, token = 'token') => ({
  httpMethod: 'GET',
  headers: token ? { authorization: `Bearer ${token}` } : {},
  queryStringParameters: { course },
  rawUrl: `https://learn.example/.netlify/functions/learn-certificate?course=${course}`,
});

function fakeClient(rows, user = { id: 'student', email: 's@example.com', user_metadata: {} }) {
  const seen = [];
  const make = (url, key) => (key === 'public'
    ? { auth: { getUser: async (token) => (token === 'token' ? { data: { user } } : { data: {}, error: new Error('bad') }) } }
    : {
        from(table) {
          const filters = {};
          return {
            select() { return this; },
            eq(column, value) { filters[column] = value; return this; },
            maybeSingle: async () => { seen.push([table, { ...filters }]); return { data: rows[table] ?? null }; },
          };
        },
      });
  return { make, seen };
}

const noLogo = async () => ({ ok: false });

test('certificate download needs a signed-in student and a valid course id', async () => {
  const { make } = fakeClient({});
  const handler = createHandler(make, noLogo);
  assert.equal((await handler(event(COURSE, ''))).statusCode, 401);
  assert.equal((await handler(event(COURSE, 'expired'))).statusCode, 401);
  assert.equal((await handler(event('not-a-uuid'))).statusCode, 400);
  assert.equal((await handler({ ...event(), httpMethod: 'POST' })).statusCode, 405);
});

test('no certificate yet is a 404, and only the caller\'s own certificate is read', async () => {
  const { make, seen } = fakeClient({ courses: { title: 'Course', brand: 'ccact', ce_hours: null } });
  const result = await createHandler(make, noLogo)(event());
  assert.equal(result.statusCode, 404);
  assert.deepEqual(seen.find(([table]) => table === 'certificates')[1], { user_id: 'student', course_id: COURSE });
});

test('a completed course returns a one-page branded PDF', async () => {
  const { make } = fakeClient({
    certificates: { number: 'ABC123DEF456', issued_at: '2026-11-20T15:00:00Z' },
    courses: { title: 'Personal Support Worker Foundations (PSW 101)', brand: 'cces', ce_hours: 3.5 },
    enrollments: { student_name: 'Priya Ramanathan' },
  });
  const result = await createHandler(make, noLogo)(event());
  assert.equal(result.statusCode, 200);
  assert.equal(result.headers['Content-Type'], 'application/pdf');
  assert.match(result.headers['Content-Disposition'], /filename="CCES-certificate-ABC123DEF456\.pdf"/);
  const pdf = await PDFDocument.load(Buffer.from(result.body, 'base64'));
  assert.equal(pdf.getPageCount(), 1);
  assert.equal(pdf.getTitle(), 'CCES certificate ABC123DEF456');
});

test('names outside the standard PDF fonts still print', async () => {
  const font = await (await PDFDocument.create()).embedFont(StandardFonts.TimesRoman);
  assert.equal(printable('José Müller', font), 'José Müller');
  assert.equal(printable('Łukasz', font), 'Lukasz');
  assert.equal(printable('प्रिया Shah', font), '?????? Shah');
});
