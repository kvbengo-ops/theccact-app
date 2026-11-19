/**
 * LOCAL FIXTURES ONLY — FOR COMPONENT TESTING AND VISUAL CHECKS.
 * NEVER import into `src/pages/` or treat as approved partner data (`src/data/partners.json`).
 */
export const FIXTURE_INDIVIDUAL_PARTNER = {
  slug: 'maria-santos',
  name: 'Maria Santos',
  type: 'individual',
  bio: 'Maria is a sample fixture individual partner used only to test individual About [Partner] layout rendering and optional image fallback.\n\nThis record is strictly for local verification and never appears in production.',
  role: 'Registered Nurse & Mentor',
  location: 'Toronto, Canada',
  languages: ['English', 'Tagalog'],
  services: [
    'Introducing internationally trained nurses to CCACT continuing education',
    'Explaining course structure and open online enrolment',
  ],
  email: 'fixture-private-do-not-render@example.invalid',
  approvalDate: '2026-11-20',
  status: 'live',
  contentReviewedDate: '2026-11-20',
  partnerApprovedDate: '2026-11-20',
  isFixture: true,
};

export const FIXTURE_LONG_ORGANISATION_PARTNER = {
  slug: 'northbridge-international-healthcare-recruiting',
  name: 'Northbridge International Healthcare Recruiting & Career Advisory Corp.',
  type: 'organisation',
  bio: 'Northbridge International is a sample fixture organisation used strictly to verify organisation profile layouts, long name wrapping, HTTPS external website linking, and service truncation caps.\n\nAll course enrolment occurs exclusively on Teachable.',
  role: 'Healthcare Recruitment Agency',
  location: 'Vancouver, Canada',
  contactName: 'Dr. Priya Nair (Fixture Contact)',
  website: 'https://example.org/northbridge-fixture',
  languages: ['English', 'Hindi', 'Punjabi'],
  services: [
    'Program information for healthcare professionals',
    'Overview of CCACT self-paced courses',
    'Direction to approved CCACT online enrolment links',
    'Guidance to official CCACT FAQ & advisors',
    'Extra item 5 — verified capped at 4',
  ],
  email: 'fixture-org-private-do-not-render@example.invalid',
  approvalDate: '2026-11-20',
  status: 'live',
  contentReviewedDate: '2026-11-20',
  partnerApprovedDate: '2026-11-20',
  isFixture: true,
};
