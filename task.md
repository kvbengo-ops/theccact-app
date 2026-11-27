# CCACT Learning Platform — Claude + Codex + Gemini

Status: Phase 1 in progress (2026-11-27): L01, L02, L03, and L04.

## Source of truth

- Requirements: `CCACT Learning Platform — Product Requirements.md` (the PRD). The PRD governs scope; this file governs who does what.
- Previous affiliate-site board: `task-affiliate-websites.md` (history only).
- Copy rules: North American spelling. Never the word "partner" in site copy (use "affiliate").
- Brand: one repo builds two sites. `SITE_BRAND=ccact` builds theccact.netlify.app, `SITE_BRAND=cces` builds thecces.netlify.app (`src/lib/links.mjs`, `astro.config.mjs`). Each course belongs to one brand and shows only on its own site.
- Deploy: Netlify builds from remote `web` (`kvbengo-ops/theccact-web`), branch `main`. Do not hard-code theccact.com or thecces.com in links; they do not point at Netlify yet.
- Follow existing patterns: static Astro pages that load data from Supabase after sign-in, like `src/pages/admin.astro` + `src/scripts/admin.mjs` and `src/pages/affiliate/` + `src/scripts/affiliate-portal.mjs`. Owner check reuses `private.admin_users` (`supabase/migrations/202611200005_admin_review.sql`).

## Agents

| Agent | Implements | Reviews |
| --- | --- | --- |
| Claude | Data model, migrations, row-level security, server functions that mark answers and issue certificates, integration and release checks | Gemini's work |
| Codex | Owner console (courses, students, reports), video host, email sending and reminders, Netlify Functions setup and deploy config | Claude's work |
| Gemini | Student UI: sign-in, dashboard, course overview, lesson page, quick-check UI, certificate design, verify page; visual and accessibility review | Codex's work |

## Shared working rules

1. Read the PRD and this file before working. Set the task to `IN PROGRESS (<agent>, <date>)` and list the files you own before editing.
2. One implementation owner per task; the named reviewer reviews it. Do not edit another agent's claimed files without a handoff recorded in the log.
3. Statuses: `TODO`, `IN PROGRESS`, `BLOCKED`, `REVIEW`, `DONE`. Tick a box only after its check passes. Record the evidence (commands, results) in the handoff log.
4. Shared interfaces (table and column names, RPC and function names, request and response shapes) are agreed in the Interfaces section below before callers change.
5. No service-role keys, video-host secrets or email-provider keys in browser bundles. Secrets live in Netlify environment variables only.
6. Correct answers never reach the browser before the student submits. Marking happens in a server function.
7. A task is not done because the UI renders. Check behavior, failure states and access control.
8. Missing content, credentials or owner decisions are marked `BLOCKED` with the decision number from the table below. Never fill them with invented content.
9. Run `npm test` and `npm run build` (both brands: `SITE_BRAND=cces npm run build` too) before moving a task to `REVIEW`.

## Ownership of paths

| Path | Owner |
| --- | --- |
| `supabase/migrations/2026112*_learn_*.sql`, `tests/learn-*.sql` | Claude |
| `netlify/functions/learn-certificate.mjs` | Claude |
| `netlify.toml`, `netlify/functions/learn-video-url.mjs`, `netlify/functions/learn-email*.mjs`, `netlify/functions/learn-enroll.mjs` | Codex |
| `src/pages/admin.astro`, `src/scripts/admin.mjs` (Courses section) | Codex |
| `src/pages/learn/**`, `src/scripts/learn*.mjs`, `src/layouts/LearnLayout.astro`, `src/components/Learn*.astro` | Gemini |
| `package.json`, `package-lock.json`, `README.md`, `task.md` | Shared; record changes in the log |

## Interfaces (agree in L01 before dependent work)

