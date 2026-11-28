import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authRedirectError,
  googleSignInEnabled,
  checkCheckoutDetails,
  checkStudentDetails,
  saveStudentProfile,
  selfEnroll,
  loadCheckoutCourse,
  startCheckout,
  courseMatches,
  loadLearningOverview,
  checkNewPassword,
  signInStudentWithPassword,
  collectAnswers,
  loadLessonData,
  buildLoginUrl,
  fetchCertificatePdf,
  formatDuration,
  groupOutlineByModule,
  loadCourseOverviewData,
  loadDashboardData,
  loadStudentUser,
  partitionBrandCourses,
  sanitizeLearnNext,
  sendStudentSignInLink,
} from '../src/scripts/learn-helpers.mjs';

test('sanitizeLearnNext and buildLoginUrl allow only safe /learn/ destinations and prevent loops', () => {
  assert.equal(sanitizeLearnNext('/learn/course/?id=123'), '/learn/course/?id=123');
  assert.equal(sanitizeLearnNext('/learn'), '/learn/');
  assert.equal(sanitizeLearnNext('/learn/login/'), '/learn/');
  assert.equal(sanitizeLearnNext('/learn/login?next=/learn/'), '/learn/');
  assert.equal(sanitizeLearnNext('/admin/'), '/learn/');
  assert.equal(sanitizeLearnNext('https://evil.example/learn/'), '/learn/');
  assert.equal(sanitizeLearnNext('//evil.example/learn/'), '/learn/');
  assert.equal(sanitizeLearnNext('javascript:alert(1)'), '/learn/');

  assert.equal(buildLoginUrl('/learn/'), '/learn/login/');
  assert.equal(buildLoginUrl('/learn/course/?id=abc'), '/learn/login/?next=%2Flearn%2Fcourse%2F%3Fid%3Dabc');
  assert.equal(buildLoginUrl('/learn/', 'expired'), '/learn/login/?auth_error=expired');
});

test('loadStudentUser handles signed-in, missing session, stale 401, and server failures', async () => {
  const signedIn = await loadStudentUser({
    auth: { getUser: async () => ({ data: { user: { id: 'u1', email: 'nurse@example.com' } }, error: null }) },
  });
  assert.equal(signedIn.email, 'nurse@example.com');

  const signedOut = await loadStudentUser({
    auth: { getUser: async () => ({ data: { user: null }, error: { name: 'AuthSessionMissingError' } }) },
  });
  assert.equal(signedOut, null);

  let clearedLocal = false;
  const stale = await loadStudentUser({
    auth: {
      getUser: async () => ({ data: { user: null }, error: { name: 'AuthApiError', status: 401, code: 'bad_jwt' } }),
      signOut: async ({ scope }) => { clearedLocal = scope === 'local'; },
    },
  });
  assert.equal(stale, null);
  assert.equal(clearedLocal, true);

  await assert.rejects(
    loadStudentUser({ auth: { getUser: async () => ({ data: { user: null }, error: { name: 'AuthRetryableFetchError', message: 'secret detail' } }) } }),
    /Unable to check your account/,
  );
});

