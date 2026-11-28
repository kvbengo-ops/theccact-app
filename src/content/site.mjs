import { pageUrl, SITE_BRAND, TEACHABLE_HOST } from '../lib/links.mjs';

/**
 * The CCES site (SITE_BRAND=cces) is the same site with CCES's name, logo, colors and facts.
 * These swaps run over the built HTML/JS (astro.config.mjs), in order, so every page and component
 * is covered without a CCES copy of each string. Keys must match the built text (apostrophes are
 * HTML-escaped there, so keep them out of keys). Facts that need whole new copy live in pages.mjs.
 */
export const CCES_REWRITES = [
  ['<html lang="en"', '<html lang="en" data-brand="cces"'],
  ['/media/hero-ccact', '/media/hero-cces'],
  ['/media/enrol-ccact', '/media/enrol-cces'],
  ['/images/chapters/', '/images/chapters/cces/'],
  ['/images/closing-', '/images/cces/closing-'],
  ['/images/courses/gerontology.webp', '/images/courses/cces/gerontology.webp'],
  ['/ccact-logo-footer.webp', '/cces-crest.png'],
  ['/ccact-logo.png', '/cces-crest.png'],
  ['The CCACT Est. 2012 Continuing Education crest', 'The CCES crest'],
  ['the South East Asian community', 'the South Asian community'],
  ['theccact@gmail.com', 'jrobles5556@rogers.com'],
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

/** Each brand's own Teachable school (TEACHABLE_HOST in links.mjs). */
export const TEACHABLE_CATALOG_URL = `https://${TEACHABLE_HOST}/l/products?sortKey=recommended&sortDirection=asc`;
// The CCACT school has no Diagnostic Modalities category; its search for "theoretical" returns exactly the 3 DM courses.
export const DM_TEACHABLE_URL = SITE_BRAND === 'cces'
  ? `${TEACHABLE_CATALOG_URL}&courseCategory=Diagnostic+Modalities`
  : `${TEACHABLE_CATALOG_URL}&search=theoretical`;

export const BRAND = {
  shortName: 'CCACT',
  fullName: 'Canadian Centre For Advanced Career Training',
  subWordmark: 'Canadian Centre for Advanced Career Training',
  taglineStatement:
    'Canadian Centre For Advanced Career Training. Continuing education for internationally educated healthcare professionals.',
  announcement: 'Registration is open 7 days a week, 24 hours a day',
  logoSrc: '/ccact-logo.png',
  logoWidth: 347,
  logoHeight: 349,
  logoAlt: 'The CCACT Est. 2012 Continuing Education crest',
  contactEmail: 'theccact@gmail.com',
  contactPhone: 'WhatsApp / Text: +1 416-893-8158',
  copyright: '© 2026 Canadian Centre For Advanced Career Training (CCACT). All rights reserved.',
  mainAffiliatesHref: '/affiliates/',
  // ponytail: directory hidden for now. To show it: set '/affiliates/directory/', rename src/pages/affiliates/_directory.astro
  // back to directory.astro, and point /partners in public/_redirects at it.
  mainDirectoryHref: null,
};

export const HOME_HERO = {
  eyebrow: 'Continuing education · Est. 2012',
  headlineLine1: 'Your experience matters.',
  headlineLine2: 'Build your next chapter.',
  lead: 'The Canadian Centre For Advanced Career Training offers more than 50 online continuing education courses designed to support internationally trained professionals, with a special focus on the South East Asian community.',
  primaryCtaLabel: 'Explore courses',
  secondaryCtaLabel: 'Find your starting point',
  accountNote: 'Creating an account does not enroll you in a course or result in any charge.',
  whyTitle: 'Why study with CCACT',
  whyPoints: [
    'Immediate access upon enrollment',
    '100% online, study anywhere, anytime',
    'Built around Canadian healthcare standards',
    'Certificate of Completion for listed courses',
  ],
};

/** Signature scroll story. Copy restates verified facts from the About, FAQ and Registration pages only. */
export const HOME_STORY = {
  statementLine1: 'You bring the experience.',
  statementLine2: 'We help you keep learning.',
  chapters: [
    {
      id: 'experience',
      label: 'Your experience',
      title: 'Built for professionals trained around the world',
      body: 'Our certificate and review courses are designed for internationally educated nurses, practical nurses, Personal Support Workers and caregivers who want to keep growing.',
      image: '/images/chapters/experience',
      alt: 'Illustrative photo: two nurses in navy scrubs standing together in a bright hospital corridor.',
    },
    {
      id: 'learning',
      label: 'Your learning',
      title: 'Online, self-paced, on your schedule',
      body: 'Study from anywhere with immediate access on enrollment. Courses are built around Canadian healthcare standards and best practices.',
      image: '/images/chapters/learning',
      alt: 'Illustrative photo: handwritten study notes beside a laptop on a sunlit table.',
    },
    {
      id: 'next',
      label: 'Your next chapter',
      title: 'Confidence for Canadian care settings',
      body: 'A Certificate of Completion is issued for listed courses. These are continuing-education courses: they support your development but do not grant a license, diploma or immigration status.',
      image: '/images/chapters/next',
      alt: 'Illustrative photo: three nurses talking together as they walk down a bright care facility corridor.',
    },
  ],
};

/** Course explorer interest filters, mapped to HOME_PROGRAMMES ids. "All programs" always shows every category. */
export const HOME_INTERESTS = [
  { id: 'all', label: 'All programs', programmes: ['gerontology', 'crner', 'chs', 'hpc', 'dm', 'esl'] },
  { id: 'canadian', label: 'Canadian healthcare', programmes: ['chs', 'dm'] },
  { id: 'review', label: 'Nursing review', programmes: ['crner'] },
  { id: 'older', label: 'Older adult care', programmes: ['gerontology', 'hpc'] },
  { id: 'communication', label: 'Communication', programmes: ['esl'] },
];

export const HOME_COURSES_INTRO = {
  heading: 'Online courses',
  lead: 'A Certificate of Completion is issued upon successful completion for all courses listed below unless otherwise noted.',
  allCoursesLabel: 'Browse all courses on Teachable',
};

/**
 * Six homepage program cards anchored to Main.dc.html and verified live Teachable URLs.
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
    ctaLabel: 'Browse & enroll',
    teachableUrl:
      `${TEACHABLE_CATALOG_URL}&courseCategory=Gerontology+Nursing`,
  },
  {
    id: 'crner',
    code: 'CRNER 101–107',
    title: 'Canadian Registered Nurse Exam Review',
    blurb:
      'Exam writing techniques, competency categories and comprehensive practice exam guides for the Canadian Nursing Exam.',
    meta: '7 courses · practice exams',
    ctaLabel: 'Browse & enroll',
    teachableUrl:
      `${TEACHABLE_CATALOG_URL}&courseCategory=Canadian+Nursing+Exam+Review`,
  },
  {
    id: 'chs',
    code: 'CHS 101–104',
    title: 'Canadian Health Care System',
    blurb:
      'Canadian standards and regulations in health care, including ethics, informed consent and the nurse–client relationship.',
    meta: '4 courses · bundle CAD $149',
    ctaLabel: 'Browse & enroll',
    teachableUrl:
      `${TEACHABLE_CATALOG_URL}&courseCategory=Canadian+Health+Care+System`,
  },
  {
    id: 'hpc',
    code: 'HPC 101–102',
    title: 'Hospice & Palliative Care',
    blurb:
      'Compassionate end-of-life care within the Canadian healthcare context, covering ethics and symptom management.',
    meta: '2 courses · bundle available',
    ctaLabel: 'Browse & enroll',
    // No Teachable category exists for HPC; the catalog search returns exactly HPC-101, HPC-102 and the bundle.
    teachableUrl:
      `${TEACHABLE_CATALOG_URL}&search=hospice`,
  },
  {
    id: 'dm',
    code: 'DM 101–103',
    title: 'Diagnostic Modalities',
    blurb:
      'Theoretical foundations for electrocardiography, phlebotomy and peripheral intravenous therapy initiation.',
    meta: '3 courses · theory only',
    ctaLabel: 'Browse & enroll',
    teachableUrl:
      DM_TEACHABLE_URL,
  },
  {
    id: 'esl',
    code: 'ESL',
    title: 'English Communication Skills',
    blurb:
      'Professional English for healthcare settings, patient-centered communication, documentation and CELPIP preparation.',
    meta: '7 modules · expanding',
    ctaLabel: 'Join mailing list',
    internalPage: 'contact',
  },
];

export const CONTINUING_EDUCATION_NOTICE = {
  heading: 'Continuing education notice',
  body: 'CCACT offers online continuing-education, review, and professional-development courses. These courses do not provide a diploma or degree and do not lead directly to professional licensing or registration in Canada. They are designed to strengthen knowledge, practical understanding, and confidence while supporting personal and professional development.',
  partnerNotice:
    'CCACT and its authorized affiliates cannot guarantee employment, admission, licensing, professional registration, or immigration results. Course enrollment and tuition payment occur directly with CCACT on Teachable; affiliates never collect tuition.',
  directoryNotice:
    'Authorized CCACT affiliates introduce prospective students to CCACT programs and never collect tuition. All course enrollment and payment is completed directly with CCACT through Teachable, and no affiliate can guarantee employment, licensing, professional recognition, or immigration outcomes.',
};

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
 * Builds the primary header navigation list. Affiliate sites keep their own routes and show
 * no Affiliates link (the affiliate's profile is reached from the strip under the header).
 */
export function getPrimaryNavItems(partner = null) {
  return [
    { key: '', label: 'Home', href: pageUrl('', partner) },
    { key: 'about', label: 'About', href: pageUrl('about', partner) },
    { key: 'courses', label: 'Online Courses', href: pageUrl('courses', partner) },
    { key: 'registration', label: 'Registration', href: pageUrl('registration', partner) },
    { key: 'study-in-canada', label: 'Study in Canada', href: pageUrl('study-in-canada', partner) },
    { key: 'faq', label: 'FAQ', href: pageUrl('faq', partner) },
    ...(partner ? [] : [{ key: 'affiliates', label: 'Affiliates', href: BRAND.mainAffiliatesHref }]),
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
        heading: 'Your affiliate',
        links: [
          { label: `About ${partner.name}`, href: pageUrl('about-partner', partner) },
          { label: 'Verify this affiliate', href: BRAND.mainDirectoryHref },
        ].filter((link) => link.href),
      }
    : {
        heading: 'Affiliate program',
        links: [
          { label: 'Affiliate program', href: BRAND.mainAffiliatesHref },
          { label: 'Approved affiliates', href: BRAND.mainDirectoryHref },
        ].filter((link) => link.href),
      };

  return { quickLinks, contextColumn };
}
