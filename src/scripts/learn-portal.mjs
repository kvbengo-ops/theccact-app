import { createClient } from '@supabase/supabase-js';
import { ICONS } from '../lib/icons.mjs';
import {
  LEARN_NEXT_KEY,
  authRedirectError,
  buildLoginUrl,
  googleSignInEnabled,
  signInWithGoogle,
  checkCheckoutDetails,
  checkStudentDetails,
  loadStudentProfile,
  saveStudentProfile,
  loadCheckoutCourse,
  selfEnroll,
  startCheckout,
  courseMatches,
  greeting,
  loadLearningOverview,
  checkNewPassword,
  formatDate,
  loadMyInformation,
  saveNewPassword,
  setReminders,
  signInStudentWithPassword,
  collectAnswers,
  courseOverviewUrl,
  fetchCertificatePdf,
  formatClock,
  formatDuration,
  lessonUrl,
  loadCourseOverviewData,
  loadDashboardData,
  loadStudentUser,
  loadLessonData,
  markLessonDone,
  submitQuickCheck,
  verifyCertificate,
  normalizeBrand,
  sanitizeLearnNext,
  sendStudentSignInLink,
} from './learn-helpers.mjs';
import { markTerms, normalizeSpeech, pickVoice, readingBlocks, recallPrompt, recallSeconds, speechChunks, spokenText } from './learn-reading.mjs';

const EXTRA_ICONS = {
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
};

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  el.append(...kids.flat().filter((kid) => kid != null && kid !== false));
  return el;
}

function svg(name) {
  const path = ICONS[name] ?? EXTRA_ICONS[name] ?? '';
  const template = document.createElement('template');
  template.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  return template.content.firstChild;
}

function showMessage(el, message = '') {
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
}

function readNextFromStorage() {
  try {
    const saved = sessionStorage.getItem(LEARN_NEXT_KEY);
    if (!saved) return '';
    sessionStorage.removeItem(LEARN_NEXT_KEY);
    const safe = sanitizeLearnNext(saved);
    return safe !== '/learn/' ? safe : '';
  } catch {
    return '';
  }
}

function saveNextToStorage(nextPath) {
  try {
    const safe = sanitizeLearnNext(nextPath);
    if (safe !== '/learn/') sessionStorage.setItem(LEARN_NEXT_KEY, safe);
    else sessionStorage.removeItem(LEARN_NEXT_KEY);
  } catch {
    /* ignore storage errors in restricted browsing */
  }
}

function buildFallbackMedia() {
  return h('div', { class: 'learn-card__fallback', 'aria-hidden': 'true' }, svg('cap'));
}