test('sendStudentSignInLink disables signup, masks unknown emails (otp_disabled), and maps rate limits safely', async () => {
  await assert.rejects(sendStudentSignInLink({}, 'not-an-email', 'https://x.test/learn/'), /valid email/);

  let received = null;
  const okClient = {
    auth: {
      signInWithOtp: async (payload) => {
        received = payload;
        return { error: null };
      },
    },
  };
  const result = await sendStudentSignInLink(okClient, '  student@example.com  ', 'https://theccact.netlify.app/learn/');
  assert.deepEqual(result, { email: 'student@example.com' });
  assert.deepEqual(received, {
    email: 'student@example.com',
    options: { emailRedirectTo: 'https://theccact.netlify.app/learn/', shouldCreateUser: false },
  });

  const unknownClient = {
    auth: {
      signInWithOtp: async () => ({
        error: { status: 422, code: 'otp_disabled', message: 'Signups not allowed for otp' },
      }),
    },
  };
  const unknownResult = await sendStudentSignInLink(unknownClient, 'stranger@example.com', 'https://theccact.netlify.app/learn/');
  assert.deepEqual(unknownResult, { email: 'stranger@example.com' });

  const rateLimited = {
    auth: { signInWithOtp: async () => ({ error: { status: 429, message: 'For security purposes, you can only request this after 45 seconds.' } }) },
  };
  await assert.rejects(sendStudentSignInLink(rateLimited, 'student@example.com', 'https://x.test/learn/'), /wait a moment/);

  const serverFailed = {
    auth: { signInWithOtp: async () => ({ error: { status: 500, message: 'internal detail' } }) },
  };
  await assert.rejects(sendStudentSignInLink(serverFailed, 'student@example.com', 'https://x.test/learn/'), /Could not send/);
});

test('partitionBrandCourses filters strictly by brand, formats progress, and puts completed courses below active', () => {
  const rows = [
    {
      course_id: '11111111-1111-4111-8111-111111111111',
      brand: 'ccact',
      title: 'Finished Course',
      description: 'Done',
      image: 'javascript:alert(1)',
      total_minutes: 90,
      total_lessons: 10,
      done_lessons: 10,
      next_lesson_id: null,
      certificate_number: 'CERT1234',
    },
    {
      course_id: '22222222-2222-4222-8222-222222222222',
      brand: 'cces',
      title: 'CCES Only Course',
      description: 'Should never show on CCACT',
      image: 'https://cdn.example.com/cces.jpg',
      total_minutes: 30,
      total_lessons: 4,
      done_lessons: 1,
      next_lesson_id: 'aaaa1111-1111-4111-8111-111111111111',
      certificate_number: null,
    },
    {
      course_id: '33333333-3333-4333-8333-333333333333',
      brand: 'ccact',
      title: 'Gerontology Nursing',
      description: 'Active',
      image: 'https://cdn.example.com/gn.webp',
      total_minutes: 75,
      total_lessons: 14,
      done_lessons: 6,
      next_lesson_id: 'bbbb2222-2222-4222-8222-222222222222',
      certificate_number: null,
    },
    {
      course_id: '44444444-4444-4444-8444-444444444444',
      brand: 'ccact',
      title: 'Empty Course',
      description: 'No lessons yet',
      image: null,
      total_minutes: 0,
      total_lessons: 0,
      done_lessons: 0,
      next_lesson_id: null,
      certificate_number: null,
    },
  ];

  const ccact = partitionBrandCourses(rows, 'ccact');
  assert.deepEqual(ccact.active.map((c) => c.title), ['Gerontology Nursing', 'Empty Course']);
  assert.deepEqual(ccact.completed.map((c) => c.title), ['Finished Course']);
  assert.equal(ccact.active[0].progressText, '6 of 14 lessons');
  assert.equal(ccact.active[0].progressPercent, 43);
  assert.equal(ccact.active[0].image, 'https://cdn.example.com/gn.webp');
  assert.equal(ccact.completed[0].image, null);
  assert.equal(ccact.completed[0].complete, true);
  assert.equal(ccact.active[1].complete, false);

  const cces = partitionBrandCourses(rows, 'cces');
  assert.deepEqual(cces.active.map((c) => c.title), ['CCES Only Course']);
  assert.equal(cces.completed.length, 0);
});

