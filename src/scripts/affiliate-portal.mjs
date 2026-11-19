import { createClient } from '@supabase/supabase-js';
import { h, setupShell, showError } from './console-shell.mjs';
import { initials, validateNewPassword } from '../lib/admin-helpers.mjs';

export async function loadAffiliate(client) {
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError && authError.name !== 'AuthSessionMissingError') throw new Error('Unable to check your account. Please try again.');
  if (!user) return null;
  const { data, error } = await client.from('affiliate_applications').select('name,status').maybeSingle();
  if (error) throw new Error('Unable to check your application. Please try again.');
  return { user, application: data };
}

const PAGE_TEXT = {
  live: { stat: 'Live', heading: 'Your page is live', detail: 'Share this link with learners. Enrolments through your page are attributed to you.' },
  preview: { stat: 'Being prepared', heading: 'Your page is being prepared', detail: 'CCACT has created your page and is finishing the review. The link works once it goes live.' },
  review: { stat: 'In review', heading: 'Your page is in review', detail: 'CCACT is reviewing your page content.' },
  draft: { stat: 'Draft', heading: 'Your page is a draft', detail: 'CCACT is preparing your page content.' },
  suspended: { stat: 'Paused', heading: 'Your page is paused', detail: 'Your page is temporarily offline. Contact CCACT for details.' },
  retired: { stat: 'Closed', heading: 'Your page is closed', detail: 'This partner page is no longer active. Contact CCACT for details.' },
};

export function setupAffiliatePortal(root, client) {
  const page = root.dataset.affiliatePortal;
  const $ = (selector) => root.querySelector(selector);
  const status = $('#portal-status');
  const logout = $('#portal-logout');
  const login = $('#portal-login');
  const dashboard = $('#portal-dashboard');
  const say = (message) => { status.textContent = message; };
  const shell = setupShell(root, { onAction: (action) => { if (action === 'password') openPassword(); } });

  function paintProfile(user) {
    const email = user?.email ?? '';
    const name = email.split('@')[0];
    if ($('#profile-name')) $('#profile-name').textContent = name;
    if ($('#menu-email')) $('#menu-email').textContent = email;
    root.querySelectorAll('[data-avatar]').forEach((el) => { el.textContent = initials(name.replace(/[._-]+/g, ' ')); });
  }

  // Partner page link (needs the grant_partner_pages migration; keeps the default text if unavailable).
  async function paintPartnerPage() {
    const { data, error } = await client.rpc('my_partner_page');
    const row = !error && Array.isArray(data) ? data[0] : null;
    if (!row) return;
    const text = PAGE_TEXT[row.status] ?? PAGE_TEXT.preview;
    const url = `/partners/${row.slug}/`;
    $('#page-stat').textContent = text.stat;
    $('#page-heading').textContent = text.heading;
    $('#page-detail').replaceChildren(text.detail, ' ', h('strong', { text: `${location.origin}${url}` }));
    $('#page-summary').textContent = `${text.heading}: ${url}`;
    const link = $('#page-link');
    link.href = url;
    link.hidden = row.status !== 'live';
  }

  async function refresh() {
    const account = await loadAffiliate(client);
    if (!account) {
      if (page === 'dashboard') return location.replace('/affiliate/login/');
      login.hidden = false;
      logout.hidden = true;
      return say('');
    }
    logout.hidden = false;
    if (login) login.hidden = true;
    if (account.application?.status === 'approved') {
      if (page === 'login') return location.replace('/affiliate/dashboard/');
      $('#portal-welcome').textContent = `Welcome, ${account.application.name}`;
      paintProfile(account.user);
      dashboard.hidden = false;
      shell.route();
      say('');
      await paintPartnerPage().catch(() => {});
      return;
    }
    if (page === 'dashboard') return location.replace('/affiliate/login/');
    if (!account.application) return say('You have not submitted an application yet. Use the application link below to finish.');
    if (account.application.status === 'pending') return say('Your application is pending review by CCACT.');
    return say('Your application was not approved. Please contact CCACT for more information.');
  }

  if (login) login.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = login.querySelector('button[type="submit"]');
    const email = login.elements.email.value.trim();
    const password = login.elements.password.value;
    if (!email || !password) return say('Enter your email address and password.');
    button.disabled = true;
    say('Signing in…');
    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      login.elements.password.value = '';
      if (error) return say('Unable to sign in. Check your email and password.');
      await refresh();
    } catch { say('Unable to connect. Please try again.'); }
    finally { button.disabled = false; }
  });

  logout.addEventListener('click', async () => {
    shell.closeMenu();
    const { error } = await client.auth.signOut();
    if (error) return say('Unable to sign out. Please try again.');
    if (page === 'dashboard') return location.replace('/affiliate/login/');
    await refresh();
  });

  const passwordForm = $('#password-form');
  function openPassword() {
    passwordForm.reset();
    showError($('#password-error'), '');
    $('#dlg-password').showModal();
  }
  passwordForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const problem = validateNewPassword(passwordForm.elements.password.value, passwordForm.elements.confirm.value);
    if (problem) return showError($('#password-error'), problem);
    const submit = passwordForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    const { error } = await client.auth.updateUser({ password: passwordForm.elements.password.value });
    submit.disabled = false;
    if (error) return showError($('#password-error'), 'Could not change your password. Please try again.');
    $('#dlg-password').close();
    shell.toast('Password updated.');
  });

  refresh().catch((error) => say(error.message || 'Unable to connect. Please try again.'));
}

if (typeof document !== 'undefined') {
  const root = document.querySelector('[data-affiliate-portal]');
  if (root) {
    const { supabaseUrl, supabaseKey } = root.dataset;
    if (supabaseUrl && supabaseKey) setupAffiliatePortal(root, createClient(supabaseUrl, supabaseKey));
    else root.querySelector('#portal-status').textContent = 'The affiliate portal is not configured yet. Please contact CCACT.';
  }
}
