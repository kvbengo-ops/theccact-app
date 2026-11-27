// Learning-site identity (build time only; import from .astro frontmatter).
import { SITE_BRAND } from '../lib/links.mjs';

export const PLATFORM_NAME = 'Learning Portal'; // placeholder until the owner picks a name

// ponytail: theccact.com still serves the old AWS site (checked 2026-11-27); swap to https://theccact.com once its DNS points at Netlify.
export const WEBSITE = SITE_BRAND === 'cces' ? 'https://thecces.com' : 'https://theccact.netlify.app';

// Free test-checkout course per brand (created in Supabase; self_enroll).
export const SAMPLE_COURSE_ID = SITE_BRAND === 'cces' ? '5a3b1e00-0000-4000-8000-000000000401' : '5a3b1e00-0000-4000-8000-000000000301';