test('loadDashboardData and loadCourseOverviewData guard brand isolation, invalid IDs, and outline grouping', async () => {
  const courseId = '33333333-3333-4333-8333-333333333333';
  const ccesCourseId = '22222222-2222-4222-8222-222222222222';
  const outlineCalls = [];
  const client = {
    rpc: async (fn, args) => {
      if (fn === 'learn_my_courses') {
        return {
          data: [
            {
              course_id: courseId,
              brand: 'ccact',
              title: 'Canadian Health Care System',
              description: 'Standards',
              image: null,
              total_minutes: 25,
              total_lessons: 3,
              done_lessons: 1,
              next_lesson_id: 'l2',
              certificate_number: null,
            },
            {
              course_id: ccesCourseId,
              brand: 'cces',
              title: 'CCES Course',
              description: '',
              image: null,
              total_minutes: 10,
              total_lessons: 1,
              done_lessons: 0,
              next_lesson_id: 'l9',
              certificate_number: null,
            },
          ],
          error: null,
        };
      }
      if (fn === 'learn_course_outline') {
        outlineCalls.push(args.p_course);
        return {
          data: [
            { module_id: 'm1', module_title: 'Foundations', lesson_id: 'l1', lesson_title: 'Intro', length_minutes: 5, done: true, unlocked: true },
            { module_id: 'm1', module_title: 'Foundations', lesson_id: 'l2', lesson_title: 'Ethics', length_minutes: 10, done: false, unlocked: true },
            { module_id: 'm2', module_title: 'Practice', lesson_id: 'l3', lesson_title: 'Consent', length_minutes: 10, done: false, unlocked: false },
          ],
          error: null,
        };
      }
      throw new Error(`Unexpected RPC: ${fn}`);
    },
  };

  assert.equal(await loadCourseOverviewData(client, 'ccact', 'not-a-uuid'), null);
  assert.equal(await loadCourseOverviewData(client, 'ccact', ccesCourseId), null);
  assert.deepEqual(outlineCalls, []);

  const detail = await loadCourseOverviewData(client, 'ccact', courseId);
  assert.equal(detail.course.title, 'Canadian Health Care System');
  assert.equal(detail.modules.length, 2);
  assert.equal(detail.modules[0].doneCount, 1);
  assert.equal(detail.modules[0].totalCount, 2);
  assert.equal(detail.modules[1].lessons[0].unlocked, false);
  assert.equal(detail.firstLessonId, 'l1');
  assert.equal(detail.nextLessonId, 'l2');

  const failingClient = { rpc: async () => ({ data: null, error: { message: 'db secret' } }) };
  await assert.rejects(loadDashboardData(failingClient, 'ccact'), /Unable to load your courses/);
});

test('fetchCertificatePdf sends bearer JWT and handles unavailable or unauthorized responses', async () => {
  const courseId = '11111111-1111-4111-8111-111111111111';
  const client = {
    auth: { getSession: async () => ({ data: { session: { access_token: 'jwt-123' } }, error: null }) },
  };
  let seenAuth = '';
  let seenUrl = '';
  const { blob, filename } = await fetchCertificatePdf(client, courseId, {
    fetchImpl: async (url, init) => {
      seenUrl = url;
      seenAuth = init.headers.Authorization;
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'attachment; filename="ccact-certificate.pdf"' },
        blob: async () => new Blob(['pdf']),
      };
    },
  });
  assert.equal(seenUrl, `/.netlify/functions/learn-certificate?course=${courseId}`);
  assert.equal(seenAuth, 'Bearer jwt-123');
  assert.equal(filename, 'ccact-certificate.pdf');
  assert.equal(await blob.text(), 'pdf');

  await assert.rejects(
    fetchCertificatePdf(client, courseId, { fetchImpl: async () => ({ ok: false, status: 404 }) }),
    /not available yet/,
  );
  await assert.rejects(
    fetchCertificatePdf({ auth: { getSession: async () => ({ data: { session: null }, error: null }) } }, courseId),
    /session has expired/,
  );
});