function courseMedia(course, className) {
  const media = h('div', { class: className });
  if (course.image) {
    const img = h('img', { src: course.image, alt: '', loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', () => media.replaceChildren(buildFallbackMedia()), { once: true });
    media.append(img);
  } else {
    media.append(buildFallbackMedia());
  }
  return media;
}

// Thin bar with one short line of text: "1 of 3 lessons" and the percent.
function meter(course) {
  return h('div', { class: 'meter' },
    h('div', {
      class: 'learn-progress',
      role: 'progressbar',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': String(course.progressPercent),
      'aria-label': `${course.title}: ${course.progressText}`,
    }, h('span', { class: 'learn-progress__fill', style: `width: ${course.progressPercent}%` })),
    h('p', { class: 'meter__text' },
      h('span', { text: course.complete ? 'Completed' : course.progressText }),
      h('span', { text: `${course.progressPercent}%` })),
  );
}

function certificateButton(course, onDownloadCert, label = true) {
  return h('button', {
    type: 'button',
    class: label ? 'btn btn--outline-navy mc__action' : 'icon-btn',
    'aria-label': label ? null : `Download certificate for ${course.title}`,
    title: label ? null : 'Download certificate',
    onclick: (event) => onDownloadCert(course.courseId, event.currentTarget),
  }, svg('download'), label ? 'Certificate' : null);
}

function buildCourseCard(course, onDownloadCert) {
  const started = course.doneLessons > 0;
  const action = course.complete
    ? certificateButton(course, onDownloadCert)
    : course.nextLessonId
      ? h('a', { class: 'btn btn--gold mc__action', href: lessonUrl(course.nextLessonId) }, started ? 'Continue' : 'Start', svg('arrow'))
      : null;
  return h('article', { class: 'mc', 'data-course': course.courseId },
    courseMedia(course, 'mc__media'),
    h('div', { class: 'mc__body' },
      h('h3', { class: 'mc__title' },
        h('a', { href: courseOverviewUrl(course.courseId), text: course.title }),
        course.complete ? h('span', { class: 'mc__done', title: 'Completed' }, svg('check')) : null),
      meter(course),
      action),
  );
}

function buildModuleCard(mod, moduleNumber, nextLessonId) {
  const summaryText = `${mod.doneCount} of ${mod.totalCount} done`;
  const list = h('ol', { class: 'learn-lesson-list' });

  for (const lesson of mod.lessons) {
    const duration = formatDuration(lesson.lengthMinutes);
    const isNext = !lesson.done && lesson.unlocked && lesson.lessonId === nextLessonId;
    const statusLabel = lesson.done ? 'Done' : isNext ? 'Up next' : lesson.unlocked ? 'Available' : 'Locked';
    const statusClass = lesson.done
      ? 'learn-lesson-badge--done'
      : isNext
        ? 'learn-lesson-badge--next'
        : lesson.unlocked
          ? 'learn-lesson-badge--open'
          : 'learn-lesson-badge--locked';

    const iconName = lesson.done ? 'check' : lesson.unlocked ? 'play' : 'lock';
    const content = [
      h('span', { class: `learn-lesson__icon ${lesson.done ? 'is-done' : lesson.unlocked ? 'is-open' : 'is-locked'}`, 'aria-hidden': 'true' }, svg(iconName)),
      h(
        'span',
        { class: 'learn-lesson__text' },
        h('span', { class: 'learn-lesson__title', text: `${lesson.number}. ${lesson.title}` }),
        !lesson.unlocked
          ? h('span', { class: 'learn-lesson__lock-hint', text: 'Complete the previous lesson to unlock.' })
          : null,
      ),
      h(
        'span',
        { class: 'learn-lesson__meta' },
        duration ? h('span', { class: 'learn-lesson__length', text: duration }) : null,
        h('span', { class: `learn-lesson-badge ${statusClass}`, text: statusLabel }),
      ),
    ];

    if (lesson.unlocked) {
      list.append(
        h(
          'li',
          { class: 'learn-lesson-item' },
          h(
            'a',
            {
              class: `learn-lesson learn-lesson--unlocked ${lesson.done ? 'is-done' : ''} ${isNext ? 'is-next' : ''}`,
              href: lessonUrl(lesson.lessonId),
            },
            ...content,
          ),
        ),
      );
    } else {
      list.append(
        h(
          'li',
          { class: 'learn-lesson-item' },
          h(
            'div',
            { class: 'learn-lesson learn-lesson--locked', 'aria-disabled': 'true' },
            ...content,
          ),
        ),
      );
    }
  }

  return h(
    'section',
    { class: 'learn-module editorial-card', 'aria-labelledby': `module-title-${mod.moduleId}` },
    h(
      'div',
      { class: 'learn-module__head' },
      h(
        'div',
        {},
        h('p', { class: 'learn-module__kicker', text: `Module ${moduleNumber}` }),
        h('h2', { id: `module-title-${mod.moduleId}`, class: 'learn-module__title', text: mod.title }),
      ),
      h('span', { class: 'learn-module__count', text: summaryText }),
    ),
    list,
  );
}

export function setupLearnPortal(root, client) {
  const page = root.dataset.learnPage;
  const siteBrand = normalizeBrand(root.dataset.siteBrand || document.documentElement.dataset.brand);
  const brandName = root.dataset.brandName || 'CCACT';
  const $ = (selector) => root.querySelector(selector);

  const setState = (state) => {
    root.dataset.state = state;
  };

  function paintSignedInUser(user) {
    const emailEl = document.querySelector('#learn-user-email'); // in the page header, outside root
    if (emailEl) emailEl.textContent = user?.email ?? '';
    for (const logoutBtn of document.querySelectorAll('[data-logout]')) {
      if (logoutBtn.dataset.bound) continue;
      logoutBtn.dataset.bound = '1';
      logoutBtn.addEventListener('click', async () => {
        logoutBtn.disabled = true;
        try {
          await client.auth.signOut();
        } finally {
          location.replace('/learn/login/');
        }
      });
    }
  }

  async function handleCertificateDownload(courseId, button, statusEl) {
    if (!button) return;
    const originalChildren = [...button.childNodes];
    button.disabled = true;
    button.textContent = 'Preparing certificate…';
    showMessage(statusEl, '');
    try {
      const { blob, filename } = await fetchCertificatePdf(client, courseId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      showMessage(statusEl, error.message || 'Could not download your certificate right now.');
      statusEl?.focus?.();
    } finally {
      button.disabled = false;
      button.replaceChildren(...originalChildren);
    }
  }

  // "Continue with Google" on the sign-in and checkout pages.
  async function setupGoogle(redirectTo, errorEl, beforeLeave = () => {}) {
    const box = $('.learn-oauth');
    if (!box) return;
    if (!(await googleSignInEnabled(root.dataset.supabaseUrl, root.dataset.supabaseKey))) return;
    box.hidden = false;
    const button = box.querySelector('[data-google]');
    button.addEventListener('click', async () => {
      button.disabled = true;
      showMessage(errorEl, '');
      try {
        beforeLeave();
        await signInWithGoogle(client, redirectTo);
      } catch (error) {
        showMessage(errorEl, error.message);
        button.disabled = false;
      }
    });
  }

  function setupLoginView() {
    const form = $('#learn-login-form');
    const emailInput = $('#learn-email');
    const errorEl = $('#learn-login-error');
    const sentPanel = $('#learn-login-sent');
    const sentEmailEl = $('#learn-sent-email');
    const resetBtn = $('#learn-login-reset');

    const redirectMessage = authRedirectError(location.search, location.hash);
    if (redirectMessage) showMessage(errorEl, redirectMessage);

    const nextFromQuery = new URLSearchParams(location.search).get('next') || '';
    saveNextToStorage(nextFromQuery);

    if (form && !form.dataset.bound) {
      form.dataset.bound = '1';
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        showMessage(errorEl, '');
        const button = form.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Sending link…';
        try {
          const redirectTo = `${location.origin}/learn/`;
          const { email } = await sendStudentSignInLink(client, emailInput?.value, redirectTo);
          if (sentEmailEl) sentEmailEl.textContent = email;
          form.hidden = true;
          if (sentPanel) {
            sentPanel.hidden = false;
            sentPanel.focus?.();
          }
        } catch (error) {
          showMessage(errorEl, error.message || 'Could not send the sign-in link right now.');
          emailInput?.focus();
        } finally {
          button.disabled = false;
          button.textContent = originalText;
        }
      });
    }

    if (resetBtn && !resetBtn.dataset.bound) {
      resetBtn.dataset.bound = '1';
      resetBtn.addEventListener('click', () => {
        if (sentPanel) sentPanel.hidden = true;
        if (form) form.hidden = false;
        showMessage(errorEl, '');
        emailInput?.focus();
      });
    }

    const passwordForm = $('#learn-password-form');
    const swap = (usePassword) => {
      form.hidden = usePassword;
      if (sentPanel) sentPanel.hidden = true;
      passwordForm.hidden = !usePassword;
      showMessage(errorEl, '');
      (usePassword ? $('#learn-pw-email') : emailInput)?.focus();
    };
    if (passwordForm && !passwordForm.dataset.bound) {
      passwordForm.dataset.bound = '1';
      $('#learn-use-password')?.addEventListener('click', () => swap(true));
      $('#learn-use-link')?.addEventListener('click', () => swap(false));
      passwordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        showMessage(errorEl, '');
        const button = passwordForm.querySelector('button[type="submit"]');
        button.disabled = true;
        try {
          await signInStudentWithPassword(client, $('#learn-pw-email').value, $('#learn-pw').value);
          location.replace(sanitizeLearnNext(new URLSearchParams(location.search).get('next')));
        } catch (error) {
          showMessage(errorEl, error.message);
          button.disabled = false;
        }
      });
    }

    setupGoogle(`${location.origin}/learn/`, errorEl);
    setState('login');
  }

  async function renderDashboard() {
    const statusEl = $('#learn-status');
    const { active, completed, current, studentName } = await loadLearningOverview(client, siteBrand);
    const onCertClick = (courseId, btn) => handleCertificateDownload(courseId, btn, statusEl);
    const all = [...active, ...completed];
    const empty = all.length === 0;
    $('#learn-empty').hidden = !empty;

    if (page === 'courses') {
      $('#crs-body').hidden = empty;
      for (const [key, count] of [['all', all.length], ['active', active.length], ['done', completed.length]]) {
        $(`[data-count="${key}"]`).textContent = String(count);
      }
      const grid = $('#crs-grid');
      const cards = all.map((course) => [course, buildCourseCard(course, onCertClick)]);
      grid.replaceChildren(...cards.map(([, card]) => card));
      let status = 'all';
      const search = $('#crs-search');
      const apply = () => {
        let shown = 0;
        for (const [course, card] of cards) {
          card.hidden = !courseMatches(course, status, search.value);
          if (!card.hidden) shown += 1;
        }
        $('#crs-none').hidden = shown > 0;
      };
      for (const tab of root.querySelectorAll('[data-filter]')) {
        tab.addEventListener('click', () => {
          status = tab.dataset.filter;
          for (const other of root.querySelectorAll('[data-filter]')) other.setAttribute('aria-pressed', String(other === tab));
          apply();
        });
      }
      search.addEventListener('input', apply);
      setState('app');
      return;
    }

    // Dashboard
    const firstName = String(studentName ?? '').trim().split(/\s+/)[0];
    $('#dash-greeting').textContent = firstName ? `${greeting()}, ${firstName}` : greeting();
    $('#dash-body').hidden = empty;
    if (empty) {
      setState('app');
      return;
    }

    const hero = $('#dash-continue');
    hero.hidden = !current;
    if (current) {
      const started = current.doneLessons > 0;
      hero.replaceChildren(
        courseMedia(current, 'dash-continue__media'),
        h('p', { class: 'dash-continue__label', text: started ? 'Continue where you left off' : 'Start your course' }),
        h('h2', { class: 'dash-continue__title' }, h('a', { href: courseOverviewUrl(current.courseId), text: current.title })),
        current.next ? h('p', { class: 'dash-continue__next', text: `Next: ${current.next.title}` }) : null,
        h('div', { class: 'dash-continue__foot' },
          meter(current),
          current.nextLessonId
            ? h('a', { class: 'btn btn--gold', href: lessonUrl(current.nextLessonId) }, started ? 'Resume' : 'Start', svg('arrow'))
            : null),
      );
    }

    $('#dash-progress').replaceChildren(...active.map((course) => h('li', {},
      h('a', { href: courseOverviewUrl(course.courseId), text: course.title }),
      meter(course))));
    $('#dash-progress-none').hidden = active.length > 0;

    const certs = completed.filter((course) => course.certificateNumber);
    $('#dash-certs').replaceChildren(...certs.map((course) => h('li', {},
      h('a', { href: courseOverviewUrl(course.courseId), text: course.title }),
      certificateButton(course, onCertClick, false))));
    $('#dash-certs-none').hidden = certs.length > 0;
    $('#dash-n-courses').textContent = String(all.length);
    $('#dash-n-lessons').textContent = String(all.reduce((sum, course) => sum + course.doneLessons, 0));
    $('#dash-n-certs').textContent = String(certs.length);
    setState('app');
  }

  async function renderSettings(user) {
    const info = await loadMyInformation(client, user);
    const html = document.documentElement;

    $('#set-avatar').textContent = (info.name || info.email || '?').trim().charAt(0).toUpperCase();
    $('#set-name').textContent = info.name || 'Name not set';
    $('#set-email').textContent = info.email;
    $('#set-since').textContent = formatDate(info.accountCreated);
    $('#set-last').textContent = formatDate(info.lastSignIn);
    $('#set-courses').textContent = String(info.courses.length);
    $('#set-certs').textContent = String(info.courses.filter((course) => course.certificate).length);

    // Preview my information
    const dialog = $('#set-info-dialog');
    const group = (title, pairs) => h('section', { class: 'set-info-group' },
      h('h3', { text: title }),
      h('dl', {}, pairs.flatMap(([term, value]) => [h('dt', { text: term }), h('dd', { text: String(value) })])));
    const themeLabel = () => {
      let value = 'light';
      try { value = localStorage.getItem('learn-theme') || 'light'; } catch { /* default */ }
      return document.querySelector(`#theme-${value}`)?.dataset.label || 'Light';
    };
    $('#set-preview').addEventListener('click', () => {
      $('#set-info').replaceChildren(
        group('Account', [
          ['Email', info.email],
          ['Name on certificates', info.name || 'Not set'],
          ['Account created', formatDate(info.accountCreated)],
          ['Last sign-in', formatDate(info.lastSignIn)],
        ]),
        h('section', { class: 'set-info-group' },
          h('h3', { text: `Courses (${info.courses.length})` }),
          info.courses.length
            ? info.courses.map((course) => h('div', { class: 'set-info-course' }, h('dl', {},
                [['Course', course.title], ['Enrolled', formatDate(course.enrolledAt)],
                  ['Progress', `${course.lessonsDone} of ${course.lessonsTotal} lessons`],
                  ['Certificate', course.certificate ? `#${course.certificate.number}, ${formatDate(course.certificate.issuedAt)}` : 'Not yet']]
                  .flatMap(([term, value]) => [h('dt', { text: term }), h('dd', { text: value })]))))
            : h('p', { class: 'set-note', text: 'You are not enrolled in any courses.' })),
        group('Preferences', [
          ['Reminder emails', $('#set-reminders').checked ? 'On' : 'Off'],
          ['Theme (this device)', themeLabel()],
        ]),
      );
      dialog.showModal();
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
    });
    $('#set-download').addEventListener('click', () => {
      const data = { ...info, reminderEmails: $('#set-reminders').checked, exportedAt: new Date().toISOString() };
      delete data.remindersOn;
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = h('a', { href: url, download: 'my-information.json' });
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    });

    // Password
    const say = (el, message, kind = 'ok') => { el.textContent = message; el.dataset.kind = kind; el.hidden = !message; };
    const reveal = $('[data-reveal]');
    reveal.addEventListener('click', () => {
      const show = reveal.getAttribute('aria-pressed') !== 'true';
      for (const input of [$('#set-password'), $('#set-password-confirm')]) input.type = show ? 'text' : 'password';
      reveal.setAttribute('aria-pressed', String(show));
      reveal.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      reveal.replaceChildren(svg(show ? 'eyeoff' : 'eye'));
    });
    const passwordForm = $('#set-password-form');
    const passwordMsg = $('#set-password-msg');
    passwordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const password = $('#set-password').value;
      const problem = checkNewPassword(password, $('#set-password-confirm').value);
      if (problem) return say(passwordMsg, problem, 'error');
      const submit = passwordForm.querySelector('button[type="submit"]');
      submit.disabled = true;
      try {
        await saveNewPassword(client, password);
        passwordForm.reset();
        say(passwordMsg, 'Password saved. You can now sign in with your email and this password.');
      } catch (error) {
        say(passwordMsg, error.message, 'error');
      } finally {
        submit.disabled = false;
      }
    });

    $('#set-signout-all').addEventListener('click', async (event) => {
      event.currentTarget.disabled = true;
      try { await client.auth.signOut({ scope: 'global' }); } finally { location.replace('/learn/login/'); }
    });

    // Reminder emails
    const reminders = $('#set-reminders');
    const remindersMsg = $('#set-reminders-msg');
    reminders.checked = info.remindersOn;
    reminders.addEventListener('change', async () => {
      reminders.disabled = true;
      try {
        await setReminders(client, reminders.checked);
        say(remindersMsg, reminders.checked ? 'Reminder emails are on.' : 'Reminder emails are off.');
      } catch (error) {
        reminders.checked = !reminders.checked;
        say(remindersMsg, error.message, 'error');
      } finally {
        reminders.disabled = false;
      }
    });

    // Appearance: name of the saved theme, kept current as the picker changes it.
    const paintTheme = () => { $('#set-theme-name').textContent = themeLabel(); };
    paintTheme();
    new MutationObserver(paintTheme).observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    $('#set-theme').addEventListener('click', (event) => {
      event.stopPropagation(); // the picker closes on clicks outside itself
      document.querySelector('.theme-picker__open')?.click();
    });

    setState('app');
  }

  async function renderCourseOverview() {
    const statusEl = $('#learn-course-status');
    const notFoundEl = $('#course-not-found');
    const contentEl = $('#course-content');
    const courseId = new URLSearchParams(location.search).get('id') || '';

    const data = await loadCourseOverviewData(client, siteBrand, courseId);
    if (!data) {
      if (contentEl) contentEl.hidden = true;
      if (notFoundEl) notFoundEl.hidden = false;
      setState('app');
      return;
    }

    const { course, modules, firstLessonId, nextLessonId } = data;
    document.title = `${course.title} — ${root.dataset.platformName || brandName}`;

    const titleEl = $('#course-title');
    const descEl = $('#course-description');
    const metaEl = $('#course-meta');
    const progressTextEl = $('#course-progress-text');
    const progressPctEl = $('#course-progress-pct');
    const progressBarEl = $('#course-progress-bar');
    const progressFillEl = $('#course-progress-fill');
    const heroActionsEl = $('#course-hero-actions');
    const modulesEl = $('#course-modules');

    if (titleEl) titleEl.textContent = course.title;
    if (descEl) {
      descEl.textContent = course.description;
      descEl.hidden = !course.description;
    }

    if (metaEl) {
      const chips = [];
      const totalDuration = formatDuration(course.totalMinutes);
      if (totalDuration) chips.push(h('span', { class: 'learn-course-hero__stat' }, svg('clock'), `Estimated time: ${totalDuration}`));
      const lessonWord = course.totalLessons === 1 ? 'lesson' : 'lessons';
      chips.push(h('span', { class: 'learn-course-hero__stat' }, svg('cap'), `${course.totalLessons} ${lessonWord}`));
      if (course.complete) {
        chips.push(h('span', { class: 'learn-course-hero__stat learn-course-hero__stat--done' }, svg('check'), 'Completed'));
      }
      metaEl.replaceChildren(...chips);
    }

    if (progressTextEl) progressTextEl.textContent = `${course.progressText} complete`;
    if (progressPctEl) progressPctEl.textContent = `${course.progressPercent}%`;
    if (progressBarEl) {
      progressBarEl.setAttribute('aria-valuenow', String(course.progressPercent));
      progressBarEl.setAttribute('aria-valuetext', `${course.progressText} (${course.progressPercent}%)`);
    }
    if (progressFillEl) progressFillEl.style.width = `${course.progressPercent}%`;

    if (heroActionsEl) {
      const actions = [];
      const resumeLessonId = course.nextLessonId ?? nextLessonId;
      if (!course.complete && resumeLessonId) {
        actions.push(
          h('a', { class: 'btn btn--gold', href: lessonUrl(resumeLessonId) }, 'Resume', svg('arrow')),
        );
      } else if (course.complete) {
        actions.push(
          h(
            'button',
            {
              type: 'button',
              class: 'btn btn--gold',
              'data-cert-course': course.courseId,
              onclick: (event) => handleCertificateDownload(course.courseId, event.currentTarget, statusEl),
            },
            svg('download'),
            'Download certificate',
          ),
        );
        if (firstLessonId) {
          actions.push(
            h('a', { class: 'btn btn--outline-light', href: lessonUrl(firstLessonId) }, 'Review first lesson'),
          );
        }
      }
      heroActionsEl.replaceChildren(...actions);
      heroActionsEl.hidden = actions.length === 0;
    }

    if (modulesEl) {
      if (modules.length === 0) {
        modulesEl.replaceChildren(
          h(
            'div',
            { class: 'editorial-card learn-empty-modules' },
            h('p', { text: 'Lessons for this course are being prepared. Please check back soon.' }),
          ),
        );
      } else {
        const resumeLessonId = course.nextLessonId ?? nextLessonId;
        modulesEl.replaceChildren(
          ...modules.map((mod, idx) => buildModuleCard(mod, idx + 1, resumeLessonId)),
        );
      }
    }

    if (notFoundEl) notFoundEl.hidden = true;
    if (contentEl) contentEl.hidden = false;
    setState('app');
  }

  // Read aloud with the device's own voice (free, no setup), plus medical-term cards.
  // ponytail: browser voices vary by device; swap `say` for pre-made audio files if the client wants one natural voice everywhere.
  let lessonAudio = null;

  // The device's own voice. Free and offline; sound varies by device.
  function deviceVoice() {
    const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
    if (!synth) return null;
    let voice = null;
    const loadVoice = () => { voice = pickVoice(synth.getVoices()); };
    loadVoice();
    synth.addEventListener?.('voiceschanged', loadVoice);
    synth.cancel();
    return {
      speak(text, speed, onstart, onend) {
        const utterance = new SpeechSynthesisUtterance(spokenText(text));
        if (voice) { utterance.voice = voice; utterance.lang = voice.lang; } else utterance.lang = 'en-CA';
        utterance.rate = speed;
        utterance.onstart = onstart ?? null;
        utterance.onend = onend ?? null;
        utterance.onerror = onend ?? null;
        synth.speak(utterance);
      },
      cancel: () => synth.cancel(),
    };
  }

  // Kokoro voice from our TTS service (PUBLIC_TTS_URL; local testing for now). Falls back to the device voice if it fails.
  function kokoroVoice(baseUrl, fallback) {
    const clips = new Map(); // text -> Promise<object URL>
    let current = null;
    const clip = (text) => {
      if (!clips.has(text)) {
        clips.set(text, fetch(`${baseUrl}/speak`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: spokenText(text) }) })
          .then((res) => { if (!res.ok) throw new Error('TTS failed'); return res.blob(); })
          .then((blob) => URL.createObjectURL(blob))
          .catch((error) => { clips.delete(text); throw error; }));
      }
      return clips.get(text);
    };
    return {
      prefetch: (text) => { clip(text).catch(() => {}); },
      speak(text, speed, onstart, onend) {
        const mine = {};
        current = mine;
        clip(text).then((url) => {
          if (current !== mine) return;
          const audio = new Audio(url);
          audio.playbackRate = speed;
          mine.audio = audio;
          audio.onplaying = () => onstart?.();
          audio.onended = () => onend?.();
          audio.onerror = () => onend?.();
          audio.play().catch(() => onend?.());
        }, () => {
          if (current !== mine) return;
          if (fallback) fallback.speak(text, speed, onstart, onend); else onend?.();
        });
      },
      cancel() {
        current?.audio?.pause();
        current = null;
        fallback?.cancel();
      },
    };
  }

  // Pre-recorded Kokoro clips (the normal case once a course's audio is made). Text without a clip uses `fallback`.
  function recordedVoice(recorded, fallback) {
    let current = null;
    const play = (url, speed, onstart, onend, retry) => {
      const audio = new Audio(url);
      current = audio;
      audio.playbackRate = speed;
      audio.onplaying = () => onstart?.();
      audio.onended = () => onend?.();
      audio.onerror = () => { if (current === audio) retry(); };
      audio.play().catch(() => { if (current === audio) retry(); });
    };
    const viaFallback = (text, speed, onstart, onend) => (fallback ? fallback.speak(text, speed, onstart, onend) : onend?.());
    return {
      has: (text) => recorded.text.has(normalizeSpeech(text)),
      prefetch(text) {
        const url = recorded.text.get(normalizeSpeech(text));
        if (url) Object.assign(new Audio(), { preload: 'auto', src: url });
        else fallback?.prefetch?.(text);
      },
      speak(text, speed, onstart, onend) {
        const url = recorded.text.get(normalizeSpeech(text));
        if (!url) return viaFallback(text, speed, onstart, onend);
        play(url, speed, onstart, onend, () => viaFallback(text, speed, onstart, onend));
      },
      sayTerm(term) {
        const url = recorded.terms.get(term.toLowerCase());
        if (!url) return viaFallback(term, 0.8);
        play(url, 1, null, null, () => viaFallback(term, 0.8));
      },
      cancel() {
        current?.pause();
        current = null;
        fallback?.cancel();
      },
    };
  }

  function setupLessonAudio(terms, elements, recorded) {
    const device = deviceVoice();
    const ttsUrl = root.dataset.ttsUrl;
    const live = ttsUrl ? kokoroVoice(ttsUrl.replace(/\/$/, ''), device) : device;
    const speech = recorded.text.size || recorded.terms.size ? recordedVoice(recorded, live) : live;
    if (speech) addEventListener('pagehide', () => speech.cancel());
    const say = (text, speed, onstart, onend) => speech.speak(text, speed, onstart, onend);

    const play = $('#listen-play');
    const stop = $('#listen-stop');
    const rate = $('#listen-rate');
    $('#lesson-listen').hidden = !speech;
    // A recorded block plays as one clip; anything else is spoken sentence by sentence.
    // A question marker has no text: reaching it pops the question up.
    const items = elements.flatMap((el) => (el.tagName === 'FIGURE' ? [] // images are shown, not read
      : el.question ? [{ el, text: '' }]
      : speech?.has?.(el.textContent) ? [{ el, text: el.textContent }] : speechChunks(el.textContent).map((text) => ({ el, text }))));
    let index = 0;
    let state = 'idle'; // idle | playing | paused
    let token = 0; // ignores end events from speech we cancelled
    const mark = (el) => {
      for (const old of root.querySelectorAll('.is-reading')) old.classList.remove('is-reading');
      if (!el) return;
      el.classList.add('is-reading');
      if ($('#listen-autoscroll')?.checked) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
    const autoScroll = $('#listen-autoscroll');
    if (autoScroll) {
      try { autoScroll.checked = localStorage.getItem('learn-autoscroll') !== 'off'; } catch { /* storage blocked */ }
      autoScroll.onchange = () => { try { localStorage.setItem('learn-autoscroll', autoScroll.checked ? 'on' : 'off'); } catch { /* storage blocked */ } };
    }
    const paint = () => {
      play.replaceChildren(svg(state === 'playing' ? 'pause' : 'volume'), state === 'playing' ? 'Pause' : state === 'paused' ? 'Resume' : 'Listen to this lesson');
      play.setAttribute('aria-pressed', String(state === 'playing'));
      stop.hidden = state === 'idle';
    };
    const step = () => {
      if (state !== 'playing') return;
      if (index >= items.length) { state = 'idle'; index = 0; mark(null); paint(); return; }
      const mine = ++token;
      const item = items[index];
      const next = () => {
        if (mine !== token || state !== 'playing') return;
        index += 1;
        step();
      };
      if (item.el.question) {
        // The paragraph before it has just been read: ask now (once), then carry on reading.
        if (item.el.question.asked) return next();
        item.el.question.asked = true;
        askQuestion(item.el.question.recall, (text) => { speech.cancel(); say(text, Number(rate.value)); }).then(next);
        return;
      }
      say(item.text, Number(rate.value), () => mark(item.el), next);
      // Kokoro takes a moment per sentence on a small server, so ask for the next one while this one plays.
      if (items[index + 1]) speech.prefetch?.(items[index + 1].text);
    };
    // Pausing cancels and keeps the place: speechSynthesis.pause() is unreliable on phones.
    const halt = (next) => {
      state = next;
      token += 1;
      speech?.cancel();
      if (next === 'idle') { index = 0; mark(null); }
      paint();
    };
    if (speech) {
      play.onclick = () => {
        if (state === 'playing') return halt('paused');
        state = 'playing';
        paint();
        step();
      };
      stop.onclick = () => halt('idle');
      rate.onchange = () => { if (state === 'playing') { token += 1; speech.cancel(); step(); } };
      paint();
    }
    lessonAudio = speech && {
      isPlaying: () => state === 'playing',
      pause: () => { if (state === 'playing') halt('paused'); },
      speak(text, onend) {
        if (state === 'playing') halt('paused');
        speech.cancel();
        say(text, Number(rate.value), null, onend);
      },
      sayWord(word) {
        if (state === 'playing') halt('paused');
        speech.cancel();
        if (speech.sayTerm) speech.sayTerm(word); else say(word, 0.8);
      },
    };

    const speakButton = (word) => (lessonAudio
      ? h('button', { type: 'button', class: 'lp-speak', 'aria-label': `Say ${word}`, title: `Say ${word}`, onclick: () => lessonAudio.sayWord(word) }, svg('volume'))
      : null);
    $('#lesson-terms').hidden = !terms.length;
    $('#lesson-terms-list').replaceChildren(...terms.flatMap((t) => [
      h('dt', {}, h('span', { text: t.term }), speakButton(t.term)),
      h('dd', {}, t.pronunciation ? h('span', { class: 'lp-say', text: t.pronunciation }) : null, h('span', { text: t.definition })),
    ]));
  }

  function showTerm(term) {
    const card = $('#lp-term-card');
    $('#lp-term-name').textContent = term.term;
    $('#lp-term-say').textContent = term.pronunciation || '';
    $('#lp-term-say').hidden = !term.pronunciation;
    $('#lp-term-def').textContent = term.definition;
    const speak = $('#lp-term-speak');
    speak.hidden = !lessonAudio;
    speak.replaceChildren(svg('volume'), 'Say it');
    speak.onclick = () => lessonAudio?.sayWord(term.term);
    if (card.showPopover) {
      if (card.matches(':popover-open')) card.hidePopover();
      card.showPopover();
    } else {
      card.hidden = false;
    }
    (lessonAudio ? speak : card.querySelector('[data-close]'))?.focus();
  }

  // A practice question with a 15-30 second timer. Ungraded and not saved: when the timer ends it just shows the answer.
  function recallCard(recall) {
    const seconds = recallSeconds(recall);
    let timer = null;
    let settled = false;
    const waiting = [];
    const bar = h('span', { class: 'lp-recall__bar' });
    const left = h('span', { class: 'lp-recall__left' });
    const clock = h('div', { class: 'lp-recall__timer', 'aria-hidden': 'true' }, h('span', { class: 'lp-recall__track' }, bar), left);
    const reveal = h('p', { class: 'lp-recall__why', role: 'status' });
    const choices = recall.options.map((option, i) => h('button', { type: 'button', class: 'lp-recall__choice', onclick: () => settle(i) }, option));
    const card = h('div', { class: 'lp-recall', role: 'group', 'aria-label': recall.wrapUp ? 'Wrap-up question' : 'Quick question' },
      h('p', { class: 'lp-recall__kicker', text: recall.wrapUp ? 'Wrap-up question' : 'Quick question' }),
      h('p', { class: 'lp-recall__q', text: recall.question }),
      h('div', { class: 'lp-recall__choices' }, choices),
      clock, reveal);
    const start = () => {
      if (timer || settled) return;
      const end = Date.now() + seconds * 1000;
      const tick = () => {
        const ms = Math.max(0, end - Date.now());
        left.textContent = `${Math.ceil(ms / 1000)}s`;
        bar.style.width = `${(ms / (seconds * 1000)) * 100}%`;
        if (!ms) settle(null);
      };
      tick();
      timer = setInterval(tick, 200);
    };
    function settle(choice) {
      if (settled) return;
      settled = true;
      clearInterval(timer);
      clock.hidden = true;
      choices.forEach((button, i) => {
        button.disabled = true;
        button.classList.toggle('is-right', i === recall.correct);
        button.classList.toggle('is-wrong', i === choice && i !== recall.correct);
      });
      const lead = choice === null ? 'Time is up.' : choice === recall.correct ? 'Correct.' : 'Not quite.';
      reveal.textContent = `${lead} The answer is: ${recall.options[recall.correct]}.${recall.why ? ` ${recall.why}` : ''}`;
      waiting.splice(0).forEach((fn) => fn());
    }
    // The clock starts when the student reaches the question.
    new IntersectionObserver((entries, observer) => {
      if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); start(); }
    }, { threshold: 0.6 }).observe(card);
    card.recall = { prompt: recallPrompt(recall), why: recall.why, wait: (fn) => { if (settled) fn(); else { waiting.push(fn); start(); } } };
    return card;
  }

  // A question pops up, is read aloud, and waits for an answer or the timer; Continue closes it.
  function askQuestion(recall, speak) {
    const dialog = $('#lp-wrapup');
    return new Promise((resolve) => {
      const card = recallCard(recall);
      const next = h('button', { type: 'button', class: 'btn btn--gold', hidden: true, onclick: () => { dialog.close(); resolve(); } }, 'Continue');
      dialog.replaceChildren(card, next);
      dialog.oncancel = (event) => event.preventDefault(); // answer or wait for the timer; at most 30 seconds
      dialog.showModal();
      card.querySelector('button')?.focus();
      speak?.(card.recall.prompt);
      card.recall.wait(() => {
        next.hidden = false;
        next.focus();
        if (recall.why) speak?.(recall.why);
      });
    });
  }

  // Wrap-up questions pop up one after another before the lesson is marked done.
  function runWrapUps(list) {
    return list.reduce((previous, recall) => previous.then(() => askQuestion(recall, lessonAudio?.speak)), Promise.resolve());
  }

  // Where a "Recall:" question sits in the text. It pops up once the paragraph before it has been read:
  // by the Listen voice, or by scrolling past the end of that paragraph.
  function questionMarker(recall) {
    const marker = h('div', { class: 'lp-question-mark', 'aria-hidden': 'true' });
    marker.question = { recall, asked: false };
    let pending = null;
    new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) {
        // Scrolled away before finishing the paragraph: not read yet.
        clearTimeout(pending);
        pending = null;
        return;
      }
      if (pending || marker.question.asked) return;
      // Give the reader time to read the paragraph above (about 3.5 words a second, 3 to 20 seconds).
      const words = (marker.previousElementSibling?.textContent ?? '').split(/\s+/).length;
      pending = setTimeout(() => {
        pending = null;
        if (marker.question.asked || lessonAudio?.isPlaying?.() || $('#lp-wrapup').open) return;
        marker.question.asked = true;
        askQuestion(recall, lessonAudio?.speak);
      }, Math.min(20, Math.max(3, words / 3.5)) * 1000);
    }, { rootMargin: '0px 0px -10% 0px' }).observe(marker); // the end of that paragraph is on screen
    return marker;
  }

  // Select text to highlight or underline it. Selecting pauses the voice; marks are kept per lesson on this device.
  // shortcut: saved in this browser only, sync to the student's account if they need marks on other devices.
  function setupHighlights(lessonId) {
    const reading = $('#lesson-reading');
    const bar = $('#lp-hl-bar');
    const removeButton = bar.querySelector('[data-hl="remove"]');
    const KEY = `learn-highlights:${lessonId}`;
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { saved = []; }
    const blocks = [...reading.children].filter((el) => el.matches('p, h2'));
    const store = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } };
    // Character offset of a point inside a block's text.
    const offsetIn = (block, node, offset) => {
      const range = document.createRange();
      range.setStart(block, 0);
      range.setEnd(node, offset);
      return range.toString().length;
    };
    const wrap = (block, { s, e, k }) => {
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      let pos = 0;
      for (const node of nodes) {
        const length = node.length;
        const from = Math.max(s, pos);
        const to = Math.min(e, pos + length);
        if (from < to) {
          let target = node;
          if (to - pos < length) target.splitText(to - pos);
          if (from > pos) target = target.splitText(from - pos);
          const mark = document.createElement('mark');
          mark.className = `lp-hl lp-hl--${k}`;
          target.replaceWith(mark);
          mark.append(target);
        }
        pos += length;
      }
    };
    const paint = (block) => {
      for (const mark of block.querySelectorAll('mark.lp-hl')) mark.replaceWith(...mark.childNodes);
      block.normalize();
      const index = blocks.indexOf(block);
      for (const item of saved.filter((h) => h.b === index)) wrap(block, item);
    };
    blocks.forEach(paint);

    let range = null;
    const hide = () => { bar.hidden = true; range = null; };
    let wait = null;
    document.addEventListener('selectionchange', () => {
      clearTimeout(wait);
      wait = setTimeout(() => {
        const selection = getSelection();
        if (!selection.rangeCount || selection.isCollapsed) return;
        const picked = selection.getRangeAt(0);
        if (!reading.contains(picked.commonAncestorContainer) && picked.commonAncestorContainer !== reading) return hide();
        if (!blocks.some((block) => picked.intersectsNode(block))) return hide();
        range = picked.cloneRange();
        lessonAudio?.pause?.();
        removeButton.hidden = !blocks.some((block) => picked.intersectsNode(block) && [...block.querySelectorAll('mark.lp-hl')].some((mark) => picked.intersectsNode(mark)));
        bar.hidden = false;
        const box = picked.getBoundingClientRect();
        const left = Math.min(Math.max(8, box.left + box.width / 2 - bar.offsetWidth / 2), document.documentElement.clientWidth - bar.offsetWidth - 8);
        const above = box.top - bar.offsetHeight - 10;
        bar.style.left = `${left + scrollX}px`;
        bar.style.top = `${(above > 8 ? above : box.bottom + 10) + scrollY}px`;
      }, 250);
    });
    bar.addEventListener('mousedown', (event) => event.preventDefault()); // keep the selection when clicking the bar
    bar.addEventListener('click', (event) => {
      const kind = event.target.closest('button')?.dataset.hl;
      if (!kind || !range) return;
      for (const block of blocks.filter((b) => range.intersectsNode(b))) {
        const index = blocks.indexOf(block);
        const s = block.contains(range.startContainer) ? offsetIn(block, range.startContainer, range.startOffset) : 0;
        const e = block.contains(range.endContainer) ? offsetIn(block, range.endContainer, range.endOffset) : block.textContent.length;
        if (kind === 'remove') saved = saved.filter((h) => h.b !== index || h.e <= s || h.s >= e);
        else if (e > s) saved.push({ b: index, s, e, k: kind });
        paint(block);
      }
      store();
      getSelection().removeAllRanges();
      hide();
    });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') hide(); });
  }

  async function renderLesson() {
    const lessonId = new URLSearchParams(location.search).get('id') || '';
    const data = await loadLessonData(client, siteBrand, lessonId);
    $('#lesson-missing').hidden = data.state !== 'missing';
    $('#lesson-locked').hidden = data.state !== 'locked';
    $('#lesson-content').hidden = data.state !== 'open';
    if (data.state !== 'open') {
      setState('app');
      return;
    }

    const { lesson, questions, course, number, total, previous, next } = data;
    const statusEl = $('#lesson-status');
    document.title = `${lesson.title} — ${root.dataset.platformName || brandName}`;
    $('#lesson-title').textContent = lesson.title;
    $('#lesson-kicker').textContent = `${course.title} · Lesson ${number} of ${total}`;
    $('#lesson-course-link').href = courseOverviewUrl(course.courseId);

    // Reading, with each medical term underlined the first time it appears.
    const seenTerms = new Set();
    const parsed = readingBlocks(lesson.reading);
    let wrapUps = parsed.filter((block) => block.recall?.wrapUp).map((block) => block.recall);
    const blocks = parsed.filter((block) => !block.recall?.wrapUp).map((block) => (block.heading
      ? h('h2', { class: 'lp-h', text: block.text })
      : block.recall ? questionMarker(block.recall)
      : block.image ? h('figure', { class: 'lp-figure' },
        h('img', { src: block.image.src, alt: block.image.alt, loading: 'lazy', decoding: 'async' }),
        block.image.alt ? h('figcaption', { text: block.image.alt }) : null)
      : h('p', {}, markTerms(block.text, data.glossary, seenTerms).map((part) => (typeof part === 'string'
        ? part
        : h('button', { type: 'button', class: 'lp-term', 'aria-haspopup': 'dialog', onclick: () => showTerm(part.term) }, part.text))))));
    $('#lesson-reading').replaceChildren(...blocks);
    setupLessonAudio(data.glossary.filter((t) => seenTerms.has(t.term.toLowerCase())), [$('#lesson-title'), ...blocks], data.recorded);
    setupHighlights(lesson.lesson_id);
    // ponytail: video player and file downloads wait for the video host and private file bucket (L05).
    $('#lesson-video-note').hidden = !lesson.video_id;

    let done = lesson.done;
    const footer = $('#lesson-footer');
    const paintFooter = () => {
      const items = [];
      // Earlier lessons are always open, so going back never hits a lock.
      if (previous) items.push(h('a', { class: 'btn btn--outline-navy', href: lessonUrl(previous.lessonId) }, svg('arrowLeft'), 'Previous lesson'));
      if (done) items.push(h('span', { class: 'learn-pill learn-pill--done' }, svg('check'), 'Done'));
      if (!done && !lesson.has_check) {
        items.push(h('button', {
          type: 'button',
          class: 'btn btn--gold',
          onclick: async (event) => {
            const button = event.currentTarget;
            button.disabled = true;
            showMessage(statusEl, '');
            if (wrapUps.length) {
              await runWrapUps(wrapUps);
              wrapUps = []; // asked once per visit
            }
            try {
              await markLessonDone(client, lesson.lesson_id);
              done = true;
              paintFooter();
              footer.querySelector('a')?.focus();
            } catch (error) {
              button.disabled = false;
              showMessage(statusEl, error.message);
            }
          },
        }, 'Mark as done'));
      }
      // A later lesson is open when this one is done, or when the course does not lock lessons in order.
      if (next && (done || next.unlocked)) {
        items.push(h('a', { class: `btn ${done ? 'btn--gold' : 'btn--outline-navy'}`, href: lessonUrl(next.lessonId) }, 'Next lesson', svg('arrow')));
      }
      items.push(h('a', { class: 'btn btn--outline-navy', href: courseOverviewUrl(course.courseId) }, 'Course overview'));
      footer.replaceChildren(...items);
    };
    paintFooter();

    // Mock and final exams: timed, one question per screen, no going back.
    // shortcut: an attempt counts when submitted, so leaving mid-exam does not use one; record a start if that is abused.
    if (data.exam) {
      const status = data.exam;
      const isFinal = status.exam === 'final';
      const label = isFinal ? 'Final exam' : 'Mock exam';
      const box = $('#lesson-exam');
      $('#lesson-listen').hidden = true;
      $('#lesson-terms').hidden = true;
      $('#lesson-check').hidden = true;
      box.hidden = false;
      const show = (...kids) => {
        box.replaceChildren(h('h2', { class: 'lp-subtitle', text: label }), ...kids.filter(Boolean));
        box.querySelector('[data-focus]')?.focus();
      };
      const locked = () => show(h('p', { class: 'lp-result', 'data-focus': '', tabindex: '-1', text: "You've used all 3 attempts. Our team will contact you about the parts to review." }));
      let timer = null;

      const intro = () => {
        if (isFinal && status.passed) {
          return show(h('p', { class: 'lp-result', text: 'You passed the final exam.' }));
        }
        if (isFinal && status.attempts_left === 0) return locked();
        const meta = [
          `${questions.length} ${questions.length === 1 ? 'question' : 'questions'}`,
          status.exam_minutes ? `${status.exam_minutes} ${status.exam_minutes === 1 ? 'minute' : 'minutes'}` : null,
          isFinal ? `Attempt ${status.attempts_used + 1} of 3` : 'Unlimited attempts',
        ].filter(Boolean).join(' · ');
        show(
          h('p', { class: 'lp-exam__meta', text: meta }),
          h('p', { text: `One question at a time. Once you move on, you can't go back.${status.exam_minutes ? ' When time runs out, your answers are submitted.' : ''}` }),
          h('button', { type: 'button', class: 'btn btn--gold', 'data-focus': '', onclick: start }, 'Start'),
        );
      };

      function start() {
        const picks = {};
        let index = 0;
        let finished = false;
        const deadline = status.exam_minutes ? Date.now() + status.exam_minutes * 60000 : null;
        const clock = h('span', { class: 'lp-exam__clock', role: 'timer', 'aria-label': 'Time left' });
        const tick = () => {
          const left = Math.round((deadline - Date.now()) / 1000);
          clock.textContent = formatClock(left);
          if (left <= 0) finish();
        };
        const ask = () => {
          const question = questions[index];
          const many = question.type === 'multiple';
          const last = index === questions.length - 1;
          const next = h('button', { type: 'button', class: 'btn btn--gold', disabled: true, onclick: () => {
            picks[question.question_id] = [...fieldset.querySelectorAll('input:checked')].map((input) => Number(input.value));
            index += 1;
            if (last) finish(); else ask();
          } }, last ? 'Submit exam' : 'Next');
          const fieldset = h('fieldset', { class: 'lp-question', onchange: () => { next.disabled = !fieldset.querySelector('input:checked'); } },
            h('legend', { 'data-focus': '', tabindex: '-1', text: question.text }),
            many ? h('p', { class: 'lp-hint', text: 'Select all that apply.' }) : null,
            question.options.map((option, i) => h('label', { class: 'lp-option' },
              h('input', { type: many ? 'checkbox' : 'radio', name: 'exam-answer', value: String(i) }),
              h('span', { text: String(option) }))));
          show(h('div', { class: 'lp-exam__bar' }, h('span', { text: `Question ${index + 1} of ${questions.length}` }), deadline ? clock : null), fieldset, next);
        };
        async function finish() {
          if (finished) return;
          finished = true;
          clearInterval(timer);
          show(h('p', { role: 'status', text: 'Submitting your answers…' }));
          let outcome;
          try {
            outcome = await submitQuickCheck(client, lesson.lesson_id, Object.fromEntries(questions.map((q) => [q.question_id, picks[q.question_id] ?? []])));
          } catch (error) {
            if (error.locked) return locked();
            return show(h('p', { class: 'learn-alert', 'data-focus': '', tabindex: '-1', text: error.message }),
              h('button', { type: 'button', class: 'btn btn--gold', onclick: intro }, 'Back'));
          }
          if (isFinal) {
            status.attempts_used += outcome.passed ? 0 : 1;
            status.attempts_left = outcome.attempts_left;
            status.passed = outcome.passed;
          }
          if (outcome.passed && !done) { done = true; paintFooter(); }
          const verdict = h('p', { class: 'lp-result', 'data-focus': '', tabindex: '-1',
            text: `You scored ${outcome.score}%. ${outcome.passed ? 'You passed.' : 'Not passed yet.'}` });
          if (isFinal) {
            const review = outcome.review ?? [];
            show(verdict,
              !outcome.passed && review.length ? h('div', {}, h('p', { text: 'Review these areas:' }), h('ul', {}, review.map((area) => h('li', { text: area })))) : null,
              outcome.passed ? null : outcome.attempts_left
                ? h('p', { text: `${outcome.attempts_left} ${outcome.attempts_left === 1 ? 'attempt' : 'attempts'} left.` })
                : h('p', { text: "You've used all 3 attempts. Our team will contact you about the parts to review." }),
              !outcome.passed && outcome.attempts_left ? h('button', { type: 'button', class: 'btn btn--gold', onclick: intro }, 'Try again') : null);
          } else {
            show(verdict,
              h('ol', { class: 'lp-exam__review' }, outcome.results.map((result) => {
                const question = questions.find((q) => q.question_id === result.question_id);
                return h('li', {},
                  h('p', { class: 'lp-exam__q', text: question?.text ?? '' }),
                  h('div', { class: `lp-feedback ${result.correct ? 'is-right' : 'is-wrong'}` },
                    h('strong', { text: result.correct ? 'Correct' : 'Not quite' }),
                    result.explanation ? h('p', { text: result.explanation }) : null,
                    result.review_at ? h('p', { text: `Review: ${result.review_at}` }) : null));
              })),
              h('button', { type: 'button', class: 'btn btn--gold', onclick: intro }, 'Take the mock again'));
          }
        }
        if (deadline) { tick(); timer = setInterval(tick, 1000); }
        ask();
      }

      intro();
      setState('app');
      return;
    }

    const form = $('#lesson-check-form');
    const resultEl = $('#lesson-check-result');
    $('#lesson-check').hidden = questions.length === 0;

    const paintCheck = () => {
      resultEl.textContent = '';
      const fields = questions.map((question, position) => {
        const many = question.type === 'multiple';
        return h('fieldset', { class: 'lp-question', 'data-question': question.question_id },
          h('legend', { text: `${position + 1}. ${question.text}` }),
          many ? h('p', { class: 'lp-hint', text: 'Select all that apply.' }) : null,
          question.options.map((option, index) => h('label', { class: 'lp-option' },
            h('input', { type: many ? 'checkbox' : 'radio', name: question.question_id, value: String(index) }),
            h('span', { text: String(option) }))),
        );
      });
      form.replaceChildren(...fields, h('button', { type: 'submit', class: 'btn btn--gold' }, 'Check my answers'));
    };

    form.onsubmit = async (event) => {
      event.preventDefault();
      showMessage(statusEl, '');
      const answers = collectAnswers(questions, new FormData(form).entries());
      if (!answers) {
        resultEl.textContent = 'Please answer every question.';
        return;
      }
      const button = form.querySelector('button[type="submit"]');
      if (!button) return;
      button.disabled = true;
      let outcome;
      try {
        outcome = await submitQuickCheck(client, lesson.lesson_id, answers);
      } catch (error) {
        button.disabled = false;
        showMessage(statusEl, error.message);
        return;
      }
      for (const result of outcome.results) {
        const fieldset = form.querySelector(`[data-question="${result.question_id}"]`);
        if (!fieldset) continue;
        fieldset.disabled = true;
        fieldset.append(h('div', { class: `lp-feedback ${result.correct ? 'is-right' : 'is-wrong'}` },
          h('strong', { text: result.correct ? 'Correct' : 'Not quite' }),
          result.explanation ? h('p', { text: result.explanation }) : null,
          result.review_at ? h('p', { text: `Review: ${result.review_at}` }) : null));
      }
      resultEl.textContent = outcome.passed
        ? `You passed with ${outcome.score}%.${next ? '' : ' That was the last lesson.'}`
        : `You scored ${outcome.score}%. Review the lesson and try again.`;
      if (outcome.passed) {
        done = true;
        paintFooter();
        button.remove();
      } else {
        button.replaceWith(h('button', {
          type: 'button',
          class: 'btn btn--gold',
          onclick: () => { paintCheck(); form.querySelector('input')?.focus(); },
        }, 'Try again'));
      }
      resultEl.focus();
    };
    if (questions.length) paintCheck();
    setState('app');
  }

  // Public page: no sign-in.
  async function renderVerify() {
    const number = (new URLSearchParams(location.search).get('n') || '').trim();
    const out = $('#verify-result');
    $('#verify-number').value = number;
    setState('app');
    if (!number) return;
    out.replaceChildren(h('p', { text: 'Checking…' }));
    try {
      const found = await verifyCertificate(client, number);
      out.replaceChildren(found
        ? h('div', { class: 'lp-feedback is-right' },
            h('strong', { text: 'This certificate is genuine.' }),
            h('p', { text: `Course: ${found.course_title}` }),
            h('p', { text: `Issued by: ${found.brand.toUpperCase()}` }),
            h('p', { text: `Date: ${new Date(found.issued_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}` }))
        : h('div', { class: 'lp-feedback is-wrong' },
            h('strong', { text: 'No certificate has that number.' }),
            h('p', { text: 'Check the number and try again.' })));
    } catch (error) {
      out.replaceChildren(h('p', { class: 'learn-alert', text: error.message }));
    }
  }

  // Public test checkout: details form, email link, then enrollment on return.
  async function renderCheckout() {
    const params = new URLSearchParams(location.search);
    const courseId = params.get('course') || '';
    const course = await loadCheckoutCourse(client, siteBrand, courseId);
    $('#co-missing').hidden = Boolean(course);
    $('#co-main').hidden = !course;
    if (!course) {
      setState('app');
      return;
    }
    document.title = `Checkout: ${course.title} — ${root.dataset.platformName || brandName}`;
    $('#co-title').textContent = course.title;
    const lessons = Number(course.total_lessons);
    $('#co-meta').textContent = `${lessons} ${lessons === 1 ? 'lesson' : 'lessons'} · ${formatDuration(course.total_minutes)}`;

    const errorEl = $('#co-error');
    const form = $('#co-form');
    // Details typed before the email link are kept in this browser so the return trip can enroll without retyping.
    const DETAILS_KEY = 'learn-checkout-details';
    const FIELDS = ['name', 'phone', 'city', 'province', 'country'];
    const readForm = () => Object.fromEntries(FIELDS.map((key) => [key, $(`#co-${key}`).value]));
    const fillForm = (details) => FIELDS.forEach((key) => { if (details?.[key]) $(`#co-${key}`).value = details[key]; });
    const readStash = () => { try { return JSON.parse(localStorage.getItem(DETAILS_KEY) || 'null'); } catch { return null; } };
    const enroll = async (button) => {
      if (button) button.disabled = true;
      showMessage(errorEl, '');
      try {
        await selfEnroll(client, courseId, '');
        try { localStorage.removeItem(DETAILS_KEY); } catch { /* storage blocked */ }
        location.replace(courseOverviewUrl(courseId));
      } catch (error) {
        showMessage(errorEl, error.message);
        if (button) button.disabled = false;
      }
    };

    const user = await loadStudentUser(client);
    // Signed in with saved details: enroll as before.
    if (user && await loadStudentProfile(client)) {
      form.hidden = true;
      $('#co-signed').hidden = false;
      $('#co-user').textContent = user.email ?? '';
      $('#co-enroll').addEventListener('click', (event) => enroll(event.currentTarget));
      if (params.get('confirm')) {
        await enroll($('#co-enroll'));
        return;
      }
      setState('app');
      return;
    }

    // Signed in (e.g. Google) without details: nobody is enrolled until the details are saved.
    if (user) {
      const email = $('#co-email');
      email.value = user.email ?? '';
      email.readOnly = true;
      fillForm({ name: user.user_metadata?.full_name, ...readStash() });
      form.querySelector('button[type="submit"]').textContent = 'Complete enrollment';
      $('#co-form-note').hidden = true;
      const finish = async (button) => {
        const details = readForm();
        const problem = checkStudentDetails(details);
        if (problem) return showMessage(errorEl, problem);
        button.disabled = true;
        try { await saveStudentProfile(client, details); } catch (error) { showMessage(errorEl, error.message); button.disabled = false; return; }
        await enroll(button);
      };
      form.addEventListener('submit', (event) => { event.preventDefault(); finish(form.querySelector('button[type="submit"]')); });
      const stash = readStash();
      setState('app');
      if (params.get('confirm') && stash && !checkStudentDetails(stash)) await finish(form.querySelector('button[type="submit"]'));
      return;
    }

    await setupGoogle(`${location.origin}/learn/checkout/?course=${encodeURIComponent(courseId)}&confirm=1`, errorEl);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const details = readForm();
      const email = $('#co-email').value;
      const problem = checkStudentDetails(details) || checkCheckoutDetails(details.name, email);
      if (problem) {
        showMessage(errorEl, problem);
        return;
      }
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      showMessage(errorEl, '');
      try {
        try { localStorage.setItem(DETAILS_KEY, JSON.stringify(details)); } catch { /* storage blocked */ }
        const back = `${location.origin}/learn/checkout/?course=${encodeURIComponent(courseId)}&confirm=1`;
        await startCheckout(client, { name: details.name, email }, back);
        form.hidden = true;
        $('#co-sent-email').textContent = email.trim();
        $('#co-sent').hidden = false;
        $('#co-sent').focus();
      } catch (error) {
        showMessage(errorEl, error.message);
        button.disabled = false;
      }
    });
    setState('app');
  }

  // Signed in but not enrolled on this site.
  function renderWelcome(user) {
    $('#welcome-email').textContent = user.email ?? '';
    setState('app');
  }

  async function boot() {
    if (page === 'checkout') {
      await renderCheckout();
      return;
    }
    if (page === 'verify') {
      await renderVerify();
      return;
    }
    if (page === 'login') setupLoginView();
    const user = await loadStudentUser(client);
    if (!user) {
      if (page === 'login') return;
      const errMsg = authRedirectError(location.search, location.hash);
      const target = buildLoginUrl(`${location.pathname}${location.search}`, errMsg ? 'expired' : '');
      location.replace(target);
      return;
    }

    if (page === 'login') {
      const next = sanitizeLearnNext(new URLSearchParams(location.search).get('next'));
      location.replace(next);
      return;
    }

    if (page === 'dashboard') {
      const savedNext = readNextFromStorage();
      if (savedNext) {
        location.replace(savedNext);
        return;
      }
    }

    // ponytail: one extra learn_my_courses call per portal page; fold into the page loaders if it shows up in timings.
    const { active, completed } = await loadDashboardData(client, siteBrand);
    const enrolled = active.length + completed.length > 0;
    if (page === 'welcome' && enrolled) {
      location.replace('/learn/');
      return;
    }
    if (page !== 'welcome' && !enrolled) {
      location.replace('/learn/welcome/');
      return;
    }

    paintSignedInUser(user);
    if (page === 'welcome') {
      renderWelcome(user);
      return;
    }
    if (page === 'dashboard' || page === 'courses') await renderDashboard();
    else if (page === 'settings') await renderSettings(user);
    else if (page === 'course') await renderCourseOverview();
    else if (page === 'lesson') await renderLesson();
    else setState('app');
  }

  const retryBtn = $('#learn-retry');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      setState('loading');
      boot().catch(showBootError);
    });
  }

  function showBootError(error) {
    if (page === 'login') {
      setupLoginView();
      showMessage($('#learn-login-error'), error?.message || 'Unable to verify your session right now. You can still request a new sign-in link.');
      return;
    }
    const errorText = $('#learn-boot-error-text');
    if (errorText) errorText.textContent = error?.message || 'Unable to connect right now. Please try again.';
    setState('error');
  }

  boot().catch(showBootError);
}

if (typeof document !== 'undefined') {
  const root = document.querySelector('[data-learn-page]');
  if (root) {
    const { supabaseUrl, supabaseKey, learnPage } = root.dataset;
    if (supabaseUrl && supabaseKey) {
      setupLearnPortal(root, createClient(supabaseUrl, supabaseKey));
    } else if (learnPage === 'login') {
      const form = root.querySelector('#learn-login-form');
      const errorEl = root.querySelector('#learn-login-error');
      if (form) form.hidden = true;
      if (errorEl) {
        errorEl.textContent = 'Student sign-in is not configured yet. Please contact CCACT.';
        errorEl.hidden = false;
      }
      root.dataset.state = 'login';
    } else {
      const errorText = root.querySelector('#learn-boot-error-text');
      const retryBtn = root.querySelector('#learn-retry');
      if (retryBtn) retryBtn.hidden = true;
      if (errorText) errorText.textContent = 'The student learning portal is not configured yet. Please contact CCACT.';
      root.dataset.state = 'error';
    }
  }
}