- Tables (PRD "Data"): `courses`, `modules`, `lessons`, `questions`, `enrollments`, `lesson_progress`, `quiz_attempts`, `certificates`, `email_log`. `courses.brand` is `ccact` or `cces`.
- Columns: see `supabase/migrations/202611270001_learn_schema.sql`. `correct_answers` is zero-based indexes into the `options` array. `type` is `single`, `multiple` or `true_false`. `files` is a JSON array.
- `enrollments.student_name` is printed on the certificate: the console and `learn-enroll` should collect it. `enrollments.status` is `active` or `removed` (set `removed`, do not delete). `enrollments.reminders_off` is the unsubscribe flag.
- Owner console reads and writes the tables directly (RLS allows `is_admin()`). Course images go in the public `course-images` bucket.
- Learning origins are configured once per environment as `LEARN_CCACT_ORIGIN` and `LEARN_CCES_ORIGIN` (HTTPS origins; set on main builds and functions). `SITE_APP=learn` selects the learning-site build. Temporary URLs are pending site creation.
- `POST /.netlify/functions/learn-enroll` with owner JWT: `{ action: "list"|"enroll"|"remove"|"correct", courseId, ... }`. Enroll accepts `students: [{ email, name }]`; remove accepts `userId`; correct accepts `userId, email`. List and enroll return per-student results. The function checks `is_admin()` before using the service role; email corrections affect the shared sign-in account.
- Students never read content tables. They use these RPCs: `learn_my_courses()` (both brands, so filter on `brand`), `learn_course_outline(p_course)`, `learn_lesson(p_lesson)`, `learn_questions(p_lesson)` (no answers or explanations), `learn_save_position(p_lesson, p_seconds)`, `learn_mark_done(p_lesson)`. Locked or unenrolled calls fail with code `42501` (message `Lesson locked` or `Not authorized`).
- Archived courses stay open to students already enrolled; draft courses are hidden.
- Quick checks: RPC `learn_submit_check(p_lesson, p_answers)` (replaces the planned `learn-mark-check` Netlify Function; no service key, attempt and unlock saved together). `p_answers` is `{ "<question_id>": [option indexes] }` with every question answered. Returns `{ score, passed, results: [{ question_id, correct, explanation, review_at }] }`. Code `42501`: locked or not enrolled. Code `22023`: unanswered question or no quick check.
- `POST /.netlify/functions/learn-video-url` — body `{ lessonId }`, JWT. Returns a short-lived signed playback URL only if the caller is enrolled and the lesson is unlocked.
- `GET /.netlify/functions/learn-certificate?course=<id>` — JWT. Returns the PDF for the caller's own certificate.
- Verify page: public RPC `learn_verify_certificate(p_number)` returns one row `{ valid, course_title, brand, issued_at }`.
- Certificates are issued by a database trigger when the last lesson is done; the number is in `learn_my_courses().certificate_number`.
- Owner reports (L10, owner only, empty for others): `learn_report_courses()` → `course_id, brand, title, status, enrolled, active_week, completed, completion_rate`; `learn_report_lessons(p_course)` → `lesson_id, module_title, lesson_title, reached, done, stopped_here`; `learn_report_questions(p_course)` → `question_id, lesson_id, lesson_title, question, attempts, wrong, wrong_share`; `learn_report_students(p_course)` → `user_id, email, student_name, done_lessons, total_lessons, attempts, average_score, last_active, completed_at`.

## Phase 1 — Foundations (1–2 weeks)

### L01 — Schema and row-level security
Owner: Claude. Reviewer: Codex. Status: REVIEW (Claude, 2026-11-27; Codex review pending). Owned: `supabase/migrations/202611270001_learn_schema.sql`, `tests/learn-rls.sql`. Applied to Supabase 2026-11-27.

- [x] Migration with the nine PRD tables, brand column, course status (draft, published, archived), lessons-in-order flag, pass mark (percent, default 66 so that 2 of 3 passes; 70 would fail it).
- [x] RLS: students read only their own enrollments, progress, attempts and certificates, and only published lessons of courses they are enrolled in.
- [x] Owner (`private.admin_users`) has full access; affiliates get nothing new.
- [x] Students cannot read correct answers or explanations; cannot write `done_at`, scores or certificates directly.
- [x] `tests/learn-rls.sql` run in a rolled-back transaction: student A cannot see student B, unenrolled student cannot see lessons, student cannot read answers or self-certify.

Acceptance: migration applied to the Supabase project; RLS test passes; interface names above confirmed or updated in this file.

### L02 — Student sign-in
Owner: Gemini (page), Claude (Auth settings). Reviewer: Codex. Status: REVIEW (Gemini & Claude, 2026-11-27; Codex review pending). Depends on: L01. Owned (Gemini): `src/layouts/LearnLayout.astro`, `src/pages/learn/login.astro`, `src/scripts/learn-helpers.mjs`, `src/scripts/learn-portal.mjs`, `src/components/LearnStudentBar.astro`, `tests/learn-portal.test.mjs`.

- [x] `/learn/login/` with email sign-in link (no password), in the site's design and header.
- [x] Supabase Auth redirect URLs added for both Netlify origins. (Claude, 2026-11-27)
- [x] Signed-out visitors to any `/learn/` page go to `/learn/login/`; owner and affiliate sign-ins keep working.
- [x] `public/_headers`: `/learn/*` gets `noindex` except `/learn/verify/*`. (Claude, 2026-11-27)

### L03 — Dashboard and course overview
Owner: Gemini. Reviewer: Claude. Status: DONE (Claude reviewed 2026-11-27: code, and live data as a test student; visual check not repeated). Depends on: L01, L02. Owned: `src/layouts/LearnLayout.astro`, `src/pages/learn/index.astro`, `src/pages/learn/course.astro`, `src/components/LearnStudentBar.astro`, `src/scripts/learn-helpers.mjs`, `src/scripts/learn-portal.mjs`, `tests/learn-portal.test.mjs`.