test('formatDuration, groupOutlineByModule, and authRedirectError cover edge cases', () => {
  assert.equal(formatDuration(0), '');
  assert.equal(formatDuration(12), '12 min');
  assert.equal(formatDuration(60), '1 hr');
  assert.equal(formatDuration(85), '1 hr 25 min');

  const emptyOutline = groupOutlineByModule([]);
  assert.deepEqual(emptyOutline, { modules: [], totalLessons: 0, doneLessons: 0, firstLessonId: null, nextLessonId: null });

  assert.match(authRedirectError('?auth_error=expired', ''), /expired/);
  assert.match(authRedirectError('', '#error=access_denied&error_code=otp_expired'), /expired/);
  assert.equal(authRedirectError('', ''), '');
});

test('loadLessonData separates locked and missing lessons; collectAnswers needs every question', async () => {
  const lessonId = '11111111-1111-4111-8111-111111111111';
  const fail = (message) => ({ rpc: async () => ({ data: null, error: { code: '42501', message } }) });
  assert.equal((await loadLessonData(fail('Lesson locked'), 'ccact', lessonId)).state, 'locked');
  assert.equal((await loadLessonData(fail('Not authorized'), 'ccact', lessonId)).state, 'missing');
  assert.equal((await loadLessonData({}, 'ccact', 'nope')).state, 'missing');

  const questions = [{ question_id: 'a' }, { question_id: 'b' }];
  assert.equal(collectAnswers(questions, [['a', '1']]), null);
  assert.deepEqual(collectAnswers(questions, [['a', '1'], ['b', '0'], ['b', '2']]), { a: [1], b: [0, 2] });
});

test('checkNewPassword and password sign-in errors stay safe', async () => {
  assert.match(checkNewPassword('short1', 'short1'), /8 characters/);
  assert.match(checkNewPassword('onlyletters', 'onlyletters'), /letter and one number/);
  assert.match(checkNewPassword('12345678', '12345678'), /letter and one number/);
  assert.match(checkNewPassword('goodpass1', 'goodpass2'), /do not match/);
  assert.match(checkNewPassword('é'.repeat(37) + '1', 'é'.repeat(37) + '1'), /72/);
  assert.equal(checkNewPassword('goodpass1', 'goodpass1'), '');

  const fail = (error) => ({ auth: { signInWithPassword: async () => ({ error }) } });
  await assert.rejects(signInStudentWithPassword(fail(null), 'bad', 'x'), /Enter your email/);
  await assert.rejects(signInStudentWithPassword(fail({ status: 400, message: 'Invalid login credentials' }), 'a@b.co', 'x'), /incorrect/);
  await assert.rejects(signInStudentWithPassword(fail({ status: 429 }), 'a@b.co', 'x'), /Too many/);
  await signInStudentWithPassword(fail(null), ' a@b.co ', 'x');
});

test('loadLearningOverview finds next lessons, time left and the course touched last; courseMatches filters', async () => {
  const row = (id, done, total) => ({ course_id: id, brand: 'ccact', title: `Course ${id}`, description: 'Nursing', total_minutes: 30, total_lessons: total, done_lessons: done, next_lesson_id: done < total ? `${id}-l${done + 1}` : null, certificate_number: done === total ? 'N1' : null });
  const outline = { a: [['a-l1', true, 5], ['a-l2', false, 8], ['a-l3', false, 7]], b: [['b-l1', false, 4]] };
  const table = (data) => {
    const chain = { select: () => chain, order: () => chain, not: () => chain, limit: async () => ({ data, error: null }) };
    return chain;
  };
  const client = {
    rpc: async (fn, args) => fn === 'learn_my_courses'
      ? { data: [row('a', 1, 3), row('b', 0, 1), row('c', 2, 2)], error: null }
      : { data: outline[args.p_course].map(([lesson_id, done, length_minutes], i) => ({ lesson_id, done, length_minutes, lesson_title: `Lesson ${i + 1}` })), error: null },
    from: (name) => table(name === 'lesson_progress' ? [{ lesson_id: 'b-l1' }] : [{ student_name: 'Ana Cruz' }]),
  };
  const overview = await loadLearningOverview(client, 'ccact');
  assert.deepEqual(overview.active.map((c) => c.courseId), ['a', 'b']);
  assert.equal(overview.completed[0].courseId, 'c');
  assert.deepEqual(overview.active[0].next, { lessonId: 'a-l2', title: 'Lesson 2', number: 2 });
  assert.equal(overview.active[0].minutesLeft, 15);
  assert.equal(overview.current.courseId, 'b');
  assert.equal(overview.studentName, 'Ana Cruz');

  const course = overview.active[0];
  assert.equal(courseMatches(course, 'all', 'nurs'), true);
  assert.equal(courseMatches(course, 'done', ''), false);
  assert.equal(courseMatches(overview.completed[0], 'done', 'course c'), true);
  assert.equal(courseMatches(course, 'active', 'zzz'), false);
});

