// Pure helpers and Supabase data loaders for the student learning pages (/learn/**).
// Kept DOM-free so every helper and query wrapper can be unit-tested in Node.

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LEARN_NEXT_KEY = 'ccact-learn-next';

export function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

export function isValidEmail(email) {
  return EMAIL_PATTERN.test(String(email ?? '').trim());
}

export function normalizeBrand(brand) {
  return brand === 'cces' ? 'cces' : 'ccact';
}

export function isSafeImageUrl(url) {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('https://')) return true;
  return trimmed.startsWith('/images/') && !trimmed.startsWith('//');
}

// Keep post-login redirects strictly inside /learn/ and never loop back to /learn/login/.
export function sanitizeLearnNext(nextUrl) {
  if (typeof nextUrl !== 'string') return '/learn/';
  const raw = nextUrl.trim();
  if (!raw || raw.startsWith('//') || /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(raw)) return '/learn/';
  let parsed;
  try {
    parsed = new URL(raw, 'https://example.invalid');
  } catch {
    return '/learn/';
  }
  if (parsed.origin !== 'https://example.invalid') return '/learn/';
  const path = parsed.pathname === '/learn' ? '/learn/' : parsed.pathname;
  if (!path.startsWith('/learn/')) return '/learn/';
  if (path === '/learn/login' || path === '/learn/login/') return '/learn/';
  return `${path}${parsed.search}`;
}

export function buildLoginUrl(currentPath, authError = '') {
  const safeNext = sanitizeLearnNext(currentPath);
  const params = new URLSearchParams();
  if (safeNext !== '/learn/') params.set('next', safeNext);
  if (authError) params.set('auth_error', authError);
  const query = params.toString();
  return query ? `/learn/login/?${query}` : '/learn/login/';
}

export function courseOverviewUrl(courseId) {
  return `/learn/course/?id=${encodeURIComponent(String(courseId ?? ''))}`;
}

export function lessonUrl(lessonId) {
  return `/learn/lesson/?id=${encodeURIComponent(String(lessonId ?? ''))}`;
}

export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  if (total <= 0) return '';
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rem = total % 60;
  return rem ? `${hours} hr ${rem} min` : `${hours} hr`;
}

export function normalizeCourse(row) {
  const totalLessons = Math.max(0, Number(row?.total_lessons ?? 0) || 0);
  const rawDone = Math.max(0, Number(row?.done_lessons ?? 0) || 0);
  const doneLessons = totalLessons > 0 ? Math.min(totalLessons, rawDone) : 0;
  const totalMinutes = Math.max(0, Number(row?.total_minutes ?? 0) || 0);
  const complete = totalLessons > 0 && doneLessons >= totalLessons;
  const progressPercent = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const lessonWord = totalLessons === 1 ? 'lesson' : 'lessons';
  return {
    courseId: String(row?.course_id ?? ''),
    brand: normalizeBrand(row?.brand),
    title: String(row?.title ?? 'Untitled course'),
    description: String(row?.description ?? ''),
    image: isSafeImageUrl(row?.image) ? row.image.trim() : null,
    totalMinutes,
    totalLessons,
    doneLessons,
    progressPercent,
    progressText: `${doneLessons} of ${totalLessons} ${lessonWord}`,
    complete,
    nextLessonId: row?.next_lesson_id ? String(row.next_lesson_id) : null,
    certificateNumber: row?.certificate_number ? String(row.certificate_number) : null,
  };
}

// Keep only courses matching the active site brand; put completed courses below in-progress ones.
export function partitionBrandCourses(rows, siteBrand) {
  const brand = normalizeBrand(siteBrand);
  const list = Array.isArray(rows) ? rows : [];
  const normalized = list
    .filter((row) => row && row.brand === brand)
    .map(normalizeCourse);
  return {
    active: normalized.filter((course) => !course.complete),
    completed: normalized.filter((course) => course.complete),
  };
}

