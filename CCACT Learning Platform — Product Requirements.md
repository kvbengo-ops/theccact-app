# CCACT Learning Platform — Product Requirements

Nov 27, 2026 · @Kyle Engo

## Overview

CCACT and CCES will host their own courses inside their websites, at `/learn/`, instead of sending students to a separate course platform.

A student signs in, sees the courses they are enrolled in, and works through each course in short lessons with a quick check after each one. At the end they take a practice exam (exam-prep courses only) and download a certificate. Reminder emails bring back students who stop.

The learners are mostly working nurses and healthcare professionals, many preparing for licensing exams while working shifts. The design follows from that: short lessons that fit a break, practice over passive watching, visible progress, and a credential at the end.

This document covers the learning experience only. How students pay and get enrolled automatically (checkout, affiliate commissions) is a separate, later project. Until then, the owner enrolls students from the console.

## Goals and success criteria

The build succeeds when a student can finish a course without help, and when the owners can see where students get stuck.

| Goal | How it is measured |
| --- | --- |
| Students finish what they start | Course completion rate, tracked per course from launch |
| Students come back | Share of enrolled students active in the last 7 days |
| Students actually learn | Average quick-check and practice-exam scores, and how they improve on retakes |
| Owners can fix weak lessons | The console shows, per lesson, where students stop and which questions they fail most |
| Adding a course is an admin task | A course with 10 lessons can be entered in the console in under an hour, with no code changes |
| It matches the websites | The learning area uses the same CCACT and CCES design, header and sign-in as the sites |

## Out of scope for version one

- Online payment, checkout and automatic enrollment after purchase. Teachable keeps selling courses until the checkout project ships.
- Affiliate commissions on course sales.
- Moving existing Teachable students and courses.
- Discussion forums, live classes and study groups.
- Streaks, badges and leaderboards.
- Spaced-repetition flashcards.
- A mobile app. The learning area works in the phone browser.
- Proctored exams.

## Users and roles

| Role | What they do | How they sign in |
| --- | --- | --- |
| Student | Takes enrolled courses, sees progress, downloads certificates | Email sign-in link (no password needed), at `/learn/login/` |
| Owner (admin) | Creates courses, enrolls students, reads reports | Existing owner sign-in at `/admin/` |
| Affiliate | No change in version one | Existing affiliate sign-in |

Students, affiliates and the owner share one Supabase sign-in system. A person's role decides what they see. A student never sees the owner console, and cannot open a course they are not enrolled in.

## The student learning flow

1. **Dashboard** — the student's enrolled courses, each with progress and a Continue button.
2. **Course overview** — the course's modules and lessons, which are done, and a "Resume" button.
3. **Lesson** — 5 to 10 minutes of video or reading.
4. **Quick check** — 2 or 3 questions with instant feedback.
   - Not passed: the student is pointed to the part of the lesson to review, then retakes the check.
   - Passed: the next lesson unlocks.
5. **Practice exam** — after the last lesson, for exam-prep courses only.
6. **Certificate** — a PDF the student downloads from the dashboard.

A reminder email brings inactive students back to the dashboard.

## Student dashboard

One card per enrolled course, showing:

- Course name and image.
- Progress, as "6 of 14 lessons" and a bar.
- A **Continue** button that opens the next unfinished lesson.
- **Download certificate**, once the course is complete.

Completed courses stay on the dashboard, below the courses in progress. A student with no courses sees a short message and the contact details.

## Course overview

- Course title, short description and estimated total time.
- Modules, each with its lessons in order. Each lesson shows its length and whether it is done.
- A **Resume** button at the top.
- Lessons unlock in order: a lesson opens once the previous lesson's quick check is passed. The owner can turn this off per course, so all lessons are open from the start.

## Lessons

- Each lesson is a video, a reading, or both, plus optional downloadable files (cheat sheets, charts).
- Videos play from a video host (Bunny Stream or Mux), through links that expire, so they cannot be shared outside the course.
- The student's place in a video is saved, so they can stop mid-lesson and pick up later on any device.
- A lesson counts as done when its quick check is passed. A lesson with no quick check is done when the student clicks **Mark as done**.

## Quick checks

- 2 or 3 questions after a lesson. Question types for version one: single choice, multiple choice, true or false.
- Each answer shows instantly whether it was right, with a short explanation written by the owner.
- Pass mark is set per course (default 2 out of 3, or about 70%).
- If the student does not pass, each wrong answer can point to the part of the lesson to review. Unlimited retakes.
- Every attempt is saved, for the owner's reports.

## Practice exams

Exam-prep courses only, such as CRNER. **Phase 2**: Classmarker stays in use until this ships.

- Timed mock exam drawn at random from a question bank, so each attempt is different.
- Score history, so the student can see improvement.
- Results by topic, with a "review your weak topics" list linking back to the lessons.
- Pass mark and time limit set per exam.

## Certificates

- Issued automatically when every lesson is done and, where there is one, the practice exam is passed.
- A PDF in the site's brand (CCACT or CCES crest and colours), showing:
  - the student's name;
  - the course name;
  - completion date;
  - continuing-education hours, where the course has them;
  - a certificate number.
