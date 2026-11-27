import { createClient } from '@supabase/supabase-js';
import { h, setupShell, showError, svg } from './console-shell.mjs';
import { AFFILIATE_FORMS } from '../content/affiliate-forms.mjs';
import {
  CONTENT_FIELDS,
  countByStatus,
  formatDate,
  initials,
  inviteLink,
  inviteMailto,
  inviteStatus,
  matchesQuery,
  SLUG_PATTERN,
  slugify,
  validateAvatar,
  validateGrant,
  validateInvite,
  validateManualPage,
  validateNewPassword,
} from '../lib/admin-helpers.mjs';

// Question text for each stored answer key; checkbox/radio sets use the short question shown above them.
const ANSWER_LABELS = { ageConfirm: 'Confirms 18 years of age or older' };
for (const sections of Object.values(AFFILIATE_FORMS)) {
  for (const { title, items } of sections) {
    let question = title;
    for (const item of items) {
      if (item.p) question = item.p.length < 160 ? item.p : title;
      if (item.field) ANSWER_LABELS[item.field] ??= item.label;
      if (item.group) ANSWER_LABELS[item.group] ??= question;
    }
  }
}

const BUCKET = 'admin-avatars';
const PARTNER_BUCKET = 'partner-photos';
// Which website a partner page is built on (partners.brand).
// Pages on this site link relative (the custom domains may not point at Netlify yet); the CCES build tags <html data-brand="cces">.
const BRAND_SITES = {
  // ponytail: Netlify addresses because theccact.com (old S3 site) and thecces.com (Wix) don't point at Netlify yet; swap to the domains once DNS moves.
  ccact: { label: 'theccact.com', name: 'CCACT', origin: 'https://theccact.netlify.app' },
  cces: { label: 'thecces.com', name: 'CCES', origin: 'https://thecces.netlify.app' },
};
const EMPTY_TEXT = {
  pending: 'No applications are waiting for review.',
  approved: 'No approved affiliates yet.',
  rejected: 'No rejected applications.',
  all: 'No applications yet.',
};
const STATUS = {
  pending: { icon: 'clock', label: 'Pending' },
  approved: { icon: 'check', label: 'Approved' },
  rejected: { icon: 'x', label: 'Rejected' },
};