test('test checkout: other-brand courses hidden, details checked, sign-up link requested', async () => {
  const id = '11111111-1111-4111-8111-111111111111';
  const rpc = (brand) => ({ rpc: async () => ({ data: [{ course_id: id, brand, title: 'Sample' }], error: null }) });
  assert.equal((await loadCheckoutCourse(rpc('ccact'), 'ccact', id)).title, 'Sample');
  assert.equal(await loadCheckoutCourse(rpc('cces'), 'ccact', id), null);
  assert.equal(await loadCheckoutCourse(rpc('ccact'), 'ccact', 'nope'), null);

  assert.match(checkCheckoutDetails('', 'a@b.co'), /full name/);
  assert.match(checkCheckoutDetails('Ana', 'bad'), /valid email/);
  assert.equal(checkCheckoutDetails('Ana Cruz', 'a@b.co'), '');

  let sent;
  await startCheckout({ auth: { signInWithOtp: async (payload) => { sent = payload; return { error: null }; } } },
    { name: ' Ana Cruz ', email: ' a@b.co ' }, 'http://x.test/learn/checkout/?course=1&confirm=1');
  assert.deepEqual(sent, { email: 'a@b.co', options: { emailRedirectTo: 'http://x.test/learn/checkout/?course=1&confirm=1', shouldCreateUser: true, data: { full_name: 'Ana Cruz' } } });
  await assert.rejects(startCheckout({ auth: { signInWithOtp: async () => ({ error: { status: 429 } }) } }, { name: 'A', email: 'a@b.co' }, 'x'), /wait a moment/);
});

test('googleSignInEnabled reads the Supabase auth settings and fails closed', async () => {
  const reply = (body, ok = true) => async () => ({ ok, json: async () => body });
  assert.equal(await googleSignInEnabled('https://x.supabase.co', 'k', { fetchImpl: reply({ external: { google: true } }) }), true);
  assert.equal(await googleSignInEnabled('https://x.supabase.co', 'k', { fetchImpl: reply({ external: { google: false } }) }), false);
  assert.equal(await googleSignInEnabled('https://x.supabase.co', 'k', { fetchImpl: reply({}, false) }), false);
  assert.equal(await googleSignInEnabled('https://x.supabase.co', 'k', { fetchImpl: async () => { throw new Error('offline'); } }), false);
});

test('students must give a name, contact number and location before enrolling themselves', async () => {
  const ok = { name: 'Ana Cruz', phone: '+1 (416) 555-0123', city: 'Toronto', province: '', country: 'Canada' };
  assert.equal(checkStudentDetails(ok), '');
  assert.match(checkStudentDetails({ ...ok, name: ' ' }), /full name/);
  assert.match(checkStudentDetails({ ...ok, phone: '12' }), /contact number/);
  assert.match(checkStudentDetails({ ...ok, phone: 'call me' }), /contact number/);
  assert.match(checkStudentDetails({ ...ok, city: '' }), /city/);
  assert.match(checkStudentDetails({ ...ok, country: '' }), /country/);
  let sent;
  await saveStudentProfile({ rpc: async (name, args) => { sent = [name, args]; return { error: null }; } }, { ...ok, name: ' Ana Cruz ' });
  assert.deepEqual(sent, ['learn_save_profile', { p_full_name: 'Ana Cruz', p_phone: '+1 (416) 555-0123', p_city: 'Toronto', p_province: '', p_country: 'Canada' }]);
  await assert.rejects(selfEnroll({ rpc: async () => ({ error: { hint: 'profile_required' } }) }, 'c', ''), /Add your details/);
});

