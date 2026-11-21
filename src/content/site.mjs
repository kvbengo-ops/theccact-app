import { pageUrl } from '../lib/links.mjs';

/**
 * The CCES site (SITE_BRAND=cces) is the same site with CCES's name, logo, colours and facts.
 * These swaps run over the built HTML/JS (astro.config.mjs), in order, so every page and component
 * is covered without a CCES copy of each string. Keys must match the built text (apostrophes are
 * HTML-escaped there, so keep them out of keys). Facts that need whole new copy live in pages.mjs.
 */
export const CCES_REWRITES = [
  ['<html lang="en"', '<html lang="en" data-brand="cces"'],
  ['/ccact-logo-footer.webp', '/cces-logo.svg'],
  ['/ccact-logo.png', '/cces-logo.svg'],
  ['type="image/png" href="/cces-logo.svg"', 'type="image/svg+xml" href="/cces-logo.svg"'],
  ['theccact@gmail.com', 'info@thecces.com'],
  [' (or info@theccact.online as listed on the legacy FAQ)', ''],
  ['founders are educators with more than 25 years of experience owning and operating a private healthcare college', 'Director is an educator with more than 25 years of experience owning and operating private healthcare colleges'],
  ['Established in 2012', 'Established in 2022'],
  ['Established 2012', 'Established 2022'],
  ['Est. 2012', 'Est. 2022'],
  ['more than 50 online', 'more than 25 online'],
  ['Over 50 online', 'Over 25 online'],
  ['50+ online', '25+ online'],
  ['Canadian Centre For Advanced Career Training', 'Canadian Centre of Emerging Studies'],
  ['Canadian Centre for Advanced Career Training', 'Canadian Centre of Emerging Studies'],
  ['CCACT', 'CCES'],
];

/** Canonical external destinations from live CCACT Teachable catalog & corporate details. */
export const TEACHABLE_CATALOG_URL =
  'https://thecces.teachable.com/l/products?sortKey=recommended&sortDirection=asc';

export const BRAND = {
  shortName: 'CCACT',
  fullName: 'Canadian Centre For Advanced Career Training',
  subWordmark: 'Canadian Centre for Advanced Career Training',
  taglineStatement:
    'Canadian Centre For Advanced Career Training. Continuing education for internationally educated healthcare professionals.',
  announcement: 'Registration is open 7 days a week, 24 hours a day',
  logoSrc: '/ccact-logo.png',
  logoWidth: 407,
  logoHeight: 381,
  logoAlt: 'The CCACT Est. 2012 Continuing Education crest',
  contactEmail: 'theccact@gmail.com',
  contactPhone: 'WhatsApp / Text: +1 416-893-8158',
  copyright: '© 2026 Canadian Centre For Advanced Career Training (CCACT). All rights reserved.',
  mainAffiliatesHref: '/affiliates/',
  mainDirectoryHref: '/partners/',
};

export const HOME_HERO = {
  eyebrow: 'Continuing education · Est. 2012',
  headlineLine1: 'Study in Canada',
  headlineLine2: 'from anywhere in the world',
  lead: 'The Canadian Centre For Advanced Career Training offers more than 50 online continuing education courses designed to support internationally trained professionals, with a special focus on the South Asian community.',
  primaryCtaLabel: 'Browse online courses',
  secondaryCtaLabel: 'Register now',
  accountNote: 'Creating an account does not enrol you in a course or result in any charge.',
  whyTitle: 'Why study with CCACT',
  whyPoints: [
    'Immediate access upon enrolment',
    '100% online, study anywhere, anytime',
    'Built around Canadian healthcare standards',
    'Certificate of Completion for listed courses',
  ],
};

export const HOME_COURSES_INTRO = {
  heading: 'Online courses',
  lead: 'A Certificate of Completion is issued upon successful completion for all courses listed below unless otherwise noted.',
  allCoursesLabel: 'Browse all courses on Teachable',
};

/**
 * Six homepage programme cards anchored to Main.dc.html and verified live Teachable URLs.
 * ESL has no live Teachable product page yet and intentionally routes to Contact for updates.
 */