export function groupOutlineByModule(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const modulesMap = new Map();
  let totalLessons = 0;
  let doneLessons = 0;
  let firstLessonId = null;
  let nextLessonId = null;

  for (const row of list) {
    if (!row) continue;
    totalLessons += 1;
    const done = Boolean(row.done);
    const unlocked = Boolean(row.unlocked);
    const lessonId = String(row.lesson_id ?? '');
    if (done) doneLessons += 1;
    if (!firstLessonId && unlocked && lessonId) firstLessonId = lessonId;
    if (!nextLessonId && !done && unlocked && lessonId) nextLessonId = lessonId;

    const moduleId = String(row.module_id ?? 'module');
    let mod = modulesMap.get(moduleId);
    if (!mod) {
      mod = {
        moduleId,
        title: String(row.module_title ?? 'Module'),
        doneCount: 0,
        totalCount: 0,
        lessons: [],
      };
      modulesMap.set(moduleId, mod);
    }
    mod.totalCount += 1;
    if (done) mod.doneCount += 1;
    mod.lessons.push({
      number: totalLessons,
      lessonId,
      title: String(row.lesson_title ?? 'Untitled lesson'),
      lengthMinutes: Math.max(0, Number(row.length_minutes ?? 0) || 0),
      done,
      unlocked,
    });
  }

  return {
    modules: [...modulesMap.values()],
    totalLessons,
    doneLessons,
    firstLessonId,
    nextLessonId,
  };
}

