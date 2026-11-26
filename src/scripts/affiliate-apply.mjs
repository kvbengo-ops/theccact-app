import { createClient } from '@supabase/supabase-js';

const clean = value => (typeof value === 'string' ? value.trim() : '');
const OPTIONAL = ['type', 'contact_name', 'website', 'languages'];

export function applicationDetails(data) {
  const details = Object.fromEntries(['name', 'location', 'role', 'introduction'].map(key => [key, clean(data[key])]));
  if (!details.name || details.name.length > 120 || details.location.length > 160 || details.role.length > 160 || details.introduction.length > 2000) {
    throw new Error('Enter a valid name and check the length of your details.');
  }
  const extra = Object.fromEntries(OPTIONAL.map(key => [key, clean(data[key])]).filter(([, value]) => value));
  if (extra.type && !['individual', 'organisation'].includes(extra.type)) throw new Error('Choose an individual or organization application.');
  if (extra.type === 'organisation' && !extra.contact_name) throw new Error('Add the name of a contact person at your organization.');
  if (extra.contact_name?.length > 120 || extra.languages?.length > 200) throw new Error('Check the length of your details.');
  if (extra.website && (extra.website.length > 300 || !/^https:\/\/[^\s/$.?#].[^\s]*$/i.test(extra.website))) {
    throw new Error('Enter your website as a full address starting with https://');
  }
  return { ...details, ...extra };
}

// Full CCES-style answers -> the review columns the admin console and page grant use; everything is also kept in `answers`.
export function toApplication(answers) {
  const a = Object.fromEntries(Object.entries(answers).filter(([key, value]) => key !== 'email' && key !== 'password' && (Array.isArray(value) ? value.length : clean(value))));
  if (JSON.stringify(a).length > 40000) throw new Error('Your application is too long. Please shorten your answers.');
  const isOrg = a.type === 'organisation';
  const text = (value, max) => clean([value ?? ''].flat().join(', ')).slice(0, max);
  const site = clean(a.website);
  return {
    type: a.type,
    name: text(isOrg ? a.companyName || a.contactName : a.preferredName || a.fullLegalName, 120),
    location: text(['city', 'province', 'country'].map(key => clean(a[key])).filter(Boolean), 160),
    role: text(isOrg ? a.categories : a.currentOccupation, 160),
    introduction: text(isOrg ? a.promotionPlan : a.professionalBackground, 2000),
    contact_name: isOrg ? text(a.contactName, 120) : '',
    website: /^https:\/\//i.test(site) ? site : '',
    answers: a,
  };
}

// Applications are by invitation: the link carries ?invite=<uuid>, and the database only accepts an application
// from the invited email while the invite is open.
const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function inviteToken(search) {
  const token = (new URLSearchParams(search).get('invite') ?? '').trim();
  return TOKEN.test(token) ? token.toLowerCase() : '';
}

// { email, type } for an open invite, otherwise null.
export async function loadInvite(client, token) {
  if (!token) return null;
  const { data, error } = await client.rpc('invite_details', { invite_token: token });
  return error ? null : data?.[0] ?? null;
}

export async function submitApplication(client, user, data) {
  if (!user) throw new Error('Please sign in before submitting your application.');
  const details = applicationDetails(data);
  const { error } = await client.from('affiliate_applications').insert({ user_id: user.id, ...details, location: details.location || null, role: details.role || null, introduction: details.introduction || null, ...(data.answers && { answers: data.answers }) });
  if (error) {
    if (error.code === '23505') throw new Error('You have already submitted an application.');
    if (error.code === '42501') throw new Error('Your invitation is no longer valid, or was sent to a different email address. Please contact us for a new invitation.');
    throw new Error('Your application could not be submitted. Please try again.');
  }
}

export function setupApplicationPage(root, client) {
  const application = root.querySelector('#affiliate-application');
  const detailsStep = root.querySelector('#details-step');
  const accountStep = root.querySelector('#account-step');
  const status = root.querySelector('#affiliate-status');
  const logout = root.querySelector('#affiliate-logout');
  const required = root.querySelector('#invite-required');
  const say = message => { status.textContent = message; };
  let user = null;
  let invite = null;
  const needInvite = () => { application.hidden = true; required.hidden = false; say('Affiliate applications are by invitation only.'); };
  // Checkbox sets come back as arrays; single fields as strings.
  const answers = () => {
    const form = new FormData(application);
    return Object.fromEntries([...new Set(form.keys())].map(key => {
      const values = form.getAll(key);
      return [key, application.querySelectorAll(`input[type="checkbox"][name="${key}"]`).length > 1 ? values : values[0]];
    }));
  };
  const details = () => { const data = toApplication(answers()); applicationDetails(data); return data; };
  const showStep = step => { detailsStep.hidden = step !== 1; accountStep.hidden = step !== 2; };

  async function refresh() {
    const result = await client.auth.getUser();
    user = result.data.user;
    logout.hidden = !user;
    root.querySelector('#affiliate-login-link').hidden = Boolean(user);
    application.hidden = true;
    required.hidden = true;
    if (!user) {
      if (!invite) return needInvite();
      application.hidden = false;
      return say('Step 1 of 2: complete the application.');
    }
    const { data, error } = await client.from('affiliate_applications').select('status').maybeSingle();
    if (error) return say('Unable to load your application. Please try again.');
    if (data?.status === 'approved') return location.replace('/affiliate/dashboard/');
    if (data) return say(`Your application status: ${data.status}.`);
    if (!invite) return needInvite();
    const draft = user.user_metadata?.affiliate_application;
    if (draft) {
      try {
        await submitApplication(client, user, draft);
        return say('Your application has been submitted and is pending review.');
      } catch (error) { say(error.message); }
    } else say('Complete your application below.');
    application.hidden = false;
    showStep(1);
  }

  root.querySelector('#application-next').addEventListener('click', async () => {
    for (const field of detailsStep.elements) if (!field.reportValidity()) return;
    try { details(); } catch (error) { return say(error.message); }
    if (user) {
      try { await submitApplication(client, user, details()); await refresh(); }
      catch (error) { say(error.message); }
    } else { showStep(2); say('Step 2 of 2: create your password.'); }
  });
  root.querySelector('#application-back').addEventListener('click', () => { showStep(1); say('Step 1 of 2: complete the application.'); });
  application.addEventListener('submit', async event => {
    event.preventDefault();
    const button = application.querySelector('button[type="submit"]');
    button.disabled = true;
    say('Creating your account…');
    try {
      const submission = details();
      const { data, error } = await client.auth.signUp({
        email: application.elements.email.value.trim(), password: application.elements.password.value,
      });
      application.elements.password.value = '';
      if (error) return say('Unable to create your account. Check your details and try again.');
      if (!data.session) return say('Account creation could not be completed. Please contact CCACT.');
      // Answers are too large for Auth metadata (it rides in every token), so submit now; if this fails, refresh() shows the filled form to resend.
      try { await submitApplication(client, data.user, submission); } catch (submitError) { say(submitError.message); }
      await refresh();
    } catch { say('Unable to connect. Please try again.'); }
    finally { button.disabled = false; }
  });
  logout.addEventListener('click', async () => {
    const { error } = await client.auth.signOut();
    if (error) return say('Unable to sign out. Please try again.');
    say('Signed out.');
    showStep(1);
    await refresh();
  });
  async function start() {
    invite = await loadInvite(client, inviteToken(location.search));
    if (invite) {
      // The invite decides the form: send an organization invite to the organization form, and the other way round.
      const formType = application.elements.type.value;
      if (invite.type !== formType) return location.replace(`/affiliate-apply/${invite.type}/${location.search}`);
      application.elements.email.value = invite.email;
      application.elements.email.readOnly = true;
    }
    await refresh();
  }
  start().catch(() => say('Unable to connect. Please try again.'));
}

if (typeof document !== 'undefined') {
  const root = document.querySelector('[data-affiliate-application]');
  if (root) {
    const { supabaseUrl, supabaseKey } = root.dataset;
    if (supabaseUrl && supabaseKey) setupApplicationPage(root, createClient(supabaseUrl, supabaseKey));
    else root.querySelector('#affiliate-status').textContent = 'Applications are not configured yet. Please contact CCACT.';
  }
}
