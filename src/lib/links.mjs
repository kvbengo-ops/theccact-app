// One codebase builds two sites: SITE_BRAND=cces builds thecces.com, anything else builds theccact.com.
export const SITE_BRAND = globalThis.process?.env.SITE_BRAND === 'cces' ? 'cces' : 'ccact';
// CCES owns the Teachable school, so its main site sends no affcode.
const MAIN_AFFCODE = { ccact: '1360772_ayijgwbz', cces: null }[SITE_BRAND];
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
  // Main site credits the brand; partner pages credit the partner's own Teachable affcode (referralCode).
  const affcode = partner ? partner.referralCode : MAIN_AFFCODE;
  if (affcode) url.searchParams.set('affcode', affcode);
  return url.href;
}