export function authRedirectError(search = '', hash = '') {
  const query = new URLSearchParams(String(search).replace(/^\?/, ''));
  const frag = new URLSearchParams(String(hash).replace(/^#/, ''));
  const authError = query.get('auth_error') || frag.get('auth_error') || '';
  const code = query.get('error_code') || frag.get('error_code') || '';
  const err = query.get('error') || frag.get('error') || '';
  const desc = query.get('error_description') || frag.get('error_description') || '';

  if (authError === 'expired' || code === 'otp_expired' || /expired|invalid/i.test(desc)) {
    return 'That sign-in link has expired or has already been used. Enter your email below for a new link.';
  }
  if (err) {
    return 'We could not complete sign-in from that link. Enter your email below for a fresh sign-in link.';
  }
  return '';
}

export async function loadStudentUser(client) {
  const { data, error } = await client.auth.getUser();
  if (data?.user) return data.user;
  const staleSession = error && (
    error.name === 'AuthSessionMissingError'
    || error.status === 401
    || error.status === 403
    || ['session_not_found', 'user_not_found', 'bad_jwt'].includes(error.code)
  );
  if (!error || staleSession) {
    if (error && error.name !== 'AuthSessionMissingError' && typeof client.auth.signOut === 'function') {
      await client.auth.signOut({ scope: 'local' }).catch(() => {});
    }
    return null;
  }
  throw new Error('Unable to check your account right now. Please try again.');
}

export async function sendStudentSignInLink(client, email, emailRedirectTo) {
  const trimmed = String(email ?? '').trim();
  if (!isValidEmail(trimmed)) {
    throw new Error('Enter a valid email address.');
  }
  const { error } = await client.auth.signInWithOtp({
    email: trimmed,
    options: { emailRedirectTo, shouldCreateUser: false },
  });
  if (error) {
    if (error.code === 'otp_disabled' || /signups not allowed for otp/i.test(error.message ?? '')) {
      return { email: trimmed };
    }
    if (error.status === 429 || error.code === 'over_email_send_rate_limit' || /rate limit|seconds/i.test(error.message ?? '')) {
      throw new Error('Please wait a moment before requesting another sign-in link.');
    }
    throw new Error('Could not send the sign-in link right now. Please try again.');
  }
  return { email: trimmed };
}

export async function loadDashboardData(client, siteBrand) {
  const { data, error } = await client.rpc('learn_my_courses');
  if (error) {
    throw new Error('Unable to load your courses right now. Please try again.');
  }
  return partitionBrandCourses(data, siteBrand);
}

export async function loadCourseOverviewData(client, siteBrand, courseId) {
  if (!isUuid(courseId)) return null;
  const { active, completed } = await loadDashboardData(client, siteBrand);
  const course = [...active, ...completed].find((item) => item.courseId === courseId);
  if (!course) return null;

  const { data, error } = await client.rpc('learn_course_outline', { p_course: courseId });
  if (error) {
    throw new Error('Unable to load the course outline right now. Please try again.');
  }
  const grouped = groupOutlineByModule(data);
  const totalLessons = course.totalLessons || grouped.totalLessons;
  const doneLessons = course.totalLessons ? course.doneLessons : grouped.doneLessons;
  const complete = totalLessons > 0 && doneLessons >= totalLessons;
  return {
    course: {
      ...course,
      totalLessons,
      doneLessons,
      complete,
      progressPercent: totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0,
      progressText: `${doneLessons} of ${totalLessons} ${totalLessons === 1 ? 'lesson' : 'lessons'}`,
      nextLessonId: course.nextLessonId ?? grouped.nextLessonId,
    },
    ...grouped,
  };
}

function parseDownloadFilename(headerValue, courseId) {
  if (typeof headerValue === 'string') {
    const match = headerValue.match(/filename\*?=(?:UTF-8'')?["']?([^;"'\r\n]+)["']?/i);
    if (match?.[1]) {
      const cleaned = match[1].replace(/[/\\]/g, '').trim();
      if (cleaned) return cleaned;
    }
  }
  return `certificate-${String(courseId).slice(0, 8)}.pdf`;
}

export async function fetchCertificatePdf(client, courseId, { fetchImpl = globalThis.fetch } = {}) {
  if (!isUuid(courseId)) throw new Error('Invalid course reference.');
  const { data, error } = await client.auth.getSession();
  const token = data?.session?.access_token;
  if (error || !token) throw new Error('Your session has expired. Please sign in again.');

  const response = await fetchImpl(`/.netlify/functions/learn-certificate?course=${encodeURIComponent(courseId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.');
  if (response.status === 404) {
    throw new Error('Certificate downloads are not available yet. Please check back soon or contact support.');
  }
  if (!response.ok) throw new Error('Could not download your certificate right now. Please try again.');

  const blob = await response.blob();
  const filename = parseDownloadFilename(response.headers?.get?.('content-disposition'), courseId);
  return { blob, filename };
}

// One lesson with its place in the course. Returns { state: 'missing' | 'locked' | 'open', ... }.
export async function loadLessonData(client, siteBrand, lessonId) {
  if (!isUuid(lessonId)) return { state: 'missing' };
  const { data, error } = await client.rpc('learn_lesson', { p_lesson: lessonId });
  if (error) {
    if (error.code === '42501') return { state: /locked/i.test(error.message ?? '') ? 'locked' : 'missing' };
    throw new Error('Unable to load this lesson right now. Please try again.');
  }
  const row = data?.[0];
  if (!row) return { state: 'missing' };
  // The overview loader also rejects courses that belong to the other brand's site.
  const overview = await loadCourseOverviewData(client, siteBrand, row.course_id);
  if (!overview) return { state: 'missing' };
  const lessons = overview.modules.flatMap((mod) => mod.lessons);
  const index = lessons.findIndex((lesson) => lesson.lessonId === row.lesson_id);
  let questions = [];
  if (row.has_check) {
    const result = await client.rpc('learn_questions', { p_lesson: lessonId });
    if (result.error) throw new Error('Unable to load the quick check right now. Please try again.');
    questions = result.data;
  }
  return {
    state: 'open',
    lesson: row,
    questions,
    course: overview.course,
    number: index + 1,
    total: lessons.length,
    next: lessons[index + 1] ?? null,
  };
}

// Build p_answers for learn_submit_check from [questionId, optionIndex] pairs; null if a question is unanswered.
export function collectAnswers(questions, pairs) {
  const answers = Object.fromEntries(questions.map((q) => [q.question_id, []]));
  for (const [questionId, index] of pairs) answers[questionId]?.push(Number(index));
  return Object.values(answers).every((picked) => picked.length) ? answers : null;
}

export async function submitQuickCheck(client, lessonId, answers) {
  const { data, error } = await client.rpc('learn_submit_check', { p_lesson: lessonId, p_answers: answers });
  if (error) throw new Error('Could not check your answers right now. Please try again.');
  return data;
}

export async function markLessonDone(client, lessonId) {
  const { error } = await client.rpc('learn_mark_done', { p_lesson: lessonId });
  if (error) throw new Error('Could not mark this lesson as done. Please try again.');
}

export async function verifyCertificate(client, number) {
  const { data, error } = await client.rpc('learn_verify_certificate', { p_number: String(number ?? '') });
  if (error) throw new Error('Unable to check this certificate right now. Please try again.');
  return data?.[0]?.valid ? data[0] : null;
}

// Settings: everything stored about the signed-in student, for the profile card and "Preview my information".
export async function loadMyInformation(client, user) {
  const [courses, enrollments, certificates] = await Promise.all([
    client.rpc('learn_my_courses'),
    client.from('enrollments').select('course_id, student_name, enrolled_at, reminders_off').eq('status', 'active'),
    client.from('certificates').select('course_id, number, issued_at'),
  ]);
  if (courses.error || enrollments.error || certificates.error) {
    throw new Error('Unable to load your information right now. Please try again.');
  }
  const byId = new Map((courses.data ?? []).map((row) => [row.course_id, row]));
  const certs = new Map((certificates.data ?? []).map((row) => [row.course_id, row]));
  const rows = enrollments.data ?? [];
  return {
    email: user.email ?? '',
    name: rows.find((row) => row.student_name)?.student_name ?? null,
    accountCreated: user.created_at ?? null,
    lastSignIn: user.last_sign_in_at ?? null,
    remindersOn: !rows.some((row) => row.reminders_off),
    courses: rows.map((row) => {
      const course = byId.get(row.course_id);
      const cert = certs.get(row.course_id);
      return {
        title: course?.title ?? 'Course being prepared',
        brand: course?.brand ?? null,
        enrolledAt: row.enrolled_at,
        lessonsDone: Number(course?.done_lessons ?? 0),
        lessonsTotal: Number(course?.total_lessons ?? 0),
        certificate: cert ? { number: cert.number, issuedAt: cert.issued_at } : null,
      };
    }),
  };
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

export async function setReminders(client, on) {
  const { error } = await client.rpc('learn_set_reminders', { p_on: Boolean(on) });
  if (error) throw new Error('Could not save your email preference. Please try again.');
}

// Supabase stores passwords with bcrypt, which reads only the first 72 bytes.
export function checkNewPassword(password, confirm) {
  const value = String(password ?? '');
  if (value.length < 8) return 'Use at least 8 characters.';
  if (new TextEncoder().encode(value).length > 72) return 'Use 72 characters or fewer.';
  if (!/\p{L}/u.test(value) || !/\d/.test(value)) return 'Use at least one letter and one number.';
  if (value !== confirm) return 'The two passwords do not match.';
  return '';
}

export async function saveNewPassword(client, password) {
  const { error } = await client.auth.updateUser({ password });
  if (!error) return;
  if (error.code === 'same_password') throw new Error('That is already your password. Choose a different one.');
  if (error.code === 'weak_password') throw new Error('That password is too easy to guess. Choose a stronger one.');
  if (error.code === 'reauthentication_needed') {
    throw new Error('For your security, sign out, sign in again with an email link, then set your password.');
  }
  throw new Error('Could not save your password. Please try again.');
}

// Same message for a wrong password and an unknown email, so the form does not reveal who is enrolled.
export async function signInStudentWithPassword(client, email, password) {
  const trimmed = String(email ?? '').trim();
  if (!isValidEmail(trimmed) || !password) throw new Error('Enter your email address and password.');
  const { error } = await client.auth.signInWithPassword({ email: trimmed, password });
  if (!error) return;
  if (error.status === 429) throw new Error('Too many attempts. Please wait a moment and try again.');
  throw new Error('Email or password is incorrect. You can also sign in with an email link.');
}

// Dashboard and Courses: courses plus, for each one in progress, its next lesson and time left,
// which course the student touched last, and their name.
export async function loadLearningOverview(client, siteBrand) {
  const { active, completed } = await loadDashboardData(client, siteBrand);
  // ponytail: one outline call per course in progress; fine for a handful of enrollments, add a batch RPC if that grows.
  const [outlines, latest, named] = await Promise.all([
    Promise.all(active.map((course) => client.rpc('learn_course_outline', { p_course: course.courseId }))),
    client.from('lesson_progress').select('lesson_id').order('updated_at', { ascending: false }).limit(1),
    client.from('enrollments').select('student_name').not('student_name', 'is', null).limit(1),
  ]);
  if (outlines.some((result) => result.error) || latest.error || named.error) {
    throw new Error('Unable to load your courses right now. Please try again.');
  }
  const lessonsOf = new Map();
  active.forEach((course, index) => {
    const rows = outlines[index].data ?? [];
    const at = rows.findIndex((row) => !row.done);
    course.next = at >= 0 ? { lessonId: String(rows[at].lesson_id), title: String(rows[at].lesson_title ?? ''), number: at + 1 } : null;
    course.minutesLeft = rows.filter((row) => !row.done).reduce((sum, row) => sum + (Number(row.length_minutes) || 0), 0);
    lessonsOf.set(course, new Set(rows.map((row) => String(row.lesson_id))));
  });
  const lastLesson = String(latest.data?.[0]?.lesson_id ?? '');
  const current = active.find((course) => lessonsOf.get(course).has(lastLesson))
    ?? active.find((course) => course.doneLessons > 0)
    ?? active[0]
    ?? null;
  return { active, completed, current, studentName: named.data?.[0]?.student_name ?? null };
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

// Filter for the Courses page: status is 'all', 'active' or 'done'; query matches title or description.
export function courseMatches(course, status, query) {
  if (status === 'active' && course.complete) return false;
  if (status === 'done' && !course.complete) return false;
  const q = String(query ?? '').trim().toLowerCase();
  return !q || `${course.title} ${course.description}`.toLowerCase().includes(q);
}

// Test checkout: courses the owner marked self_enroll. Other brand's courses are not sold on this site.
export async function loadCheckoutCourse(client, siteBrand, courseId) {
  if (!isUuid(courseId)) return null;
  const { data, error } = await client.rpc('learn_checkout_course', { p_course: courseId });
  if (error) throw new Error('Unable to load this course right now. Please try again.');
  const row = data?.[0];
  return row && row.brand === normalizeBrand(siteBrand) ? row : null;
}

export function checkCheckoutDetails(name, email) {
  const cleanName = String(name ?? '').trim();
  if (!cleanName) return 'Enter your full name.';
  if (cleanName.length > 120) return 'Use 120 characters or fewer for your name.';
  if (!isValidEmail(email)) return 'Enter a valid email address.';
  return '';
}

// Creates the account if needed and emails a link back to checkout, which then enrolls.
export async function startCheckout(client, { name, email }, emailRedirectTo) {
  const { error } = await client.auth.signInWithOtp({
    email: String(email).trim(),
    options: { emailRedirectTo, shouldCreateUser: true, data: { full_name: String(name).trim() } },
  });
  if (!error) return;
  if (error.status === 429 || /rate limit|seconds/i.test(error.message ?? '')) {
    throw new Error('Please wait a moment before trying again.');
  }
  throw new Error('Could not start checkout right now. Please try again.');
}

export async function selfEnroll(client, courseId, name) {
  const { error } = await client.rpc('learn_self_enroll', { p_course: courseId, p_name: name ?? '' });
  if (error?.hint === 'profile_required') throw new Error('Add your details below to finish enrolling.');
  if (error) throw new Error('Could not complete your enrollment. Please contact us.');
}

// Details a student must give before they can enroll themselves (stored in student_profiles).
export function checkStudentDetails({ name, phone, city, province, country } = {}) {
  const t = (value) => String(value ?? '').trim();
  if (!t(name)) return 'Enter your full name.';
  if (t(name).length > 120) return 'Use 120 characters or fewer for your name.';
  if (!/^\+?[\d\s().-]{7,30}$/.test(t(phone)) || t(phone).replace(/\D/g, '').length < 7) return 'Enter a valid contact number.';
  if (!t(city)) return 'Enter your city.';
  if (!t(country)) return 'Enter your country.';
  if ([city, province, country].some((value) => t(value).length > 120)) return 'Use 120 characters or fewer for your location.';
  return '';
}

export async function loadStudentProfile(client) {
  const { data, error } = await client.from('student_profiles').select('full_name').maybeSingle();
  if (error) throw new Error('Could not load your details. Please try again.');
  return data;
}

export async function saveStudentProfile(client, { name, phone, city, province, country }) {
  const t = (value) => String(value ?? '').trim();
  const { error } = await client.rpc('learn_save_profile', {
    p_full_name: t(name), p_phone: t(phone), p_city: t(city), p_province: t(province), p_country: t(country),
  });
  if (error) throw new Error('Could not save your details. Please check them and try again.');
}

// Google sign-in shows only when it is switched on in Supabase (Authentication → Providers → Google).
export async function googleSignInEnabled(supabaseUrl, anonKey, { fetchImpl = globalThis.fetch } = {}) {
  try {
    const response = await fetchImpl(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: anonKey } });
    if (!response.ok) return false;
    return Boolean((await response.json())?.external?.google);
  } catch {
    return false;
  }
}

// Leaves the page for Google; Supabase creates the account on first use and links it to an existing one with the same email.
export async function signInWithGoogle(client, redirectTo) {
  const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  if (error) throw new Error('Could not start Google sign-in. Please try again or use your email.');
}