export function setupAdmin(root, client) {
  const $ = (selector) => root.querySelector(selector);
  const state = { user: null, rows: [], invites: [], filter: 'pending', query: '', content: {}, avatarUrl: null };

  const setView = (view) => { root.dataset.state = view; };
  const say = (message) => { $('#admin-status').textContent = message; };
  const shell = setupShell(root, {
    onAction(action) {
      if (action === 'signout') signOut();
      if (action === 'password') openDialog('#dlg-password');
      if (action === 'photo') openDialog('#dlg-photo');
    },
  });
  const toast = (message, kind) => { shell.toast(message, kind); say(message); };
  const closeMenu = shell.closeMenu;

  /* ---------- Sign in ---------- */
  const loginForm = $('#admin-login');
  const loginError = $('#login-error');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showError(loginError, '');
    const email = loginForm.elements.email.value.trim();
    const password = loginForm.elements.password.value;
    if (!email || !password) return showError(loginError, 'Enter your email address and password.');
    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Signing in…';
    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      loginForm.elements.password.value = '';
      if (error) return showError(loginError, 'Those details did not work. Check your email and password.');
      await enter(data.user);
    } catch {
      showError(loginError, 'Could not connect. Check your connection and try again.');
    } finally {
      button.disabled = false;
      button.textContent = 'Sign in';
    }
  });

  async function boot() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return setView('login');
    await enter(user);
  }

  async function enter(user) {
    const { data, error } = await client.rpc('admin_applications');
    if (error) {
      await client.auth.signOut();
      setView('login');
      return showError(loginError, 'This account is not an owner account.');
    }
    state.user = user;
    state.rows = data;
    await Promise.all([loadAvatar(), loadContent(), loadInvites()]);
    paintProfile();
    renderApps();
    renderInvites();
    renderContent();
    await loadCourses();
    shell.route();
    setView('app');
    say('Signed in.');
  }

  async function signOut() {
    const { error } = await client.auth.signOut();
    if (error) return toast('Could not sign out. Please try again.', 'error');
    Object.assign(state, { user: null, rows: [], invites: [], content: {}, avatarUrl: null });
    closeMenu();
    setView('login');
    loginForm.elements.email.focus();
  }

  /* ---------- Applications ---------- */
  for (const button of root.querySelectorAll('[data-filter]')) {
    button.addEventListener('click', () => { state.filter = button.dataset.filter; renderApps(); });
  }

  let searchTimer;
  $('#app-search').addEventListener('input', (event) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.query = event.target.value; renderApps(); }, 150);
  });

  $('#apps-refresh').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    const { data, error } = await client.rpc('admin_applications');
    button.disabled = false;
    button.removeAttribute('aria-busy');
    if (error) return toast('Could not refresh. Please try again.', 'error');
    state.rows = data;
    renderApps();
    toast('Applications are up to date.');
  });

  function renderApps() {
    const counts = countByStatus(state.rows);
    for (const button of root.querySelectorAll('[data-filter]')) {
      const key = button.dataset.filter;
      button.querySelector('[data-count]').textContent = counts[key];
      button.setAttribute('aria-pressed', String(state.filter === key));
    }
    const badge = $('#tab-badge');
    badge.textContent = counts.pending;
    badge.hidden = counts.pending === 0;

    const list = $('#apps');
    list.replaceChildren();
    const rows = state.rows.filter((row) => (state.filter === 'all' || row.status === state.filter) && matchesQuery(row, state.query));
    const query = state.query.trim();
    $('#apps-summary').textContent = query
      ? `${rows.length} result${rows.length === 1 ? '' : 's'} for “${query}”`
      : `Showing ${rows.length} ${state.filter === 'all' ? 'applications' : state.filter}`;
    if (!rows.length) {
      const text = query ? `No applications match “${query}”.` : EMPTY_TEXT[state.filter];
      list.append(h('div', { class: 'empty' }, svg(query ? 'search' : 'file'), h('p', { text })));
      return;
    }
    for (const row of rows) list.append(appRow(row));
  }

  function appRow(row) {
    const status = STATUS[row.status] ?? STATUS.pending;
    const meta = [row.role, row.location, formatDate(row.created_at)].filter(Boolean).join(' · ');
    const isOrg = row.type === 'organisation';
    const extra = [
      row.contact_name && `Contact: ${row.contact_name}`,
      row.languages && `Languages: ${row.languages}`,
      !row.user_id && 'Added by you · no affiliate account',
    ].filter(Boolean).join(' · ');
    const main = h('div', {},
      h('h3', { class: 'app__name' }, row.name,
        row.type && h('span', { class: `type-tag type-tag--${isOrg ? 'org' : 'ind'}` }, svg(isOrg ? 'building' : 'user'), isOrg ? 'Organization' : 'Individual')),
      h('p', { class: 'app__line', text: row.email }),
      meta && h('p', { class: 'app__line', text: meta }),
      extra && h('p', { class: 'app__line', text: extra }),
      row.website && h('p', { class: 'app__line' },
        h('a', { href: row.website, target: '_blank', rel: 'noopener noreferrer nofollow', text: row.website })),
      row.introduction && h('details', { class: 'app__intro' },
        h('summary', { text: 'Read introduction' }),
        h('p', { text: row.introduction })),
      row.answers && h('details', { class: 'app__intro' },
        h('summary', { text: 'Read full application' }),
        h('dl', { class: 'app__answers' }, Object.entries(row.answers).filter(([key]) => key !== 'type')
          .map(([key, value]) => [h('dt', { text: ANSWER_LABELS[key] ?? key }), h('dd', { text: [value].flat().join('; ') })]))),
      partnerControls(row),
    );
    const side = h('div', { class: 'app__side' },
      h('span', { class: `chip chip--${row.status}` }, svg(status.icon), status.label),
      row.status === 'pending' && h('div', { class: 'app__actions' }, approveButton(row), rejectButton(row)),
    );
    const avatar = row.partner_image
      ? h('span', { class: 'avatar', 'aria-hidden': 'true' }, h('img', { src: row.partner_image, alt: '' }))
      : h('span', { class: 'avatar', 'aria-hidden': 'true', text: initials(row.name) });
    return h('article', { class: 'app-row' }, avatar, main, side);
  }

  async function decide(row, decision, buttons) {
    buttons.forEach((button) => { button.disabled = true; });
    const { error } = await client.rpc('admin_decide_application', { applicant_id: row.user_id, decision });
    if (error) {
      buttons.forEach((button) => { button.disabled = false; });
      return toast('Could not update this application. Refresh the page and try again.', 'error');
    }
    row.status = decision;
    renderApps();
    toast(`${row.name} ${decision === 'approved' ? 'approved' : 'rejected'}.`);
  }

  function approveButton(row) {
    const button = h('button', { type: 'button', class: 'btn btn--gold-compact', text: 'Approve' });
    button.addEventListener('click', () => decide(row, 'approved', [...button.parentElement.children]));
    return button;
  }

  // Asks twice before consequential actions (reject, publish, suspend).
  function twoStep(label, confirmLabel, className, action) {
    const button = h('button', { type: 'button', class: className, text: label });
    let timer;
    const reset = () => { clearTimeout(timer); delete button.dataset.confirm; button.textContent = label; };
    button.addEventListener('click', () => {
      if (button.dataset.confirm) { reset(); return action(button); }
      button.dataset.confirm = 'true';
      button.textContent = confirmLabel;
      timer = setTimeout(reset, 4000);
    });
    button.addEventListener('blur', reset);
    return button;
  }

  // Rejecting cannot be undone from this screen.
  function rejectButton(row) {
    return twoStep('Reject', 'Confirm reject', 'btn btn--danger', (button) => decide(row, 'rejected', [...button.parentElement.children]));
  }

  /* ---------- Partner pages (same template for every partner, content differs) ---------- */
  const PAGE_STATUS = { draft: 'Draft', review: 'In review', preview: 'Preview', live: 'Live', suspended: 'Suspended', retired: 'Retired' };
  const PAGE_NEXT = {
    preview: { to: 'live', label: 'Go live', confirm: 'Confirm go live', done: 'Page is going live. It appears on the site in about 2 minutes.' },
    live: { to: 'suspended', label: 'Suspend page', confirm: 'Confirm suspend', done: 'Page suspended. It is removed from the site in about 2 minutes.' },
    suspended: { to: 'live', label: 'Restore page', confirm: 'Confirm restore', done: 'Page restored. It returns to the site in about 2 minutes.' },
  };

  function partnerControls(row) {
    if (row.status !== 'approved') return null;
    if (!row.partner_slug) {
      return h('div', { class: 'app__page' },
        h('button', { type: 'button', class: 'btn btn--outline-navy', onclick: () => openGrant(row) }, svg('link'), 'Grant affiliate page'));
    }
    const url = `/partners/${row.partner_slug}/`;
    const next = PAGE_NEXT[row.partner_status];
    const brandSelect = h('select', { class: 'btn btn--outline-navy', 'aria-label': `Website for ${row.name}`, onchange: (event) => setPageBrand(row, event.currentTarget) },
      ...Object.entries(BRAND_SITES).map(([value, site]) => h('option', { value, text: site.label })));
    brandSelect.value = row.partner_brand ?? 'ccact';
    return h('div', { class: 'app__page' },
      row.partner_status === 'live'
        ? h('a', { class: 'page-url', href: brandSelect.value === (document.documentElement.dataset.brand ?? 'ccact') ? url : `${BRAND_SITES[brandSelect.value].origin}${url}`, target: '_blank', rel: 'noopener noreferrer' }, svg('globe'), url)
        : h('span', { class: 'page-url' }, svg('globe'), url),
      h('span', { class: `chip chip--page-${row.partner_status}`, text: PAGE_STATUS[row.partner_status] ?? row.partner_status }),
      brandSelect,
      next && twoStep(next.label, next.confirm, 'btn btn--outline-navy', (button) => setPageStatus(row, next, button)),
      h('button', { type: 'button', class: 'btn btn--outline-navy', onclick: (event) => pickPartnerPhoto(row, event.currentTarget) },
        svg('camera'), row.partner_image ? 'Change photo' : 'Add photo'),
    );
  }

  // Uploads the partner's photo to the public bucket and points the page at it.
  function pickPartnerPhoto(row, button) {
    const input = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp' });
    input.addEventListener('change', async () => {
      const file = input.files[0];
      const problem = validateAvatar(file);
      if (problem) return toast(problem, 'error');
      button.disabled = true;
      const path = row.partner_slug;
      const upload = await client.storage.from(PARTNER_BUCKET).upload(path, file, { upsert: true, contentType: file.type });
      // ponytail: same path per partner, so ?v= busts caches when the photo is replaced.
      const url = `${client.storage.from(PARTNER_BUCKET).getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
      const { error } = upload.error ? upload : await client.rpc('admin_set_partner_image', { page_slug: row.partner_slug, image_url: url });
      button.disabled = false;
      if (error) return toast('Could not save the photo. Please try again.', 'error');
      row.partner_image = url;
      renderApps();
      toast(row.partner_status === 'live' ? 'Photo saved. It appears on the page in about 2 minutes.' : 'Photo saved.');
    });
    input.click();
  }

  async function setPageBrand(row, select) {
    select.disabled = true;
    const { error } = await client.rpc('admin_set_partner_brand', { page_slug: row.partner_slug, new_brand: select.value });
    select.disabled = false;
    if (error) { select.value = row.partner_brand ?? 'ccact'; return toast('Could not move this page. Refresh and try again.', 'error'); }
    row.partner_brand = select.value;
    renderApps();
    toast(`Page moved to ${BRAND_SITES[select.value].label}.${row.partner_status === 'live' ? ' Both sites update in about 2 minutes.' : ''}`);
  }

  async function setPageStatus(row, next, button) {
    button.disabled = true;
    const { error } = await client.rpc('admin_set_partner_status', { page_slug: row.partner_slug, new_status: next.to });
    if (error) { button.disabled = false; return toast('Could not change this page. Refresh and try again.', 'error'); }
    row.partner_status = next.to;
    renderApps();
    toast(next.done);
  }

  const grantForm = $('#grant-form');
  let granting = null;

  function openGrant(row) {
    granting = row;
    grantForm.reset();
    showError($('#grant-error'), '');
    $('#dlg-grant-title').textContent = 'Grant affiliate page';
    $('#grant-manual').hidden = true;
    $('#grant-for').textContent = `For ${row.name} · ${row.email}`;
    grantForm.elements.slug.value = slugify(row.name);
    grantForm.elements.role.value = row.role ?? '';
    grantForm.elements.location.value = row.location ?? '';
    grantForm.elements.bio.value = row.introduction ?? '';
    for (const radio of grantForm.querySelectorAll('input[name="type"]')) radio.checked = radio.value === (row.type ?? 'individual');
    $('#dlg-grant').showModal();
    grantForm.elements.slug.focus();
  }

  // A page for an affiliate who has not signed up: the owner fills in everything.
  $('#apps-add').addEventListener('click', () => {
    granting = { manual: true };
    grantForm.reset();
    showError($('#grant-error'), '');
    $('#dlg-grant-title').textContent = 'Add affiliate page';
    $('#grant-for').textContent = 'No sign-up needed. The affiliate does not get a login.';
    $('#grant-manual').hidden = false;
    grantForm.elements.brand.value = document.documentElement.dataset.brand === 'cces' ? 'cces' : 'ccact';
    grantForm.querySelector('input[name="type"][value="individual"]').checked = true;
    $('#dlg-grant').showModal();
    grantForm.elements.name.focus();
  });
  grantForm.elements.name.addEventListener('blur', (event) => {
    if (granting?.manual && !grantForm.elements.slug.value) grantForm.elements.slug.value = slugify(event.target.value);
  });

  grantForm.elements.slug.addEventListener('blur', (event) => {
    if (!SLUG_PATTERN.test(event.target.value)) event.target.value = slugify(event.target.value);
  });

  grantForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!granting) return;
    const f = grantForm.elements;
    const values = {
      slug: f.slug.value.trim().toLowerCase(),
      type: grantForm.querySelector('input[name="type"]:checked')?.value ?? '',
      role: f.role.value.trim(),
      location: f.location.value.trim(),
      bio: f.bio.value.trim(),
      referralCode: f.referralCode.value.trim(),
    };
    if (granting.manual) Object.assign(values, { name: f.name.value.trim(), email: f.email.value.trim().toLowerCase(), brand: f.brand.value });
    const problem = granting.manual ? validateManualPage(values) : validateGrant(values);
    if (problem) return showError($('#grant-error'), problem);
    const submit = grantForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    const page = {
      page_slug: values.slug,
      page_type: values.type,
      page_role: values.role,
      page_location: values.location,
      page_bio: values.bio,
      page_referral_code: values.referralCode,
    };
    const { error } = granting.manual
      ? await client.rpc('admin_create_partner_page', { ...page, page_name: values.name, page_email: values.email, page_brand: values.brand })
      : await client.rpc('admin_grant_partner_page', { applicant_id: granting.user_id, ...page });
    submit.disabled = false;
    if (error) {
      return showError($('#grant-error'), error.code === '23505'
        ? 'That page address or account already has an affiliate page. Choose another address.'
        : 'Could not create the page. Check the details and try again.');
    }
    if (granting.manual) {
      granting = { user_id: null, email: values.email, name: values.name, type: values.type, role: values.role, location: values.location,
        status: 'approved', created_at: new Date().toISOString(), partner_brand: values.brand };
      state.rows.unshift(granting);
    }
    granting.partner_slug = values.slug;
    granting.partner_status = 'preview';
    $('#dlg-grant').close();
    renderApps();
    toast(`Affiliate page /partners/${values.slug}/ created as a preview.`);
  });

  /* ---------- Invites (affiliates can only apply with one) ---------- */
  const INVITE_STATUS = {
    open: { icon: 'clock', label: 'Not used yet' },
    used: { icon: 'check', label: 'Applied' },
    revoked: { icon: 'x', label: 'Cancelled' },
  };
  const inviteForm = $('#invite-form');
  inviteForm.elements.brand.value = document.documentElement.dataset.brand === 'cces' ? 'cces' : 'ccact';
  const linkFor = (invite) => inviteLink(BRAND_SITES[invite.brand]?.origin ?? BRAND_SITES.ccact.origin, invite);
  const mailFor = (invite) => inviteMailto(linkFor(invite), invite, BRAND_SITES[invite.brand]?.name ?? 'CCACT');

  async function loadInvites() {
    const { data, error } = await client.rpc('admin_invites');
    state.invites = error ? [] : data;
  }

  async function copyLink(link) {
    try { await navigator.clipboard.writeText(link); toast('Invite link copied.'); }
    catch { toast('Could not copy. Select the link and copy it yourself.', 'error'); }
  }

  inviteForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const f = inviteForm.elements;
    const invite = {
      email: f.email.value.trim().toLowerCase(),
      type: inviteForm.querySelector('input[name="type"]:checked')?.value ?? '',
      brand: f.brand.value,
      note: f.note.value.trim(),
    };
    const problem = validateInvite(invite);
    if (problem) return showError($('#invite-error'), problem);
    showError($('#invite-error'), '');
    const submit = inviteForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    const { data: token, error } = await client.rpc('admin_create_invite', {
      invite_email: invite.email, invite_type: invite.type, invite_brand: invite.brand, invite_note: invite.note,
    });
    submit.disabled = false;
    if (error) return showError($('#invite-error'), 'Could not create the invite. Please try again.');
    const created = { ...invite, token, created_at: new Date().toISOString(), used_at: null, revoked_at: null };
    state.invites.unshift(created);
    $('#invite-created-email').textContent = invite.email;
    $('#invite-created-link').value = linkFor(created);
    $('#invite-mail').href = mailFor(created);
    $('#invite-created').hidden = false;
    inviteForm.reset();
    inviteForm.elements.brand.value = invite.brand;
    renderInvites();
    toast(`Invite created for ${invite.email}.`);
  });
  $('#invite-copy').addEventListener('click', () => copyLink($('#invite-created-link').value));

  function renderInvites() {
    const list = $('#invites');
    list.replaceChildren();
    if (!state.invites.length) {
      list.append(h('div', { class: 'empty' }, svg('mail'), h('p', { text: 'No invites yet. Create one above.' })));
      return;
    }
    for (const invite of state.invites) list.append(inviteRow(invite));
  }

  function inviteRow(invite) {
    const key = inviteStatus(invite);
    const status = INVITE_STATUS[key];
    const isOrg = invite.type === 'organisation';
    const meta = [BRAND_SITES[invite.brand]?.label, `Created ${formatDate(invite.created_at)}`, invite.used_at && `Applied ${formatDate(invite.used_at)}`].filter(Boolean).join(' · ');
    const main = h('div', {},
      h('h3', { class: 'app__name' }, invite.note || invite.email,
        h('span', { class: `type-tag type-tag--${isOrg ? 'org' : 'ind'}` }, svg(isOrg ? 'building' : 'user'), isOrg ? 'Organization' : 'Individual')),
      invite.note && h('p', { class: 'app__line', text: invite.email }),
      h('p', { class: 'app__line', text: meta }),
      invite.applicant_name && h('p', { class: 'app__line', text: `${invite.applicant_name}'s application is under Applications.` }),
    );
    const actions = key === 'open' && h('div', { class: 'app__actions' },
      h('button', { type: 'button', class: 'btn btn--gold-compact', text: 'Copy link', onclick: () => copyLink(linkFor(invite)) }),
      h('a', { class: 'btn btn--outline-navy', href: mailFor(invite), text: 'Email' }),
      twoStep('Cancel invite', 'Confirm cancel', 'btn btn--danger', (button) => revokeInvite(invite, button)));
    const side = h('div', { class: 'app__side' }, h('span', { class: `chip chip--${key}` }, svg(status.icon), status.label), actions);
    return h('article', { class: 'app-row' }, h('span', { class: 'avatar', 'aria-hidden': 'true' }, svg('mail')), main, side);
  }

  async function revokeInvite(invite, button) {
    button.disabled = true;
    const { error } = await client.rpc('admin_revoke_invite', { invite_token: invite.token });
    if (error) { button.disabled = false; return toast('Could not cancel this invite. Refresh and try again.', 'error'); }
    invite.revoked_at = new Date().toISOString();
    renderInvites();
    toast(`Invite for ${invite.email} cancelled. The link no longer works.`);
  }

  /* ---------- Content (CMS) ---------- */
  async function loadContent() {
    const { data } = await client.from('site_content').select('key,value');
    state.content = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
  }

  function renderContent() {
    const list = $('#content-list');
    list.replaceChildren();
    for (const field of CONTENT_FIELDS) {
      const saved = () => state.content[field.key] ?? '';
      const area = h('textarea', { id: `cms-${field.key}`, rows: field.rows, maxlength: field.max, placeholder: 'Using the built-in text' });
      area.value = saved();
      const count = h('span', { class: 'cms__count' });
      const save = h('button', { type: 'button', class: 'btn btn--gold-compact', text: 'Publish', disabled: true });
      const live = h('p', { class: 'cms__live' }, svg('check'), 'Live on the site');
      const sync = () => {
        count.textContent = `${area.value.length} / ${field.max}`;
        save.disabled = area.value.trim() === saved();
        live.hidden = !saved();
      };
      area.addEventListener('input', sync);
      save.addEventListener('click', async () => {
        save.disabled = true;
        const value = area.value.trim();
        const { error } = await client.rpc('admin_save_content', { content_key: field.key, content_value: value });
        if (error) { sync(); return toast('Could not publish. Please try again.', 'error'); }
        if (value) state.content[field.key] = value; else delete state.content[field.key];
        area.value = value;
        sync();
        toast(value ? `${field.label} published.` : `${field.label} reset to the built-in text.`);
      });
      sync();
      list.append(h('div', { class: 'cms__item' },
        h('div', {}, h('h2', { text: field.label }), h('p', { class: 'muted', text: field.hint }), live),
        h('div', {}, h('label', { class: 'sr-only', for: area.id, text: field.label }), area, h('div', { class: 'cms__row' }, count, save)),
      ));
    }
  }

  /* ---------- Courses ---------- */
  const courseSelect = $('#course-select');
  const courseEditor = $('#course-editor');
  const courseError = $('#courses-error');
  let courses = [];
  const field = (form, name, label, type = 'text', value = '', attrs = {}) => {
    const id = `learn-${name}-${Math.random().toString(36).slice(2)}`;
    const input = h(type === 'textarea' ? 'textarea' : 'input', { id, name, ...(type === 'textarea' ? {} : { type }), ...attrs });
    if (type === 'checkbox') input.checked = Boolean(value); else input.value = value ?? '';
    form.append(h('div', { class: 'field' }, h('label', { for: id, text: label }), input));
    return input;
  };
  const button = (text) => h('button', { type: 'submit', class: 'btn btn--gold-compact', text });
  async function loadCourses(selected = courseSelect.value) {
    const { data, error } = await client.from('courses').select('*').order('created_at');
    if (error) { showError(courseError, 'Could not load courses. Check that the learning schema is installed.'); return; }
    showError(courseError, '');
    courses = data;
    courseSelect.replaceChildren(h('option', { value: '', text: 'New course' }), ...courses.map((c) => h('option', { value: c.id, text: `${c.title} (${c.brand.toUpperCase()}, ${c.status})` })));
    courseSelect.value = selected;
    await renderCourse();
  }
  async function saveRow(table, values, id) {
    const result = id ? await client.from(table).update(values).eq('id', id) : await client.from(table).insert(values).select().single();
    if (result.error) { showError(courseError, 'Could not save. Check the values and try again.'); return null; }
    showError(courseError, '');
    return result.data || { id };
  }
  async function enrollRequest(body) {
    const { data } = await client.auth.getSession();
    const res = await fetch('/.netlify/functions/learn-enroll', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` }, body: JSON.stringify(body) });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Request failed');
    return result;
  }
  courseSelect.addEventListener('change', renderCourse);
  async function renderCourse() {
    const course = courses.find((item) => item.id === courseSelect.value);
    courseEditor.replaceChildren();
    const form = h('form', { class: 'invite-form' });
    field(form, 'title', 'Course title', 'text', course?.title, { required: true, maxlength: 200 });
    field(form, 'description', 'Description', 'textarea', course?.description);
    const brandId = 'learn-brand';
    const brand = h('select', { id: brandId, name: 'brand' }, ...['ccact', 'cces'].map((value) => h('option', { value, text: value.toUpperCase() })));
    brand.value = course?.brand || 'ccact';
    form.append(h('div', { class: 'field' }, h('label', { for: brandId, text: 'Brand' }), brand));
    field(form, 'image', 'Course image URL (HTTPS)', 'url', course?.image);
    field(form, 'ce_hours', 'CE hours (optional)', 'number', course?.ce_hours, { min: '0.1', step: '0.1' });
    field(form, 'pass_mark', 'Pass mark (%)', 'number', course?.pass_mark ?? 66, { required: true, min: '1', max: '100' });
    field(form, 'lessons_in_order', 'Require lessons in order', 'checkbox', course?.lessons_in_order ?? true);
    const status = h('select', { id: 'learn-status', name: 'status' }, ...['draft', 'published', 'archived'].map((v) => h('option', { value: v, text: v })));
    status.value = course?.status || 'draft';
    if (!course) status.disabled = true;
    form.append(h('div', { class: 'field' }, h('label', { for: 'learn-status', text: 'Status' }), status), button(course ? 'Save course' : 'Create draft'));
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const f = form.elements;
      const saved = await saveRow('courses', { title: f.title.value.trim(), description: f.description.value.trim(), brand: brand.value, image: f.image.value.trim() || null, ce_hours: f.ce_hours.value ? Number(f.ce_hours.value) : null, pass_mark: Number(f.pass_mark.value), lessons_in_order: f.lessons_in_order.checked, status: course ? status.value : 'draft' }, course?.id);
      if (saved) { await loadCourses(saved.id); toast('Course saved.'); }
    });
    courseEditor.append(form);
    if (!course) return;
    const modulesResult = await client.from('modules').select('*').eq('course_id', course.id).order('position').order('id');
    if (modulesResult.error) return showError(courseError, 'Could not load modules.');
    const lessonsResult = await client.from('lessons').select('*').in('module_id', modulesResult.data.map((m) => m.id)).order('position').order('id');
    if (lessonsResult.error) return showError(courseError, 'Could not load lessons.');
    const editor = (table, item, parent, position) => {
      const f = h('form', { class: 'invite-form' });
      field(f, 'title', `${table === 'modules' ? 'Module' : 'Lesson'} title`, 'text', item?.title, { required: true, maxlength: 200 });
      field(f, 'position', 'Order', 'number', item?.position ?? position, { required: true, step: '1' });
      if (table === 'lessons') {
        field(f, 'length_minutes', 'Length (minutes)', 'number', item?.length_minutes ?? 5, { min: '1', required: true });
        field(f, 'reading', 'Reading text', 'textarea', item?.reading);
      }
      f.append(button(item ? 'Save' : `Add ${table === 'modules' ? 'module' : 'lesson'}`));
      f.addEventListener('submit', async (event) => {
        event.preventDefault();
        const v = { title: f.elements.title.value.trim(), position: Number(f.elements.position.value), ...(table === 'modules' ? { course_id: parent } : { module_id: parent, length_minutes: Number(f.elements.length_minutes.value), reading: f.elements.reading.value.trim() || null }) };
        if (await saveRow(table, v, item?.id)) { await renderCourse(); toast('Saved.'); }
      });
      return f;
    };
    courseEditor.append(h('h2', { text: 'Modules and lessons' }));
    for (const module of modulesResult.data) {
      courseEditor.append(editor('modules', module, course.id, 0));
      const lessons = lessonsResult.data.filter((lesson) => lesson.module_id === module.id);
      for (const lesson of lessons) courseEditor.append(editor('lessons', lesson, module.id, 0));
      courseEditor.append(editor('lessons', null, module.id, lessons.length ? Math.max(...lessons.map((l) => l.position)) + 1 : 0));
    }
    courseEditor.append(editor('modules', null, course.id, modulesResult.data.length ? Math.max(...modulesResult.data.map((m) => m.position)) + 1 : 0));
    courseEditor.append(h('h2', { text: 'Students' }));
    const enrollForm = h('form', { class: 'invite-form' });
    field(enrollForm, 'students', 'Email addresses (one per line; optionally add a comma and student name)', 'textarea', '', { required: true, rows: 5 });
    enrollForm.append(button('Enroll and send sign-in links'));
    const results = h('p', { role: 'status' });
    enrollForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const students = enrollForm.elements.students.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => { const [email, ...name] = line.split(','); return { email: email.trim(), name: name.join(',').trim() }; });
      const submit = enrollForm.querySelector('button'); submit.disabled = true;
      try {
        const data = await enrollRequest({ action: 'enroll', courseId: course.id, students });
        results.textContent = data.results.map((r) => `${r.email}: ${r.ok ? 'enrolled and email sent' : r.error}`).join(' | ');
        if (data.results.every((r) => r.ok)) enrollForm.reset();
        await loadStudents();
      } catch (error) { results.textContent = error.message; } finally { submit.disabled = false; }
    });
    const list = h('div');
    courseEditor.append(enrollForm, results, list);
    async function loadStudents() {
      list.replaceChildren();
      try {
        const data = await enrollRequest({ action: 'list', courseId: course.id });
        if (!data.students.length) list.append(h('p', { text: 'No students enrolled.' }));
        for (const student of data.students) {
          const row = h('form', { class: 'invite-form' });
          row.append(h('p', { text: student.student_name || 'Name not supplied' }));
          field(row, 'email', 'Student email (changes their shared sign-in)', 'email', student.email, { required: true });
          const save = button('Correct email');
          const remove = h('button', { type: 'button', class: 'btn btn--danger', text: 'Remove enrollment' });
          row.append(save, remove);
          row.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!confirm('Change this student?s sign-in email for all courses and other accounts?')) return;
            try { await enrollRequest({ action: 'correct', courseId: course.id, userId: student.user_id, email: row.elements.email.value }); toast('Email updated.'); await loadStudents(); } catch (error) { showError(courseError, error.message); }
          });
          remove.addEventListener('click', async () => {
            if (!confirm(`Remove ${student.email} from this course?`)) return;
            try { await enrollRequest({ action: 'remove', courseId: course.id, userId: student.user_id }); toast('Enrollment removed.'); await loadStudents(); } catch (error) { showError(courseError, error.message); }
          });
          list.append(row);
        }
      } catch (error) { list.append(h('p', { role: 'alert', text: `Could not load students: ${error.message}` })); }
    }
    await loadStudents();
  }

  function paintProfile() {
    const email = state.user?.email ?? '';
    $('#profile-name').textContent = email.split('@')[0];
    $('#menu-email').textContent = email;
    for (const el of root.querySelectorAll('[data-avatar]')) {
      el.replaceChildren();
      if (state.avatarUrl) el.append(h('img', { src: state.avatarUrl, alt: '' }));
      else el.textContent = initials(email.split('@')[0].replace(/[._-]+/g, ' '));
    }
    $('#photo-remove').hidden = !state.user?.user_metadata?.avatar_path;
  }

  async function loadAvatar() {
    const path = state.user?.user_metadata?.avatar_path;
    state.avatarUrl = null;
    if (!path) return;
    const { data } = await client.storage.from(BUCKET).createSignedUrl(path, 3600);
    state.avatarUrl = data?.signedUrl ?? null;
  }

  /* ---------- Dialogs ---------- */
  function openDialog(selector) {
    const dialog = $(selector);
    dialog.querySelectorAll('.form-error').forEach((el) => { el.hidden = true; });
    dialog.querySelector('form').reset();
    paintProfile();
    dialog.showModal();
  }
  $('#password-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const problem = validateNewPassword(form.elements.password.value, form.elements.confirm.value);
    if (problem) return showError($('#password-error'), problem);
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    const { error } = await client.auth.updateUser({ password: form.elements.password.value });
    submit.disabled = false;
    if (error) return showError($('#password-error'), 'Could not change your password. Please try again.');
    form.reset();
    $('#dlg-password').close();
    toast('Password updated.');
  });

  const photoInput = $('#photo-file');
  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    const problem = file ? validateAvatar(file) : '';
    showError($('#photo-error'), problem);
    if (file && !problem) {
      const preview = $('#photo-preview');
      preview.replaceChildren(h('img', { src: URL.createObjectURL(file), alt: '' }));
    }
  });

  async function refreshUser() {
    const { data: { user } } = await client.auth.getUser();
    if (user) state.user = user;
    await loadAvatar();
    paintProfile();
  }

  $('#photo-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const file = photoInput.files[0];
    const problem = validateAvatar(file);
    if (problem) return showError($('#photo-error'), problem);
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    submit.disabled = true;
    const path = `${state.user.id}/avatar`;
    const upload = await client.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    const update = upload.error ? upload : await client.auth.updateUser({ data: { avatar_path: path } });
    submit.disabled = false;
    if (update.error) return showError($('#photo-error'), 'Could not save your photo. Please try again.');
    await refreshUser();
    $('#dlg-photo').close();
    toast('Profile photo updated.');
  });

  $('#photo-remove').addEventListener('click', async () => {
    const path = state.user?.user_metadata?.avatar_path;
    if (!path) return;
    await client.storage.from(BUCKET).remove([path]);
    const { error } = await client.auth.updateUser({ data: { avatar_path: null } });
    if (error) return showError($('#photo-error'), 'Could not remove your photo. Please try again.');
    await refreshUser();
    $('#dlg-photo').close();
    toast('Profile photo removed.');
  });

  boot().catch(() => {
    setView('login');
    showError(loginError, 'Could not connect. Check your connection and try again.');
  });
}

if (typeof document !== 'undefined') {
  const root = document.querySelector('[data-admin-dashboard]');
  if (root) {
    const { supabaseUrl, supabaseKey } = root.dataset;
    if (supabaseUrl && supabaseKey) {
      setupAdmin(root, createClient(supabaseUrl, supabaseKey));
    } else {
      root.dataset.state = 'login';
      root.querySelector('#login-error').textContent = 'The console is not configured.';
      root.querySelector('#login-error').hidden = false;
      root.querySelector('#admin-login button[type="submit"]').disabled = true;
    }
  }
}
