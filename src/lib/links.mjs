const CCACT_AFFCODE = '1360772_ayijgwbz';
const pages = new Set(['', 'about', 'courses', 'registration', 'study-in-canada', 'faq', 'about-partner', 'contact', 'privacy']);

// Partner routes are generated only for validated, live records.
export function pageUrl(page, partner) {
  if (!pages.has(page)) throw new Error(`Unknown page: ${page}`);
  if (!partner && page === 'about-partner') throw new Error('Partner page requires a partner');
  if (partner && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(partner.slug)) throw new Error('Invalid partner slug');
  const base = partner ? `/partners/${partner.slug}/` : '/';
  return page ? `${base}${page}/` : base;
}

export function enrolmentUrl(destination, partner) {
  let url;
  try { url = new URL(destination); } catch { throw new Error('Invalid enrolment destination'); }
  if (url.protocol !== 'https:' || url.hostname !== 'thecces.teachable.com') {
    throw new Error('Enrolment destination must be the CCACT Teachable school');
  }
  // ponytail: every enrol link carries CCACT's single Teachable affiliate code. Per-partner attribution
  // would swap in partner.referralCode here once each partner has their own Teachable affcode.
  url.searchParams.set('affcode', CCACT_AFFCODE);
  return url.href;
}
