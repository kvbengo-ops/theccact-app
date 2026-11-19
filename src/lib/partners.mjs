const statuses = ['draft', 'review', 'preview', 'live', 'suspended', 'retired'];
const transitions = {
  draft: ['review'], review: ['draft', 'preview'], preview: ['review', 'live'],
  live: ['suspended', 'retired'], suspended: ['live', 'retired'], retired: [],
};

const text = value => typeof value === 'string' && value.trim().length > 0;
const date = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
};
const httpsUrl = value => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};

export function validatePartners(records) {
  if (!Array.isArray(records)) throw new Error('Partners must be an array');
  const slugs = new Set();
  for (const [index, p] of records.entries()) {
    const fail = message => { throw new Error(`Partner ${index + 1}: ${message}`); };
    if (!p || typeof p !== 'object' || Array.isArray(p)) fail('must be an object');
    if (!text(p.slug) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) fail('invalid slug');
    if (slugs.has(p.slug)) fail(`duplicate slug: ${p.slug}`);
    slugs.add(p.slug);
    for (const field of ['name', 'referralCode', 'bio', 'role', 'location', 'email']) {
      if (!text(p[field])) fail(`${field} is required`);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) fail('invalid email');
    if (!['individual', 'organisation'].includes(p.type)) fail('invalid type');
    if (!statuses.includes(p.status)) fail('invalid status');
    if (!date(p.approvalDate)) fail('invalid approval date');
    for (const field of ['languages', 'services']) {
      if (p[field] !== undefined && (!Array.isArray(p[field]) || p[field].some(v => !text(v)))) fail(`${field} must be an array of non-empty strings`);
    }
    if (p.services?.length > 4) fail('services must contain at most four items');
    if (p.website !== undefined && (p.type !== 'organisation' || !httpsUrl(p.website))) fail('website must be an HTTPS URL for an organisation');
    if (p.image !== undefined && (!text(p.image) || (!/^\/partner-images\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.[a-zA-Z0-9]+$/.test(p.image) && !httpsUrl(p.image)))) fail('image must be an HTTPS URL or /partner-images/ path');
    if (p.status === 'live' && (!date(p.contentReviewedDate) || !date(p.partnerApprovedDate))) fail('live partners require content review and partner approval dates');
  }
  return records;
}

export function canTransition(from, to) {
  return transitions[from]?.includes(to) ?? false;
}

export function publicPartners(records) {
  return validatePartners(records).filter(p => p.status === 'live');
}