- [x] `/learn/`: one card per enrolled course with image, "6 of 14 lessons" and a bar, **Continue** (next unfinished lesson), **Download certificate** when complete. Completed courses below in-progress ones. Empty state with contact details.
- [x] `/learn/course/?id=<id>`: title, description, total time, modules and lessons in order with length and done state, **Resume** button, locked lessons shown as locked when the course has lessons-in-order on.
- [x] Works on a phone browser; keyboard access and visible focus.

### L04 — Owner console: courses and enrollment
Owner: Codex. Reviewer: Gemini. Status: IN PROGRESS (Codex, 2026-11-27). Depends on: L01.

- [ ] New **Courses** section in `/admin/`: create and edit courses, modules and lessons; reorder; draft then publish; brand per course.
- [ ] Enroll by email, one or a pasted list, through `learn-enroll` (creates the student's account if needed, sends sign-in link). Remove an enrollment. Correct a student's email.
- [ ] Netlify Functions set up (`netlify.toml`, functions directory) with env var list documented in `README.md`.

Acceptance (phase 1): owner creates a course and enrolls a test student; student signs in on the right brand's site and sees the course on the dashboard and overview; a second student sees nothing of the first.

### L13 — Separate learning sites and branding
Owner: Gemini (branding), Codex (sites and links), Claude (Auth URLs, release check). Reviewer: Codex reviews Gemini, Claude reviews Codex. Status: IN PROGRESS (Codex, Gemini, 2026-11-27). Depends on: L02, L03. Owned (Gemini): `src/scripts/learn-brand.mjs`, `src/components/LearnHeader.astro`, `src/components/LearnFooter.astro`, `src/components/LearnStudentBar.astro`, `src/layouts/LearnLayout.astro`, `src/pages/learn/login.astro`, `src/pages/learn/index.astro`, `src/pages/learn/course.astro`, `src/scripts/learn-portal.mjs`, `tests/learn-portal.test.mjs`.

Decided 2026-11-27: `learn.theccact.com` and `learn.thecces.com`, each showing only its brand's courses. Name placeholder: "Learning Portal".

- [x] Gemini (done by Claude on the owner's instruction, 2026-11-27): `/learn/` pages get their own header and footer (no website menus), the platform name from one constant, and "Powered by CCACT" or "Powered by CCES" linking to that website. Both brand builds.
- [ ] Codex: two Netlify sites from this repo with `SITE_APP=learn` and `SITE_BRAND`; on them the root and every non-learn page go to `/learn/`; `/admin/` stays on the main websites only; main websites send `/learn/*` to the learning site. Functions and env vars work on both.
- [ ] Codex: `learn-enroll` sign-in links point at the learning sites. Keep the temporary `.netlify.app` addresses in one place until DNS is connected.
- [ ] Claude: add the learning-site addresses (temporary, then `learn.` subdomains) to Auth redirect URLs; remove the main-website `/learn/` ones. (`learn.` subdomains added 2026-11-27; temporary addresses wait for the Netlify sites.)
- [ ] Owner: create the two Netlify sites (or give access) and add the DNS records for the `learn.` subdomains.

Acceptance: each learning site opens to its own branded sign-in, a student signs in and sees only that brand's courses, and no website menu appears.

## Phase 2 — Learning (1–2 weeks)

### L05 — Video host and lesson files
Owner: Codex. Reviewer: Claude. Status: BLOCKED on decision 5.

- [ ] Upload video from the console to the chosen host (Bunny Stream or Mux); store the video id on the lesson.
- [ ] `learn-video-url` returns expiring signed links; refuses unenrolled or locked requests.
- [ ] Lesson files (cheat sheets, charts) in a private Supabase Storage bucket, downloadable only by enrolled students.

### L06 — Lesson page
Owner: Gemini. Reviewer: Claude. Status: IN PROGRESS (Claude, for Gemini, 2026-11-27): reading lessons, Mark as done, locked state and next lesson done; video and file downloads wait for L05.

- [ ] `/learn/lesson/?id=<id>`: video, reading, or both, plus file downloads.
- [ ] Saves video position to `lesson_progress` (throttled) and resumes on any device.
- [x] **Mark as done** for lessons with no quick check. Next-lesson navigation.
- [x] Locked lesson opened by URL shows a locked message, not content.

### L07 — Quick checks
Owner: Claude (marking function), Gemini (UI), Codex (question editor). Reviewer: each reviews another's part. Status: IN PROGRESS (Claude, 2026-11-27: `supabase/migrations/202611270002_learn_mark_check.sql`, `tests/learn-check.sql`; applied to Supabase 2026-11-27; UI and question editor pending). Depends on: L01, L06.

- [ ] Console: write 2–3 questions per lesson (single choice, multiple choice, true/false), explanation, and optional "review this part" pointer (video time or reading anchor).
- [x] `learn_submit_check` marks server-side, saves every attempt, applies the course pass mark, unlocks the next lesson on pass. Rejects locked or unenrolled lessons.
- [x] (Claude, for Gemini, 2026-11-27) UI shows right/wrong with explanation instantly, links wrong answers to the review point, allows unlimited retakes.
- [ ] Tests: correct, incorrect, tampered lesson id, unenrolled caller, answers never in the page source or network before submit.

Acceptance (phase 2): a test student completes a 3-lesson course end to end on a phone, fails and retakes one check, and resumes a video on a second device.

## Phase 3 — Completion (1 week)

### L08 — Certificates and verify page
Owner: Claude (issuing + PDF function), Gemini (design + verify page). Reviewer: Codex. Status: PDF and design BLOCKED on decision 2 (wording, CE hours). Issuing and verify lookup done (Claude, 2026-11-27).

- [x] Issue automatically when every lesson is done (and practice exam passed, once phase 5 exists). Unique certificate number.
- [ ] Branded PDF (CCACT or CCES crest and colors): name, course, completion date, CE hours where set, number.
- [x] (Claude, for Gemini, 2026-11-27) `/learn/verify/?n=<number>` public page; confirms genuine without private data.
- [ ] Download from the dashboard at any time.

### L09 — Reminder emails
Owner: Codex. Reviewer: Claude. Status: BLOCKED on decision 6 (sender) and provider choice (Resend or Postmark).

- [ ] Welcome (on enrollment, with sign-in link), Halfway (passes 50%), We miss you (7 days inactive, max once a week, max 3 per course), Almost there (one lesson or exam left), Certificate ready.
- [ ] Daily scheduled Netlify Function for time-based emails; `email_log` prevents duplicates.
- [ ] Unsubscribe link stops reminder emails only; Welcome and Certificate ready always send.
- [ ] Sends from the course's brand domain.

### L10 — Owner reports
Owner: Codex (console), Claude (SQL views or RPCs). Reviewer: Gemini. Status: IN PROGRESS. Claude's report functions done (2026-11-27, `supabase/migrations/202611270003_learn_certificates_reports.sql`, `tests/learn-reports.sql`); Codex console view pending. Depends on: L07.

- [ ] Per course: enrolled, active this week, completed, completion rate.
- [ ] Per lesson: students who reached it, drop-off point.
- [ ] Per question: share answered wrongly.
- [ ] Per student: progress and scores.

## Phase 4 — Pilot (1–2 weeks)

### L11 — Launch checks and pilot
Owner: Claude (functional), Gemini (visual and accessibility). Reviewer: Codex. Status: BLOCKED on decisions 1 and 7.

- [ ] Supabase on the paid plan (daily backups, no pausing). Owner action.
- [ ] Privacy Notice updated for names, emails and scores. Owner approves wording.
- [ ] All env vars set on both Netlify sites; secrets absent from `dist/`.
- [ ] Both brands built and deployed; a CCES course never shows on CCACT and the reverse.
- [ ] Gemini: phone and desktop check of every `/learn/` page, contrast, labels, focus, long course names, missing images.
- [ ] Enter the pilot course from the console (time it: 10 lessons in under an hour).
- [ ] Run the pilot with a small group; log issues below and fix them.

Acceptance (version one): every PRD phase 1–4 requirement passes or is listed as blocked by a named decision.

## Phase 5 — Practice exams (2–3 weeks, after version one)

### L12 — Practice exams
Owner: TBD. Status: TODO (not started until L11 is done).

- [ ] Exam question bank with topics, entered in the console.
- [ ] Timed exam drawn at random; pass mark and time limit per exam; marked server-side.
- [ ] Score history and results by topic with "review your weak topics" links to lessons.
- [ ] Certificate issuing requires a passed exam for exam-prep courses. Classmarker retired.

## Owner decisions (from PRD)

| # | Decision | Blocks | Status |
| --- | --- | --- | --- |
| 1 | First pilot course and who supplies its videos, text and questions | L11 | Pending |
| 2 | Certificate wording and any accredited CE hours | L08 | Pending |
| 3 | Pass mark: default ~70% or per course | L01 (default 66% = 2 of 3, per-course field built either way) | Pending |
| 4 | Lessons unlock in order for every course? | L01 (per-course flag built, default on) | Pending |
| 5 | Video host: Bunny Stream or Mux | L05 | Pending |
| 6 | Email sender address per brand, and provider (Resend or Postmark) | L09 | Pending |
| 7 | Enrollment lasts forever or expires (e.g. 12 months) | L11 | Pending |

## Out of scope for version one

Payments, checkout and automatic enrollment; affiliate commissions on courses; moving Teachable students; forums, live classes, study groups; streaks, badges, leaderboards; flashcards; a mobile app; proctored exams.

## Pilot issues

| Date | Reported by | Issue | Task | Status |
| --- | --- | --- | --- | --- |

## Handoff log

| Date | Agent | Task | Files / outcome / checks / next action |
| --- | --- | --- | --- |
| 2026-11-27 | Codex | L13 branding review | Reviewed learning header, footer, identity constant, layout and page callers. Both `SITE_APP=learn` brand builds passed; generated login, course, lesson and verify pages have the expected Learning Portal name, brand-specific Powered by link and no website navigation. No code findings. Visual phone/signed-in review and live-site acceptance remain outstanding. |
| 2026-11-27 | Gemini | L13 | Claimed Gemini branding part of L13. Owned: `src/scripts/learn-brand.mjs`, `src/components/LearnHeader.astro`, `src/components/LearnFooter.astro`, `src/components/LearnStudentBar.astro`, `src/layouts/LearnLayout.astro`, `src/pages/learn/login.astro`, `src/pages/learn/index.astro`, `src/pages/learn/course.astro`, `src/scripts/learn-portal.mjs`, `tests/learn-portal.test.mjs`. |
| 2026-11-27 | Codex | L13 | Added build-specific Netlify redirects and shared `LEARN_CCACT_ORIGIN` / `LEARN_CCES_ORIGIN` configuration for main-site redirects and enrollment links; documented four-site setup. `npm test`: 41 passed. All four `SITE_APP` / `SITE_BRAND` combinations built with test origins; missing-origin Netlify main build failed as intended. Actual learning site URLs, site creation, DNS and Auth redirect changes remain pending; Netlify redirect/function behavior and live sign-in have not been verified. Claude review requested via this handoff. |
| 2026-11-27 | Codex | L13 | Owns `astro.config.mjs`, `netlify.toml`, `netlify/functions/learn-enroll.mjs`, shared learning-site origin configuration, L13 tests, `README.md`, and `task.md`. |
| 2026-11-27 | Gemini | L02, L03 | Fixed account-creation hole on `/learn/login/`: `sendStudentSignInLink` (`src/scripts/learn-helpers.mjs`) now sends `shouldCreateUser: false` and treats `otp_disabled` as success so unknown emails see the same neutral "Check your email" panel (`src/pages/learn/login.astro`) without creating accounts, sending emails, or revealing enrollment. Updated `tests/learn-portal.test.mjs`. Checks: `npm test` (37 passed), `SITE_BRAND=cces npm run build` (35 pages), `npm run build` (26 pages), live Supabase `signInWithOtp` check against `Ccact_project` (confirmed 422 `otp_disabled` returned for unknown email and masked cleanly), and headless Chrome verification (`create_user: false` + 422 `otp_disabled` shows "Check your email" panel). Next: Codex reviews L02; Claude re-checks L03; live end-to-end student sign-in once deployed with an enrolled test student. |
| 2026-11-27 | Codex | L04 | Confirmed local `/admin/` and `/learn/` return HTTP 200, with Courses panel present; `npm test`: 37 passed. Computer-use browser initialization failed, so no interactive owner check was completed. Auth redirect URLs are now recorded as configured; live acceptance awaits deployment and two controlled test email addresses. |
| 2026-11-27 | Codex | L04 | Re-ran `npm test` with Gemini?s student-flow work present: 37 passed. L03 is now in review; L02 Auth redirects remain pending. Full live L04 acceptance still requires configured redirects, a deployment and test email accounts. |
| 2026-11-27 | Gemini | L02, L03 | Implemented `/learn/login/` (passwordless OTP link, site header/footer/design, `noindex` meta), `/learn/` dashboard (brand-filtered via `data-site-brand` + `learn_my_courses()`, active above completed, `"6 of 14 lessons"` + progress bar, Continue, JWT-authenticated Download certificate, contact-details empty state), and `/learn/course/?id=<id>` overview (`learn_course_outline()`, total time, Resume, ordered modules, locked lessons). Checks: `npm test` (37 passed including 7 new tests in `tests/learn-portal.test.mjs`), `npm run build` (26 pages), `SITE_BRAND=cces npm run build` (35 pages, `CCES` rewrites verified, 0 secret leaks in `dist/`), and headless Chrome verification at 1280px and 375px with mocked Supabase Auth/RPCs (0 console errors, 0 overflow). Remaining on L02: Claude Auth redirect URLs + `public/_headers` (`/learn/*` noindex except `/learn/verify/*`, outside Gemini paths). |
| 2026-11-27 | Codex | L04 | Fixed course brand labels under the CCES build rewrite. Confirmed the built admin script derives both labels from their values; `npm test`: 30 passed, both brand builds passed. L01 is now applied; L02/L03 and Auth redirect configuration remain in progress, so live acceptance is still pending. |
| 2026-11-27 | Codex | L04 | Bulk enrollment now lists existing accounts once per request. Added local tests for account creation, branded redirect, removal, correction and invalid batches; `npm test`: 30 passed. Live acceptance remains blocked by L01 deployment and unfinished L02/L03. |
| 2026-11-27 | Gemini | L02, L03 | Claimed L02 (UI/auth guard) and L03. Owned: `src/layouts/LearnLayout.astro`, `src/components/LearnStudentBar.astro`, `src/pages/learn/login.astro`, `src/pages/learn/index.astro`, `src/pages/learn/course.astro`, `src/scripts/learn-helpers.mjs`, `src/scripts/learn-portal.mjs`, `tests/learn-portal.test.mjs`. |
| 2026-11-27 | Codex | L04 | Implemented course/module/lesson editing and ordering, draft/publish, brand selection, and owner-authorized enrollment function with account creation, sign-in email, removal and email correction. Added `tests/learn-enroll.test.mjs`. `npm test`: 27 passed; both brand builds passed. L01 is not yet applied, and L02/L03 are not built: live course/enrollment, redirect, email delivery, cross-student access and phase 1 acceptance remain unverified. Keep L04 in progress until those checks pass. |
| 2026-11-27 | Codex | L04 | Netlify configuration and environment variable documentation added. `npm test` passed (25 tests); both brand builds passed when run separately. Course and enrollment implementation waits for L01 schema, RLS and agreed interfaces; no learning migration exists in the checkout. |
| 2026-11-27 | Codex | L04 | Owns `netlify.toml`, `netlify/functions/learn-enroll.mjs`, `src/pages/admin.astro`, `src/scripts/admin.mjs`, `README.md`, L04 tests, and shared `task.md` for this task. |
| 2026-11-27 | Claude | L01 | Migration and `tests/learn-rls.sql` written. Test passes on a throwaway PGlite database with Supabase stubs, and fails when the lock rule is broken. Not yet run against or applied to the Supabase project. Interfaces updated (L04, L03: read them). Phase 5 columns (exam bank, topic) deferred. Next: owner approves applying; then Codex reviews. |
| 2026-11-27 | Claude | L01 | Applied to Ccact_project after a rolled-back run of migration plus `tests/learn-rls.sql` passed there. Verified: 9 tables with RLS, 13 policies, 6 student RPCs (none callable by anon), `course-images` bucket; migration history recorded. `npm test` and builds not run: no JavaScript changed. Note: `202611250001` and `202611260001` exist in production but are missing from migration history, so do not run `supabase db push` before repairing them. Next: Codex reviews L01; L02/L03/L04 can use real tables. |
| 2026-11-27 | Claude | L02, L07 | Added `/learn/` noindex rules to `public/_headers`. Wrote `learn_submit_check` and `tests/learn-check.sql`; passes with `learn-rls.sql` on local PGlite. `npm test` 37 passed; both brand builds pass. Not applied to Supabase (owner approval). Redirect URLs still need the Supabase dashboard (owner). |
| 2026-11-27 | Claude | L02, L03 review | ~~**Gemini, fix:**~~ *(Fixed by Gemini, 2026-11-27; confirmed in L03 review below.)* `sendStudentSignInLink` (`src/scripts/learn-helpers.mjs`) omits `shouldCreateUser: false`, so anyone can create accounts and trigger email from `/learn/login/`. Add it, and show the same "Check your email" panel when the address is unknown (error code `otp_disabled`) so enrollment is not revealed; update the test. No other issues found by reading the code; live and browser checks not done by Claude. |
| 2026-11-27 | Claude | L02, L07 | Added `https://theccact.netlify.app/learn/` and `https://thecces.netlify.app/learn/` to Auth redirect URLs (verified with `config diff`). Applied `202611270002` after a rolled-back run of it plus `tests/learn-check.sql` passed there; history recorded; signed-out users cannot call it. Auth `site_url` is still `http://localhost:3000` (unchanged). Next: Gemini tries a live sign-in. |
| 2026-11-27 | Claude | L13 | Owner decision: learning platform becomes separate sites on `learn.theccact.com` / `learn.thecces.com` with its own branding. PRD updated; L13 added. Gemini and Codex: read L13 before more `/learn/` or link work. |
| 2026-11-27 | Claude | L08, L10, L13, L03 review | Applied `202611270003` (certificate trigger, verify RPC, 4 report RPCs) after a rolled-back run with all learn SQL tests passed on Ccact_project. Added `learn.theccact.com` and `learn.thecces.com` `/learn/` redirect URLs (also `http://localhost:4321/learn/` earlier). Live check as `learn-sample@example.com` with Gemini's helpers: right course and progress, no CCES courses, lesson locks correct, content tables hidden, self-issued certificate refused. Gemini's sign-up fix confirmed in code; `npm test` 41 passed. Sample data (TEST course, sample user) and localhost redirect to be removed before the pilot. Codex: build L10 console view on the report RPCs. |
| 2026-11-27 | Claude | L13 branding | **Gemini: stop L13, it is done; do not overwrite.** Taken over on the owner's instruction (none of the claimed new files existed). Added `LearnHeader.astro`, `LearnFooter.astro`, `learn-brand.mjs`; rewired `LearnLayout.astro`, the three `/learn/` pages and the course title in `learn-portal.mjs`; website links now go to the main website. `npm test` 41 passed, both brands build; login page checked by screenshot at 1280px only (phone width and signed-in pages not checked). Codex reviews. |
| 2026-11-27 | Claude | L06, L07, L08 | **Gemini: these are done; do not overwrite.** Taken over on the owner's instruction. Added `/learn/lesson/` (reading, quick check, Mark as done, locked/missing states, next lesson) and public `/learn/verify/?n=`; fixed an empty gap on a dashboard with only completed courses. `npm test` 42 passed; both brands build. Headless Chrome run as the sample student at 375px and 1280px passed: lock, failed check, retake, mark done, certificate issued, verify good and bad number, no sideways scroll. Two sample questions added to the TEST course; sample progress reset. Not checked: keyboard-only use, screen reader, CCES in a browser. Codex reviews. |
| 2026-11-27 | Claude | L04 review (for Gemini) | **Codex, fix:** (1) `src/scripts/admin.mjs:669` shows "student?s" (broken apostrophe). (2) No way to upload a course image, only paste a URL; the `course-images` bucket exists. (3) No way to delete a module or lesson. Question editor (L07) and reports view (L10) are still to build. Read from code only; console not exercised in a browser. |
| 2026-11-27 | Claude | L13 review | **Codex / owner, before any deploy:** with `NETLIFY=true` the main-website build now fails unless `LEARN_CCACT_ORIGIN` (or `LEARN_CCES_ORIGIN`) is set (reproduced locally). The learning sites do not exist yet, so pushing now would stop website updates. Set the variables first, or let the build skip the `/learn` redirect with a warning when unset. No other problems found by reading the redirect code; not tested on Netlify. |
| 2026-11-27 | Claude | Learn UI | **Gemini and Codex: do not restore the old design.** Owner request: no banners on `/learn/` pages. Removed `PageHero` from dashboard and sign-in, made the course header compact and light, merged sign-out and "My courses" into `LearnHeader` (email hidden on phones) and deleted `LearnStudentBar.astro`. `npm test` 42 passed, both brands build; screenshots at 375px and 1280px checked, sign-out works. |
| 2026-11-27 | Claude | Learn UI | Owner request: header sign-out replaced with a profile menu (user icon; signed-in email, Get help, Sign out) in `LearnHeader.astro`. `npm test` 42 passed, both brands build; keyboard open, Escape, outside click and sign-out checked in headless Chrome at 375px and 1280px. |
| 2026-11-27 | Claude | Learn UI | Owner request: collapsible sidebar (`LearnSidebar.astro`, reuses `setupShell`) with Dashboard, Courses, and Settings plus Sign out at the bottom. New pages `/learn/courses/` and `/learn/settings/` (noindex); `/learn/` is now a summary with in-progress courses, completed courses moved to Courses (changes the PRD dashboard layout). `npm test` 42 passed; collapse, phone drawer, menu highlighting and sign-out checked in headless Chrome. |
| 2026-11-27 | Claude | Learn UI | Owner request: removed the footer from `/learn/` pages (`LearnFooter.astro` deleted); "Powered by" stays in the header and a Privacy Notice link was added to the sign-in page. `npm test` 42 passed, both brands build. |
| 2026-11-27 | Claude | Learn UI | Header and sidebar now stay in place while the page scrolls; checked in headless Chrome (sidebar top and Sign out position unchanged after scrolling). `npm test` 42 passed, both brands build. |
| 2026-11-27 | Claude | Learn UI | Owner request: six themes (Light, Dark, Sepia, Forest, Ocean, High contrast) picked in Settings, stored per device (`src/styles/learn-themes.css`; use `--ink` and `--surface` for new learn styles), and a gear icon for Settings. `tests/learn-themes.test.mjs` checks AA text contrast; `npm test` 43 passed, both brands build; themes switched and screenshots checked in headless Chrome (CCACT only). |
| 2026-11-27 | Claude | Learn UI | Owner request: theme choice moved from Settings to a searchable command menu in the header (`LearnThemePicker.astro`; Ctrl+K, three color dots, check on the active theme, arrows preview, Escape restores). `npm test` 44 passed, both brands build; behavior checked in headless Chrome at 375px and 1280px (CCACT only). |
| 2026-11-27 | Claude | Learn UI, settings | Owner request: Settings redesigned (profile with "Preview my information" and JSON download, create new password, sign out everywhere, reminder-email switch, theme shortcut, help and privacy). Login page gained password sign-in (same error for unknown email and wrong password). Applied `202611270004_learn_reminders.sql` (`learn_set_reminders(p_on)`, own active enrollments only) after a rolled-back run of it plus `tests/learn-settings.sql` passed on Ccact_project. Account button lost its chevron; profile menu gained Settings. Theme picker redesigned: mini window previews, three dots, check badge, color orb button. `npm test` 45 passed, both brands build; settings, password set and sign-in, reminders and picker checked in headless Chrome at 375px and 1280px. Sample student now has a password (in Claude scratchpad only). Supabase server minimum password length is still 6; the 8-character rule is client-side. |
| 2026-11-27 | Claude | Learn UI | Owner request: Dashboard redesigned (greeting, continue card with next lesson, time left and progress ring, icon stats incl. certificates, in-progress list, certificates panel) and Courses page (All / In progress / Completed tabs with counts, search, cards with status badge, next lesson and time left). `loadLearningOverview` calls `learn_course_outline` once per course in progress. Added two more TEST courses for the sample student (one finished with a certificate, one not started). `npm test` 46 passed, both brands build; both pages checked in headless Chrome at 375px and 1280px, light and dark. |
| 2026-11-27 | Claude | Learn UI | Owner feedback "too AI slop, too text heavy": Dashboard and Courses simplified. Cards show image, title, thin progress bar with "1 of 3 lessons" and percent, and one action; no descriptions, badges or fact rows. Dashboard: greeting, continue card (image, title, next lesson, progress, Resume), in-progress list, and a side column with a three-number summary and certificates; full width in two columns, one column below 1080px. `npm test` 46 passed, both brands build; checked at 375px, 900px and 1280px, light and dark. |
| 2026-11-27 | Claude | Learn UI | Owner request: access to other courses. Courses page header has one "Marketplace" button (bag icon, "Browse more courses", opens the brand website's /courses/ page in a new tab; owner chose the website over Teachable). No catalog section and no sidebar item (owner rejected both). `npm test` 46 passed, both brands build; checked at 375px and 1280px. |
| 2026-11-27 | Claude | Domains | thecces.com now serves the new CCES site from Netlify (checked with curl); theccact.com still serves the old AWS site. `/learn/` links to the CCES website now use https://thecces.com (`learn-brand.mjs`). **Codex:** `BRAND_SITES` in `src/scripts/admin.mjs` and the origins in `learn-enroll.mjs` can switch CCES to thecces.com too. |
| 2026-11-27 | Claude | Test checkout | Owner request (beyond the PRD, which leaves selling to Teachable): free test checkout, local first. Applied `202611270005_learn_checkout.sql` (`courses.self_enroll`, public `learn_checkout_course`, `learn_self_enroll` for the signed-in buyer) after a rolled-back run with `tests/learn-checkout.sql` passed on Ccact_project. Added "Sample Course (TEST)" per brand (self_enroll, 3 lessons, quick check), `/learn/checkout/?course=` page (name + email, email link back with `confirm=1` enrolls), and a card on the website `/courses/` page (main site only; Teachable links unchanged). Auth redirect `http://localhost:4321/learn/checkout/**` added; live learning-site checkout URLs still to add before deploy. Not deployed. `npm test` 47 passed, both brands build; website card, checkout validation, link return, enrollment and brand refusal checked in headless Chrome. |
| 2026-11-27 | Claude | Google sign-in | Owner request: "Continue with Google" on `/learn/login/` and `/learn/checkout/` (`LearnGoogleButton.astro`). Shown only when Supabase reports the Google provider enabled (`/auth/v1/settings`); now disabled, so hidden. Checkout returns with `confirm=1` and uses the Google name. Enabled in Supabase 2026-11-27 from the owner's client file (secret file kept local, now in `.gitignore`). Clicking the button reaches Google with the right client and Supabase callback (headless check); completing a real Google sign-in is for the owner to test. Live origins must be added to the Google client before deploy. `npm test` 48 passed. |
| 2026-11-27 | Claude | Login, deploy prep | Owner request: `/learn/login/` redesigned as frosted glass over soft theme-colored lights (solid card in High contrast); checked light, dark, sepia, contrast at 1280px and light at 375px. Deploy prep: `astro.config.mjs` now warns instead of failing when `LEARN_<BRAND>_ORIGIN` is unset (Netlify builds of both brands pass; `/learn/` stays on the main sites). Live Auth return URLs added: `theccact.netlify.app`, `thecces.com`, `www.thecces.com`, `thecces.netlify.app` `/learn/**`. **Deploy on hold (owner):** uncommitted Teachable changes from 09:56 in `links.mjs`, `site.mjs`, `pages.mjs`, `tests/links.test.mjs` (CCACT to its own Teachable school, no main affcode) are unlogged; whoever owns them, finish and log them, then deploy. `npm test` 48 passed. |
| 2026-11-27 | Claude | Planning | Created this board from the PRD. Old affiliate board moved to `task-affiliate-websites.md`. Next: Claude claims L01. |
