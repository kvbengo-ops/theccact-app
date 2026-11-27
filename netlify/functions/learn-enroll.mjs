import { createClient } from '@supabase/supabase-js';
import { learningOrigin } from '../../src/lib/learning-sites.mjs';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const response = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });

export const createHandler = (makeClient = createClient) => async (event) => {
  if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed' });
  const token = event.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return response(401, { error: 'Sign in required' });
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, PUBLIC_SUPABASE_ANON_KEY: anon } = process.env;
  if (!url || !key || !anon) return response(500, { error: 'Server is not configured' });
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const caller = makeClient(url, anon, { ...options, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: auth, error: authError } = await caller.auth.getUser(token);
  if (authError || !auth.user) return response(401, { error: 'Sign in required' });
  const { data: admin, error: adminError } = await caller.rpc('is_admin');
  if (adminError || !admin) return response(403, { error: 'Not authorized' });
  let body;
  try { body = JSON.parse(event.body || ''); } catch { return response(400, { error: 'Invalid request' }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return response(400, { error: 'Invalid request' });
  const { action, courseId, userId } = body;
  if (!['list', 'enroll', 'remove', 'correct'].includes(action) || typeof courseId !== 'string') return response(400, { error: 'Invalid request' });
  const service = makeClient(url, key, options);
  const { data: course, error: courseError } = await service.from('courses').select('id,brand').eq('id', courseId).maybeSingle();
  if (courseError) return response(500, { error: 'Could not load course' });
  if (!course || !['ccact', 'cces'].includes(course.brand)) return response(404, { error: 'Course not found' });
  try {
    if (action === 'list') {
      const { data, error } = await service.from('enrollments').select('user_id,student_name,status').eq('course_id', courseId).eq('status', 'active');
      if (error) throw error;
      const students = await Promise.all(data.map(async (row) => {
        const result = await service.auth.admin.getUserById(row.user_id);
        if (result.error) throw result.error;
        return { ...row, email: result.data.user.email };
      }));
      return response(200, { students });
    }
    if (action === 'remove' || action === 'correct') {
      if (typeof userId !== 'string') return response(400, { error: 'Invalid student' });
      const { data: enrollment, error } = await service.from('enrollments').select('user_id').eq('course_id', courseId).eq('user_id', userId).eq('status', 'active').maybeSingle();
      if (error) throw error;
      if (!enrollment) return response(404, { error: 'Enrollment not found' });
      if (action === 'remove') {
        const result = await service.from('enrollments').update({ status: 'removed' }).eq('course_id', courseId).eq('user_id', userId);
        if (result.error) throw result.error;
      } else {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (!emailPattern.test(email) || email.length > 254) return response(400, { error: 'Invalid email' });
        const result = await service.auth.admin.updateUserById(userId, { email, email_confirm: true });
        if (result.error) throw result.error;
      }
      return response(200, { ok: true });
    }
    if (!Array.isArray(body.students) || !body.students.length || body.students.length > 100) return response(400, { error: 'Enter up to 100 students' });
    const students = body.students.map((student) => ({ email: typeof student?.email === 'string' ? student.email.trim().toLowerCase() : '', name: typeof student?.name === 'string' ? student.name.trim() : '' }));
    if (students.some(({ email, name }) => !emailPattern.test(email) || email.length > 254 || name.length > 120) || new Set(students.map((s) => s.email)).size !== students.length) return response(400, { error: 'Check the email addresses, names and duplicates' });
    const origin = learningOrigin(course.brand);
    if (!origin) return response(500, { error: 'Learning site is not configured' });
    const users = new Map();
    for (let page = 1; ; page++) {
      const result = await service.auth.admin.listUsers({ page, perPage: 1000 });
      if (result.error) throw result.error;
      for (const user of result.data.users) if (user.email) users.set(user.email.toLowerCase(), user);
      if (result.data.users.length < 1000) break;
    }
    const results = [];
    for (const student of students) {
      try {
        let user = users.get(student.email);
        if (!user) {
          const result = await service.auth.admin.createUser({ email: student.email, email_confirm: true });
          if (result.error) throw result.error;
          user = result.data.user;
          users.set(student.email, user);
        }
        const existing = await service.from('enrollments').select('student_name').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
        if (existing.error) throw existing.error;
        const saved = await service.from('enrollments').upsert({ user_id: user.id, course_id: courseId, student_name: student.name || existing.data?.student_name || null, status: 'active', enrolled_by: auth.user.id }, { onConflict: 'user_id,course_id' });
        if (saved.error) throw saved.error;
        const sent = await service.auth.signInWithOtp({ email: student.email, options: { shouldCreateUser: false, emailRedirectTo: `${origin}/learn/` } });
        results.push({ email: student.email, ok: !sent.error, enrolled: true, error: sent.error ? 'Enrolled, but sign-in email could not be sent. Retry enrollment.' : undefined });
      } catch { results.push({ email: student.email, ok: false, error: 'Could not enroll this student.' }); }
    }
    return response(200, { results });
  } catch { return response(500, { error: 'Could not complete the request' }); }
};

export const handler = createHandler();
