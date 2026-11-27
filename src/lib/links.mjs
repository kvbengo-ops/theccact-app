// One codebase builds two sites: SITE_BRAND=cces builds thecces.com, anything else builds theccact.com.
export const SITE_BRAND = globalThis.process?.env.SITE_BRAND === 'cces' ? 'cces' : 'ccact';
// Each brand owns its Teachable school, so main-site links carry no affcode.
export const TEACHABLE_HOST = {
  ccact: 'the-canadian-centre-for-advanced-career-traini.teachable.com',
  cces: 'thecces.teachable.com',
}[SITE_BRAND];
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
  try { url = new URL(destination); } catch { throw new Error('Invalid enrollment destination'); }
  if (url.protocol !== 'https:' || url.hostname !== TEACHABLE_HOST) {
    throw new Error(`Enrollment destination must be the ${SITE_BRAND.toUpperCase()} Teachable school`);
  }
  // Partner pages credit the partner's own Teachable affcode (referralCode).
  if (partner?.referralCode) url.searchParams.set('affcode', partner.referralCode);
  return url.href;
}
