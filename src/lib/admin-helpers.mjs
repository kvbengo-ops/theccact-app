// Pure helpers for the owner console (no DOM, no network) so they can be unit-tested.

// Editable site text. Keys must match the check constraint in the admin_profile_cms migration.
export const CONTENT_FIELDS = [
  { key: 'announcement', label: 'Announcement bar', hint: 'The slim line above the header on every page.', max: 160, rows: 2 },
  { key: 'hero_lead', label: 'Home page introduction', hint: 'The paragraph under the main headline.', max: 400, rows: 4 },
  { key: 'courses_lead', label: 'Courses introduction', hint: 'Shown above the course cards on the home page.', max: 300, rows: 3 },
  { key: 'footer_tagline', label: 'Footer tagline', hint: 'The short description beside the footer logo.', max: 200, rows: 3 },
];

export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const PASSWORD_MIN = 12;

export function countByStatus(rows) {
  const counts = { all: rows.length, pending: 0, approved: 0, rejected: 0 };
  for (const row of rows) if (row.status in counts) counts[row.status] += 1;
  return counts;
}

// Partner page URL slugs: same rule as the partners table and validatePartners().
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(name) {
  return String(name ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

export function validateGrant({ slug, role, location, bio, referralCode, type }) {
  if (!SLUG_PATTERN.test(slug ?? '')) return 'Use lowercase letters, numbers and single hyphens for the page address.';
  if (!['individual', 'organisation'].includes(type)) return 'Choose whether this is an individual or an organization.';
  for (const [value, label] of [[role, 'role'], [location, 'location'], [bio, 'bio'], [referralCode, 'referral code']]) {
    if (!String(value ?? '').trim()) return `Add the affiliate’s ${label}.`;
  }
  return '';
}

// A page the owner adds directly, for an affiliate with no account.
export function validateManualPage(values) {
  if (!String(values.name ?? '').trim()) return 'Add the affiliate’s name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email ?? '')) return 'Enter a valid email address.';
  if (!['ccact', 'cces'].includes(values.brand)) return 'Choose the website for this page.';
  return validateGrant(values);
}

// Case-insensitive match on the fields an owner would search by.
export function matchesQuery(row, query) {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return true;
  return [row.name, row.email, row.role, row.location].some((v) => String(v ?? '').toLowerCase().includes(q));
}

export function initials(name) {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2);
  return letters.toUpperCase();
}

export function validateNewPassword(password, confirm) {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password !== confirm) return 'The two passwords do not match.';
  return '';
}

export function validateAvatar(file) {
  if (!file) return 'Choose a photo first.';
  if (!AVATAR_TYPES.includes(file.type)) return 'Use a JPG, PNG or WebP image.';
  if (file.size > AVATAR_MAX_BYTES) return 'The photo must be 2 MB or smaller.';
  return '';
}

export function formatDate(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Invites: affiliates can only apply through a personal link the owner sends.
export function validateInvite({ email, type }) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '')) return 'Enter a valid email address.';
  if (!['individual', 'organisation'].includes(type)) return 'Choose individual or organization.';
  return '';
}

export function inviteStatus(invite) {
  if (invite.used_at) return 'used';
  if (invite.revoked_at) return 'revoked';
  return 'open';
}

// The apply form for the invite's type, on the website the affiliate will belong to.
export function inviteLink(origin, { type, token }) {
  return `${origin}/affiliate-apply/${type === 'organisation' ? 'organisation' : 'individual'}/?invite=${token}`;
}

// A ready-to-send email the owner opens in her own mail app.
export function inviteMailto(link, { email, note }, brandName) {
  const hello = note ? `Hello ${note},` : 'Hello,';
  const body = [
    hello,
    '',
    `You are invited to apply to become a ${brandName} affiliate. Use your personal link to complete your application:`,
    '',
    link,
    '',
    `The link works once and only with this email address (${email}).`,
    '',
    'Thank you,',
    brandName,
  ].join('\n');
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Your invitation to become a ${brandName} affiliate`)}&body=${encodeURIComponent(body)}`;
}
