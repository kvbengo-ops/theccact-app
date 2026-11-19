import { createClient } from '@supabase/supabase-js';

const clean = value => (typeof value === 'string' ? value.trim() : '');
const OPTIONAL = ['type', 'contact_name', 'website', 'languages'];

export function applicationDetails(data) {
  const details = Object.fromEntries(['name', 'location', 'role', 'introduction'].map(key => [key, clean(data[key])]));
  if (!details.name || details.name.length > 120 || details.location.length > 160 || details.role.length > 160 || details.introduction.length > 2000) {
    throw new Error('Enter a valid name and check the length of your details.');
  }
  const extra = Object.fromEntries(OPTIONAL.map(key => [key, clean(data[key])]).filter(([, value]) => value));
  if (extra.type && !['individual', 'organisation'].includes(extra.type)) throw new Error('Choose an individual or organisation application.');
  if (extra.type === 'organisation' && !extra.contact_name) throw new Error('Add the name of a contact person at your organisation.');
  if (extra.contact_name?.length > 120 || extra.languages?.length > 200) throw new Error('Check the length of your details.');
  if (extra.website && (extra.website.length > 300 || !/^https:\/\/[^\s/$.?#].[^\s]*$/i.test(extra.website))) {
    throw new Error('Enter your website as a full address starting with https://');
  }
  return { ...details, ...extra };
}

export async function submitApplication(client, user, data) {
  if (!user) throw new Error('Please sign in before submitting your application.');
  const details = applicationDetails(data);
  const { error } = await client.from('affiliate_applications').insert({ user_id: user.id, ...details, location: details.location || null, role: details.role || null, introduction: details.introduction || null });
  if (error) throw new Error(error.code === '23505' ? 'You have already submitted an application.' : 'Your application could not be submitted. Please try again.');
}

export function setupApplicationPage(root, client) {
  const application = root.querySelector('#affiliate-application');
  const detailsStep = root.querySelector('#details-step');
  const accountStep = root.querySelector('#account-step');
  const status = root.querySelector('#affiliate-status');
  const logout = root.querySelector('#affiliate-logout');
  const say = message => { status.textContent = message; };
  let user = null;
  const details = () => applicationDetails(Object.fromEntries(new FormData(application)));
  const showStep = step => { detailsStep.hidden = step !== 1; accountStep.hidden = step !== 2; };

  async function refresh() {
    const result = await client.auth.getUser();
    user = result.data.user;
    logout.hidden = !user;
    root.querySelector('#affiliate-login-link').hidden = Boolean(user);
    application.hidden = Boolean(user);
    if (!user) return say('Step 1 of 2: tell us about yourself.');
    const { data, error } = await client.from('affiliate_applications').select('status').maybeSingle();
    if (error) return say('Unable to load your application. Please try again.');
    if (data?.status === 'approved') return location.replace('/affiliate/dashboard/');
    if (data) return say(`Your application status: ${data.status}.`);
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
    } else { showStep(2); say('Step 2 of 2: create your account.'); }
  });
  root.querySelector('#application-back').addEventListener('click', () => { showStep(1); say('Step 1 of 2: your details.'); });
  application.addEventListener('submit', async event => {
    event.preventDefault();
    const button = application.querySelector('button[type="submit"]');
    button.disabled = true;
    say('Creating your account…');
    try {
      const { data, error } = await client.auth.signUp({
        email: application.elements.email.value.trim(), password: application.elements.password.value,
        options: { data: { affiliate_application: details() } },
      });
      application.elements.password.value = '';
      if (error) return say('Unable to create your account. Check your details and try again.');
      if (!data.session) return say('Account creation could not be completed. Please contact CCACT.');
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
  refresh().catch(() => say('Unable to connect. Please try again.'));
}

if (typeof document !== 'undefined') {
  const root = document.querySelector('[data-affiliate-application]');
  if (root) {
    const { supabaseUrl, supabaseKey } = root.dataset;
    if (supabaseUrl && supabaseKey) setupApplicationPage(root, createClient(supabaseUrl, supabaseKey));
    else root.querySelector('#affiliate-status').textContent = 'Applications are not configured yet. Please contact CCACT.';
  }
}