test('an open lesson knows the lesson before and after it', async () => {
  const course = '11111111-1111-4111-8111-111111111111';
  const id = (n) => `aaaaaaa${n}-1111-4111-8111-111111111111`;
  const outline = [1, 2, 3].map((n) => ({ module_id: 'm', module_title: 'M', lesson_id: id(n), lesson_title: `L${n}`, length_minutes: 5, done: n === 1, unlocked: n < 3 }));
  const client = {
    rpc: async (name) => ({
      learn_lesson: { data: [{ lesson_id: id(2), course_id: course, title: 'L2', reading: '', has_check: false, done: false }] },
      learn_my_courses: { data: [{ course_id: course, brand: 'ccact', title: 'C', total_lessons: 3, done_lessons: 1, next_lesson_id: id(2) }] },
      learn_course_outline: { data: outline },
      learn_glossary: { data: [] },
    }[name] ?? { data: null }),
  };
  const data = await loadLessonData(client, 'ccact', id(2));
  assert.equal(data.state, 'open');
  assert.equal(data.previous.lessonId, id(1));
  assert.equal(data.next.lessonId, id(3));
  const first = await loadLessonData({ ...client, rpc: async (name) => (name === 'learn_lesson' ? { data: [{ lesson_id: id(1), course_id: course, title: 'L1', has_check: false }] } : client.rpc(name)) }, 'ccact', id(1));
  assert.equal(first.previous, null);
});

test('exam helpers: clock text, a locked final, and exam settings on the lesson', async () => {
  const { formatClock, submitQuickCheck } = await import('../src/scripts/learn-helpers.mjs');
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(245), '4:05');
  assert.equal(formatClock(3845), '1:04:05');
  assert.equal(formatClock(-3), '0:00');
  const locked = { rpc: async () => ({ error: { code: '42501', hint: 'no_attempts' } }) };
  await assert.rejects(submitQuickCheck(locked, 'l', {}), (error) => error.locked === true);
  const broken = { rpc: async () => ({ error: { code: 'XX000' } }) };
  await assert.rejects(submitQuickCheck(broken, 'l', {}), (error) => !error.locked);

  const course = '11111111-1111-4111-8111-111111111111';
  const lesson = 'aaaaaaa1-1111-4111-8111-111111111111';
  const status = { exam: 'final', exam_minutes: 30, questions: 3, attempts_used: 1, attempts_left: 2, passed: false };
  const client = {
    rpc: async (name) => ({
      learn_lesson: { data: [{ lesson_id: lesson, course_id: course, title: 'Final', has_check: true }] },
      learn_my_courses: { data: [{ course_id: course, brand: 'ccact', title: 'C', total_lessons: 1, done_lessons: 0, next_lesson_id: lesson }] },
      learn_course_outline: { data: [{ module_id: 'm', module_title: 'M', lesson_id: lesson, lesson_title: 'Final', length_minutes: 5, done: false, unlocked: true }] },
      learn_questions: { data: [{ question_id: 'q', type: 'single', text: 'Q', options: ['a', 'b'] }] },
      learn_exam_status: { data: [status] },
      learn_glossary: { data: [] },
    }[name] ?? { data: null }),
  };
  assert.deepEqual((await loadLessonData(client, 'ccact', lesson)).exam, status);
  const plain = { ...client, rpc: async (name) => (name === 'learn_exam_status' ? { data: [{ ...status, exam: null }] } : client.rpc(name)) };
  assert.equal((await loadLessonData(plain, 'ccact', lesson)).exam, null);
});
