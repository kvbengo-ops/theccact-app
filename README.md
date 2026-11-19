# CCACT affiliate sites

Work in progress. See `task.md` for ownership, status, and launch blockers. This is not ready for deployment.

Install with `npm install`, run checks with `npm test`, and build with `npm run build`. Astro produces static output in `dist/` for Cloudflare Pages. Agy owns the presentation and main-site routes; see the task board before changing shared interfaces. The homepage exists; partner routes are not yet implemented. The install reported three dependency vulnerabilities; the audit endpoint could not be reached to retrieve details, so investigate before release.

## Affiliate applications

The `/affiliate-apply/` page collects an applicant's details before account creation and submits them as a pending application. Email confirmation is disabled by owner request; a pending applicant is not an approved affiliate. Application details are also stored in the applicant's Supabase Auth metadata so a failed submission can be retried. Set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` at build time to the project's public URL and publishable/anon key; never use a service-role or secret key in either variable. Without the public settings the page displays a configuration message. The owner can sign in at `/admin/` to review applications. Affiliates sign in at `/affiliate/login/`; approved users can open `/affiliate/dashboard/`, while others see their application status. The dashboard currently displays status only; affiliate websites, profile editing, student tracking and production readiness remain incomplete.

## Partner records

Supabase is the partner source. The migration in `supabase/migrations/` is applied to the linked Ccact_project and creates the table with row-level security enabled and no public or authenticated access. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as server-side build secrets; never prefix them with `PUBLIC_` or expose them to browser code. The build currently reads and validates live records through `src/lib/partner-source.mjs` but does not yet use them to generate partner pages. With neither variable set, a local build uses an empty list; Cloudflare Pages builds fail without them. Record changes need a new build.

Each entry has `slug`, `name`, `type` (`individual` or `organisation`), `referralCode`, `bio`, `role`, `location`, `email`, `approvalDate` (YYYY-MM-DD), and `status`. Optional fields are `image` (HTTPS or a path under `/partner-images/`), `languages` and `services` (arrays of strings; at most four services), and an HTTPS `website` (organisations only). Live records also require `contentReviewedDate` and `partnerApprovedDate` (YYYY-MM-DD).

Keep slugs stable. These records contain personal information: limit source access and never deploy the JSON file itself. Published pages must expose only intended public fields. Approval dates document gates, but this file alone does not authenticate reviewers or enforce state changes. Keep a separate approval record and restrict write access.

The six states are provisional: `draft → review → preview → live`, with review/preview returning to the previous stage, `live → suspended → live`, and `live` or `suspended → retired`. Retired is terminal. CCACT must confirm the missing lifecycle diagram and authorize the review process. The `canTransition()` helper expresses this proposal; no administration interface currently enforces it.

Static public hosting does not make previews private. Use an access-controlled preview deployment before inserting partner content into a preview, and do not publish non-live records. Suspended pages must be removed and retired URLs redirected on the next deployment; this routing is not yet implemented.

## Referral and submission blockers

Do not construct referral URLs by appending an assumed query parameter. Teachable documents generated links that can contain a destination-specific path. Obtain real CCACT-generated links and verify the format and attribution before implementing the shared link component. Supabase is planned for contact, mailing-list and intake submissions; secure endpoints, access policies, recipients, notification delivery and consent handling are not configured. Keep privileged credentials server-side and test row-level security before accepting real data. Header rules alone do not implement page routes or access control. No production deployment or DNS setup has been performed.