export const HOME_PROGRAMMES = [
  {
    id: 'gerontology',
    code: 'GN 101–109',
    title: 'Gerontology Nursing',
    blurb:
      'The role of the geriatric nurse, health promotion strategies and common health conditions in the aging population.',
    meta: '9 courses · bundle available',
    ctaLabel: 'Browse & enrol',
    teachableUrl:
      'https://thecces.teachable.com/l/products?sortKey=recommended&sortDirection=asc&courseCategory=Gerontology+Nursing',
  },
  {
    id: 'crner',
    code: 'CRNER 101–107',
    title: 'Canadian Registered Nurse Exam Review',
    blurb:
      'Exam writing techniques, competency categories and comprehensive practice exam guides for the Canadian Nursing Exam.',
    meta: '7 courses · practice exams',
    ctaLabel: 'Browse & enrol',
    teachableUrl:
      'https://thecces.teachable.com/l/products?sortKey=recommended&sortDirection=asc&courseCategory=Canadian+Nursing+Exam+Review',
  },
  {
    id: 'chs',
    code: 'CHS 101–104',
    title: 'Canadian Health Care System',
    blurb:
      'Canadian standards and regulations in health care, including ethics, informed consent and the nurse–client relationship.',
    meta: '4 courses · bundle CAD $149',
    ctaLabel: 'Browse & enrol',
    teachableUrl:
      'https://thecces.teachable.com/l/products?sortKey=recommended&sortDirection=asc&courseCategory=Canadian+Health+Care+System',
  },
  {
    id: 'hpc',
    code: 'HPC 101–102',
    title: 'Hospice & Palliative Care',
    blurb:
      'Compassionate end-of-life care within the Canadian healthcare context, covering ethics and symptom management.',
    meta: '2 courses · bundle available',
    ctaLabel: 'Browse & enrol',
    // No Teachable category exists for HPC; the catalogue search returns exactly HPC-101, HPC-102 and the bundle.
    teachableUrl:
      'https://thecces.teachable.com/l/products?sortKey=recommended&sortDirection=asc&search=hospice',
  },
  {
    id: 'dm',
    code: 'DM 101–103',
    title: 'Diagnostic Modalities',
    blurb:
      'Theoretical foundations for electrocardiography, phlebotomy and peripheral intravenous therapy initiation.',
    meta: '3 courses · theory only',
    ctaLabel: 'Browse & enrol',
    teachableUrl:
      'https://thecces.teachable.com/l/products?sortKey=recommended&sortDirection=asc&courseCategory=Diagnostic+Modalities',
  },
  {
    id: 'esl',
    code: 'ESL',
    title: 'English Communication Skills',
    blurb:
      'Professional English for healthcare settings, patient-centred communication, documentation and CELPIP preparation.',
    meta: '7 modules · expanding',
    ctaLabel: 'Join mailing list',
    internalPage: 'contact',
  },
];

export const CONTINUING_EDUCATION_NOTICE = {
  heading: 'Continuing education notice',
  body: 'CCACT offers online continuing-education, review, and professional-development courses. These courses do not provide a diploma or degree and do not lead directly to professional licensing or registration in Canada. They are designed to strengthen knowledge, practical understanding, and confidence while supporting personal and professional development.',
  partnerNotice:
    'CCACT and authorised affiliate partners cannot guarantee employment, admission, licensing, professional registration, or immigration results. Course enrolment and tuition payment occur directly with CCACT on Teachable; partners never collect tuition.',
  directoryNotice:
    'Authorised CCACT partners introduce prospective students to CCACT programs and never collect tuition. All course enrolment and payment is completed directly with CCACT through Teachable, and no partner can guarantee employment, licensing, professional recognition, or immigration outcomes.',
};

/**
 * Formats the partner navigation label cleanly for both individuals ("About Maria")
 * and organisations ("About Maple Leaf Recruiting").
 */
export function getPartnerNavLabel(partner) {
  if (!partner?.name) return 'About Partner';
  const trimmed = String(partner.name).trim();
  if (partner.type === 'organisation') return `About ${trimmed}`;
  const firstWord = trimmed.split(/\s+/)[0] || trimmed;
  return `About ${firstWord}`;
}

/** Computes 1-2 uppercase monogram initials for avatar fallback. */
export function getPartnerInitials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'CC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Builds the primary header navigation list according to PRD context rules:
 * partner sites preserve partner routes and exclude Affiliates recruitment.
 */
export function getPrimaryNavItems(partner = null) {
  const sharedStart = [
    { key: '', label: 'Home', href: pageUrl('', partner) },
    { key: 'about', label: 'About', href: pageUrl('about', partner) },
    { key: 'courses', label: 'Online Courses', href: pageUrl('courses', partner) },
    { key: 'registration', label: 'Registration', href: pageUrl('registration', partner) },
    { key: 'study-in-canada', label: 'Study in Canada', href: pageUrl('study-in-canada', partner) },
    { key: 'faq', label: 'FAQ', href: pageUrl('faq', partner) },
  ];

  const contextItem = partner
    ? { key: 'about-partner', label: getPartnerNavLabel(partner), href: pageUrl('about-partner', partner), isPartnerLink: true }
    : { key: 'affiliates', label: 'Affiliates', href: BRAND.mainAffiliatesHref, isPartnerLink: false };

  return [
    ...sharedStart,
    contextItem,
    { key: 'contact', label: 'Contact', href: pageUrl('contact', partner) },
  ];
}

/** Builds footer quick links and context column links for main or partner context. */
export function getFooterColumns(partner = null) {
  const quickLinks = [
    { label: 'About', href: pageUrl('about', partner) },
    { label: 'Online Courses', href: pageUrl('courses', partner) },
    { label: 'Registration', href: pageUrl('registration', partner) },
    { label: 'Study in Canada', href: pageUrl('study-in-canada', partner) },
    { label: 'FAQ', href: pageUrl('faq', partner) },
    { label: 'Contact', href: pageUrl('contact', partner) },
    { label: 'Privacy Notice', href: pageUrl('privacy', partner) },
  ];

  const contextColumn = partner
    ? {
        heading: 'Your partner',
        links: [
          { label: `About ${partner.name}`, href: pageUrl('about-partner', partner) },
          { label: 'Verify this partner', href: BRAND.mainDirectoryHref },
        ],
      }
    : {
        heading: 'Affiliate program',
        links: [
          { label: 'Become an affiliate', href: BRAND.mainAffiliatesHref },
          { label: 'Approved partners', href: BRAND.mainDirectoryHref },
        ],
      };

  return { quickLinks, contextColumn };
}