- Each certificate number can be checked on a public page, `/learn/verify/<number>/`, which confirms it is genuine without showing anything private.
- The student downloads it from the dashboard at any time.

## Reminder emails

| Email | Sent when |
| --- | --- |
| Welcome | The student is enrolled. Includes the sign-in link. |
| Halfway | Progress in a course passes 50%. |
| We miss you | No sign-in for 7 days while a course is unfinished. Sent at most once a week, at most 3 times per course. |
| Almost there | One lesson or the exam left. |
| Certificate ready | The course is complete. |

Every email has an unsubscribe link for the reminder emails. Welcome and certificate emails are always sent.

## Owner console

A new **Courses** section in the existing `/admin/` console.

- **Courses:** create and edit courses, modules and lessons. Upload videos and files, and write quick-check questions and explanations. Save as draft, then publish.
- **Students:**
  - Enroll a student by email, one at a time or by pasting a list. This sends the welcome email.
  - Remove an enrollment.
  - Correct a student's email.
- **Reports:**
  - Per course: enrolled, active this week, completed, completion rate.
  - Per lesson: how many students reached it, and the drop-off point.
  - Per question: the share answered wrongly, to find confusing questions.
  - Per student: progress and scores.

Each course belongs to one brand, CCACT or CCES, as affiliates do now. A course shows only on its own site.

## Data

New Supabase tables, alongside the existing affiliate tables:

| Table | Holds |
| --- | --- |
| `courses` | Title, description, brand, image, CE hours, pass mark, lessons-in-order setting, status (draft, published, archived) |
| `modules` | Course, title, order |
| `lessons` | Module, title, order, video id, reading text, files, length |
| `questions` | Lesson (quick check) or exam bank, type, text, options, correct answers, explanation, topic |
| `enrollments` | Student, course, enrolled date, enrolled by, status |
| `lesson_progress` | Student, lesson, video position, done date |
| `quiz_attempts` | Student, lesson or exam, answers, score, passed, date |
| `certificates` | Student, course, number, issued date |
| `email_log` | Student, email type, sent date (stops duplicate reminders) |

Row-level security is set so students can only read their own enrollments, progress and certificates, and only the lessons of courses they are enrolled in. Correct answers are never sent to the browser before an answer is submitted: quick checks are marked by a server function.

## Technical approach

- **Same repository and deploy as the websites.** The learning area is new pages under `/learn/`, built like `/admin/` and `/affiliate/` are today. They are static pages that load data from Supabase after sign-in. Both brands get it from the same build.
- **Netlify Functions** handle the work that must not run in the browser:
  - marking quick checks;
  - signing video links;
  - generating certificate PDFs;
  - sending emails;
  - a daily scheduled job for reminder emails.
- **Supabase** (existing project) for sign-in, data and file storage. It should move to the paid plan before launch, for daily backups and so the project never pauses.
- **Video host:** Bunny Stream or Mux. Not Netlify, which would use up its bandwidth allowance.
- **Email:** Resend or Postmark, sending from the CCACT and CCES domains.
- **No VPS.** Everything runs on hosted services.

## Delivery phases

| Phase | Delivers | Rough time |
| --- | --- | --- |
| 1. Foundations | Tables and security rules, student sign-in, dashboard, course overview, owner can create a course and enroll students | 1–2 weeks |
| 2. Learning | Lessons with video and reading, progress tracking, quick checks with feedback | 1–2 weeks |
| 3. Completion | Certificates and verify page, reminder emails, owner reports | 1 week |
| 4. Pilot | One real course with a small group of students; fix what they hit | 1–2 weeks |
| 5. Practice exams | Question bank, timed exams, topic results; Classmarker retired | 2–3 weeks |

Phases 1–4 are version one. Times are estimates for one developer and depend on how course content is supplied.

## Decisions needed before build

1. **First course:** which course goes first for the pilot, and who supplies its lesson videos, text and questions?
2. **Certificate wording and CE hours:** what each certificate must say, and whether any course carries accredited continuing-education hours. If so, the accrediting body may set the wording.
3. **Pass marks:** keep the default of about 70% for quick checks, or set per course?
4. **Lesson order:** lessons unlock in order by default. Is that right for every course?
5. **Video host:** Bunny Stream (cheaper) or Mux (simpler). Compare the cost for the expected hours of video.
6. **Email sender:** which address the emails come from, for each brand.
7. **Course access length:** does enrollment last forever, or expire (for example, after 12 months)?

## Assumptions, dependencies and risks

- **Course content is the critical path.** Lessons need to be cut into 5–10 minute pieces and quick-check questions written. That is the clients' work, and it usually takes longer than the build.
- **Two systems for a while.** Students on Teachable and students on the new platform will coexist until the checkout and migration projects ship.
- **One developer.** Only one person knows the system. Keep it documented, and keep course editing in the console so day-to-day work needs no developer.
- **Video costs grow with viewing.** Video is paid per use, so watch the video host's usage in the first months.
- **Student data.** The platform will store names, emails and scores. The Privacy Notice needs updating before launch.
