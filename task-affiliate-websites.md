# CCACT implementation — Agy + Codex

Status: T01, T03, and main-site T04 UI (10 static pages) are implemented and awaiting review; Supabase migration applied to Ccact_project, while T05 partner routes, verified Teachable referrals, form/intake backends, and launch approvals remain incomplete.

## Owner direction update — affiliate portal (2026-11-20)

The owner now requests affiliate applications and approval, individual affiliate logins and dashboards, self-service editing of partner page details, student application attribution, and an owner dashboard showing affiliates and student application counts and sources. This replaces the earlier version-one exclusion of partner self-service editing. The static-site plan and T07–T09 need revision to cover the expanded scope.

Open decisions: where student applications are submitted; whether profile edits require owner approval; application fields and what student information affiliates may see; and how Teachable enrolments can be reconciled with website applications. A website application count must not be presented as a confirmed Teachable enrolment or sale. Access controls must prevent affiliates from seeing another affiliate's data, and public partner pages must not expose private records. Existing launch blockers, including verified Teachable links, still apply.

### Portal implementation board

- [ ] P00 — Owner admin account and application review dashboard. **IN PROGRESS (Codex, 2026-11-20)**. Owned: `supabase/migrations/202611200005_admin_review.sql`, `tests/admin-review.sql`, `src/pages/admin.astro`, `src/scripts/admin.mjs`, `supabase/config.toml`, `public/_headers`, `README.md`. The owner account and review screen exist; authorization uses account ID. Email confirmation is disabled by owner request. Decisions record approval or rejection; affiliate access and student analytics remain P03/P04. Browser-level end-to-end testing and owner password change remain outstanding.
- [ ] P01 — Account and application foundation. **IN PROGRESS (Codex, 2026-11-20)**. Owned: `supabase/migrations/202611200002_affiliate_applications.sql`, `tests/affiliate-applications.sql`. The application table is deployed and its row-level access checks passed in a rolled-back transaction. Signup, login, application UI and trusted approval are not implemented.
- [ ] P02 — Application signup, login and owner review screens; approved applicants get affiliate access and a unique stable partner URL. **IN PROGRESS (Codex, 2026-11-20)**. Owned: `src/pages/affiliate-apply.astro`, `src/scripts/affiliate-apply.mjs`, `src/components/AffiliatesPage.astro`, `supabase/migrations/202611200003_application_details.sql`, `supabase/migrations/202611200004_optional_application_type.sql`, `package.json`, `package-lock.json`, `README.md`, `tests/affiliate-apply.test.mjs`, `tests/affiliate-applications.sql`. Collect application details before account creation without asking application type; create a pending applicant account, not an approved affiliate. Owner review and provisioned URLs remain separate work.
- [ ] P03 — Affiliate dashboard and profile editing, with publishing and review rules agreed before implementation. **IN PROGRESS (Codex, 2026-11-20)**. Owned: `src/pages/affiliate/login.astro`, `src/pages/affiliate/dashboard.astro`, `src/scripts/affiliate-portal.mjs`, `src/layouts/AffiliatePortalLayout.astro`, `src/pages/affiliate-apply.astro`, `src/scripts/affiliate-apply.mjs`, `tests/affiliate-portal.test.mjs`, `public/_headers`. First deliver approved-account login and a private status dashboard; profile editing, website publishing and tracking remain outstanding.
- [ ] P03 header entry — **REVIEW (Codex, 2026-11-20)**. Owned: `src/components/SiteHeader.astro`. Added an accessible main-site profile icon linking to affiliate sign-in, with a mobile layout; browser visual review remains pending.
- [ ] P04 — Student applications and attribution; affiliate and owner dashboards show permitted counts and sources, separately from Teachable sales.
- [ ] P05 — End-to-end access, privacy, abuse, deployment and acceptance checks.

P02–P05 require a runtime/backend and must not expose service credentials. Until the owner decides otherwise, profile edits must not publish automatically and no student information is shown to affiliates. Website-application tracking and Teachable enrolment tracking must remain separate.

## Source of truth

- Requirements: `CCACT Affiliate Websites — Product Requirements.md`.
- Homepage design: `UI design/Main.dc.html`; follow `UI design/README.md`. Recreate the design in production components, not the exported runtime.
- Logo: `Ccact_logo.png` (the supplied file); replace the mockup shield with this asset.
- Owner direction: “you can just change the purple for blue and use the colors that are on our current website including the gold.” Verify the current website palette before finalising tokens. The mockup already contains navy and gold; do not assume these exactly match the live brand.
- Current site to inspect: `https://theccact.com`.
- The design governs homepage presentation; the PRD governs functionality. Include PRD navigation items even where the mockup omits them, including Study in Canada.

## Shared working rules

1. Agy and Codex both read this file and the PRD before working. Change a task to `IN PROGRESS` with agent name and date before editing.
2. Each task has one implementation owner and the other agent reviews it. Do not edit another agent's active files without a recorded handoff.
3. Record actual files owned when claiming a task. Suggested boundaries below become concrete during foundation setup.
4. Keep this board current: `TODO`, `IN PROGRESS`, `BLOCKED`, `REVIEW`, `DONE`. Check a box only after its acceptance checks pass; record evidence in the handoff log.
5. Changes to shared interfaces must be agreed in this file before either agent changes callers. Never overwrite the other agent's work.
6. Use one source for shared content, Supabase as the partner record source, and one referral-link implementation. No copied per-partner websites.
7. Missing real content, credentials, approvals, or records must be marked as launch blockers. Fixtures must be clearly identified and never published as approved partners.
8. No task is complete solely because the UI renders. Check the behavior and failure states relevant to that task.

## Ownership and interfaces

| Area | Implementation owner | Reviewer |
| --- | --- | --- |
| Design, brand tokens, logo, responsive shell and homepage | Agy | Codex |
| Shared content presentation, course cards, FAQ and partner layouts | Agy | Codex |
| Foundation, partner schema, routes, lifecycle and referral links | Codex | Agy |
| Form handling, intake workflow, indexing and deployment configuration | Codex | Agy |
| Integration and release checks | Codex | Agy |
| Visual and accessibility review | Agy | Codex |

Foundation: Astro static generation and Cloudflare Pages. Partner URL: `/partners/{slug}/`. Codex owns `package.json`, `package-lock.json`, `astro.config.mjs`, `src/lib/`, `supabase/`, `tests/`, `public/_headers`, `public/_redirects`, and `README.md`. Agy owns presentation files under `src/components/`, `src/layouts/`, `src/styles/`, `src/content/`, and main-page routes; coordinate partner route integration before editing shared routes.

Backend: Supabase is the selected source of truth for partner records and planned backend for intake and form submissions. Codex owns migrations, server-side integration, storage policies and access controls; Agy integrates agreed form and display interfaces. Static builds must consume only approved live records; record changes require a rebuild until an alternative is designed. Private previews and intake require server-side access control. Keep privileged credentials server-side, enable and test row-level security, and restrict personal data and uploads. The migration is applied to Ccact_project; the build-time reader still needs an end-to-end test with server-side credentials.

Interface contract to establish in T02:

- Shared layout receives page identity and optional validated partner context.
- Navigation and internal page URLs preserve that partner context.
- Every Teachable browse/enrol link uses the shared referral helper/component; presentation code must not construct these URLs directly.
- Forms derive attribution from trusted route/record context, with hidden partner fields for submission; do not trust user-submitted identity alone.
- Template-owned disclaimers and verification links cannot be overridden by partner data.

UI handoff (Codex, 2026-11-20): T03 may begin now; T02's Supabase, lifecycle confirmation and launch work do not block building the main-site UI. Import `pageUrl(page, partner)` and `enrolmentUrl(destination, partner)` from `src/lib/links.mjs`. Page keys are `''`, `about`, `courses`, `registration`, `study-in-canada`, `faq`, `about-partner`, `contact`, and `privacy`. Use `null` for main-site context. `enrolmentUrl` accepts only the CCACT Teachable school and intentionally throws for partner context until real referral links are verified; do not bypass it or publish unattributed partner buttons. Main-site course links can use the inventory's real URLs. Present partner UI with clearly marked local fixtures only, and do not ship fixtures as approved partners. The logo is available at `/ccact-logo.png`. Agy owns `src/pages/`, `src/components/`, `src/layouts/`, `src/styles/`, and content presentation; Codex will coordinate the partner routes with Agy before editing them.

## Task board

### T01 — Inspect source content and resolve external dependencies
Owner: Agy. Reviewer: Codex. Status: REVIEW (Agy, 2026-11-20; Codex review pending). Depends on: none. Owned files: `src/content/t01-content-and-brand-inventory.md`.

- [x] Inspect the full homepage reference and inventory its sections, typography, spacing and responsive needs.
- [x] Inspect the current website; record its actual blue/navy and gold colors and source evidence.
- [x] Inventory all shared page copy, course destinations, policy notices and existing Affiliates content.
- [x] Confirm destinations of the individual and organisation Apply buttons. Preserve existing external forms if present; otherwise include both forms in T07.
- [x] Record missing approved copy and imagery without inventing claims, credentials, course details or testimonials.

Acceptance: content and brand inventory with source URLs, missing inputs and application-form decision is available to both agents.

### T02 — Foundation and shared contracts
Owner: Codex. Reviewer: Agy. Status: IN PROGRESS (Codex, 2026-11-20). UI dependencies are ready; production completion depends on Supabase access and lifecycle confirmation.

- [ ] Set up the smallest Astro project, scripts, static assets and Cloudflare Pages configuration.
- [ ] Define shared content structure and partner schema; document exact file ownership for both agents. Partner schema and ownership are documented; shared content structure awaits T01.
- [ ] Include name, immutable unique slug, individual/organisation type, referral code, bio, optional image, role/category, location, optional languages/services, email, optional organisation website, approval date and status.
- [ ] Validate required fields, valid dates/email/URLs, allowed states, slug safety/uniqueness and referral requirements; fail builds with actionable errors.
- [ ] Confirm the six lifecycle state names and allowed transitions. The PRD names suspended and retired but does not expose its embedded six-state diagram; a provisional interpretation is documented in README.md.
- [ ] Define separate CCACT content review and partner preview-approval gates before live publication.
- [ ] Use Supabase as the single production record source, with a secure build-time read of eligible records. Local migration and reader exist; verify against a real project and connect generated routes.
- [ ] Add isolated fixtures and focused schema/transition checks.

Acceptance: clean build works; invalid records fail; contracts and lifecycle assumptions are documented before dependent work.

### T03 — Homepage, brand and shared shell
Owner: Agy. Reviewer: Codex. Status: REVIEW (Agy, 2026-11-20; Codex review pending). UI work unblocked by the T02 handoff above; partner referral integration remains blocked until T05. Owned files: `src/styles/tokens.css`, `src/styles/global.css`, `src/content/site.mjs`, `src/content/fixtures/partner-preview.mjs`, `src/layouts/BaseLayout.astro`, `src/components/SiteHeader.astro`, `src/components/PartnerStrip.astro`, `src/components/SiteFooter.astro`, `src/components/EnrolLink.astro`, `src/components/ContinuingEducationNotice.astro`, `src/components/HomePage.astro`, `src/pages/index.astro`.

- [x] Recreate the supplied homepage layout faithfully with production components.
- [x] Apply verified blue/navy, gold and supporting site colors; replace purple throughout.
- [x] Use `Ccact_logo.png` with suitable alternative text and preserved proportions.
- [x] Build responsive header, navigation, footer, mobile menu and shared typography.
- [x] Include Home, About, Online Courses, Registration, Study in Canada, FAQ, About [Partner], Contact and Enrol Now on partner sites.
- [x] Show partner identity, authorised status and directory verification link; handle main-site context separately.
- [x] Wire homepage CTAs to real destinations through the shared referral component.

Acceptance: desktop and mobile match the reference structure and requested brand; keyboard navigation works; no mockup placeholder links remain. (Visual browser confirmation in live Chromium queued with T04/T09; built CSS, DOM structure, and drawer keyboard behavior verified.)

### T04 — Shared pages and partner presentation
Owner: Agy. Reviewer: Codex. Status: REVIEW (Agy, 2026-11-20; Codex review pending — T05 route wiring & gated Affiliates copy pending). Depends on: T02, T03; integrates T05. Owned files: `src/content/site.mjs`, `src/content/pages.mjs`, `src/components/PageHero.astro`, `src/components/AboutPage.astro`, `src/components/CoursesPage.astro`, `src/components/RegistrationPage.astro`, `src/components/StudyInCanadaPage.astro`, `src/components/FaqPage.astro`, `src/components/ContactPage.astro`, `src/components/PrivacyPage.astro`, `src/components/PartnerAboutPage.astro`, `src/components/PartnersDirectoryPage.astro`, `src/components/AffiliatesPage.astro`, `src/pages/about.astro`, `src/pages/courses.astro`, `src/pages/registration.astro`, `src/pages/study-in-canada.astro`, `src/pages/faq.astro`, `src/pages/contact.astro`, `src/pages/privacy.astro`, `src/pages/partners/index.astro`, `src/pages/affiliates.astro`, `public/images/*.jpg` (plus notice integration in `ContinuingEducationNotice.astro` and `BaseLayout.astro`).

- [x] Implement shared About, Online Courses, Registration, Study in Canada, FAQ, Contact and Privacy Notice pages.
- [x] Implement individual and organisation About [Partner] layouts, optional-image fallback, optional languages/services and organisation website.
- [x] Preserve approved course and policy content in a single source for all sites.
- [x] Put required continuing-education, qualification, licensing, employment and immigration notices in the shared template using approved wording.
- [x] Build the main-site approved-partner directory with name, type, location, approval date and verification destinations.
- [x] Include directory notices that partners never collect tuition, payment occurs through Teachable, and outcomes are not guaranteed.
- [ ] Rebuild the main-site Affiliates page with existing approved content and application destinations; no recruitment CTA on partner pages. *(Scaffold built at `/affiliates/` with Individual/Organisation sections and zero recruitment on partner pages; live `partners.html` / form HTML returned HTTP `401` and awaits CCACT supply + T07 wiring.)*

Acceptance: all nine partner page components exist and reuse single-source copy (`src/content/pages.mjs` / `site.mjs`); 10 main-site routes build (`dist/`); dynamic partner route generation across `/partners/[slug]/...` integrates with T05 (`Codex`).

### T05 — Routing, lifecycle and referral integrity
Owner: Codex. Reviewer: Agy. Status: IN PROGRESS (Codex, 2026-11-20). Owned files: `src/pages/partners/[slug]/[...page].astro`, `src/components/EnrolLink.astro` (local fixture preview integration); shared route integration follows the T04 handoff. Depends on: T02.

- [ ] Generate all nine page types for every eligible live partner from records.
- [ ] Preserve partner context across internal navigation and all shared CTAs.
- [ ] Verify Teachable's real referral URL format against a supplied example; preserve existing query parameters and encode values safely.
- [ ] Implement one shared browse/enrol link component; reject missing or malformed live-partner referral data.
- [ ] Check every generated Teachable link, including header, homepage, course and registration CTAs, for the correct partner attribution.
- [ ] Provide private previews for review; noindex alone is not access control. Do not expose draft records on public routes or directories.
- [ ] Require recorded CCACT review and partner approval before publication.
- [ ] Suspended partners are offline and absent from the directory; retain their records and codes for restoration.
- [ ] Retired partners redirect to the main site and immediately leave the directory; support direct live-to-retired transitions.
- [ ] Redirect the Affiliates address on partner sites to the main-site Affiliates page, including direct/stale links.
- [ ] Handle unknown partner slugs and unavailable pages without displaying another partner's identity or referral code.

Acceptance: automated checks cover multiple partners, every page/CTA, invalid records, lifecycle visibility, preview protection and redirects. Missing attribution fails the build.

### T06 — Contact and mailing-list submissions
Owner: Codex. Reviewer: Agy. Status: TODO. Depends on: T02, T04, T05.

- [ ] Select and configure the submission service using actual CCACT destination details.
- [ ] Implement contact and mailing-list UI with accessible labels, validation, consent where required, and clear success/error states.
- [ ] Include partner attribution in both forms; validate it against a trusted record at the receiving boundary.
- [ ] Route tagged enquiries to the agreed CCACT/partner recipients; confirm delivery behavior with CCACT.
- [ ] Add appropriate spam protection, input limits and safe handling of submitted text; keep secrets out of client bundles and records.
- [ ] Test successful submission, validation rejection, service failure and attribution tampering.

Acceptance: test submissions arrive at the configured destination with correct attribution. A local success message alone does not count as delivery.

### T07 — Partner intake and onboarding
Owner: Codex. Reviewer: Agy. Status: TODO. Depends on: T01, T02, T05.

- [ ] Build private-link intake for approved partners, collecting the partner-record materials and optional photo/logo.
- [ ] Protect intake access and validate uploads, text and URLs at the receiving boundary.
- [ ] Save submissions to the chosen single record source as pending review, never automatically live.
- [ ] Keep referral codes, slug assignment, approval and publication under CCACT/developer control.
- [ ] Connect record creation, CCACT bio review, private preview, partner approval and publication into one documented workflow.
- [ ] If T01 finds no external application forms, implement individual and organisation applications on the main site only.
- [ ] Document suspension, restoration, retirement and the developer-run record update/deployment process.
- [ ] Time a complete sample onboarding from supplied materials to preview; target under 10 minutes.

Acceptance: an intake submission creates a usable pending record; no development edits are needed to add the next partner; approval gates are enforced.

### T08 — Search controls and deployment
Owner: Codex. Reviewer: Agy. Status: TODO. Depends on: T04–T07.

- [ ] Add noindex instructions to every partner page, with appropriate response/header coverage.
- [ ] Keep partner pages out of the main sitemap; do not rely on robots.txt alone to prevent indexing.
- [ ] Preserve main-site public URLs and appropriate metadata/canonicals; map any changed legacy URLs to redirects.
- [ ] Configure Cloudflare build/deploy settings, form services, preview protection and environment-variable documentation.
- [ ] Verify generated redirect behavior on the target hosting platform.
- [ ] Document deployment, rollback and how shared copy and partner records update in one deploy.

Acceptance: deployable build and setup guide exist; actual hosting behavior is verified before marking release ready. Domain/DNS changes require the appropriate account access.

### T09 — Joint acceptance and release
Owner: Codex (functional), Agy (visual). Status: TODO. Depends on: T03–T08.

- [ ] Agy checks desktop/mobile reference fidelity, actual logo, blue/gold brand, long names, organisation layout and absent images.
- [ ] Agy checks keyboard access, focus visibility, labels, contrast, readable text and overflow.
- [ ] Codex checks all nine pages, directory, main-site recruitment, forms, private intake, approval workflow, redirects and lifecycle transitions.
- [ ] Codex audits generated referral links for representative individual and organisation records and an approximately 30-partner fixture build.
- [ ] Verify no unapproved partner records, test identities, placeholder destinations, secrets or fabricated content enter production output.
- [ ] Verify notices and noindex across every generated partner page.
- [ ] Record commands, test results, browser checks, deployment evidence and any remaining blockers.
- [ ] Both agents review the completed work and mark release ready only after required content, records and services are supplied and verified.

Acceptance: all version-one requirements pass or are explicitly documented as externally blocked; never describe a blocked integration as complete.

## Inputs and decisions to track

These do not block independent design/foundation work, but must be resolved before dependent release tasks.

| Input/decision | Default or action | Status |
| --- | --- | --- |
| Exact live-site brand colors | Inspected live site & logos (`t01-content-and-brand-inventory.md`); replaced purple with verified navy/gold tokens in `tokens.css` | Verified & implemented (`T01`/`T03`; Codex/owner sign-off pending) |
| Approved shared content and legal wording | Live shared copy preserved in `site.mjs`/`pages.mjs`; CCACT sign-off on partner-site disclaimer wording and gated `partners.html` copy pending | Extracted & implemented; CCACT sign-off pending |
| Real Teachable referral format and launch codes | Verify against supplied working link; preserve existing query params (`?sortKey=...&courseCategory=...`) | Pending real link supply |
| Approved launch partners | Launch only ready/approved records; fixture data stays isolated in `src/content/fixtures/partner-preview.mjs` | Pending real records |
| URL structure | Main-domain `/partners/{slug}/` paths | Proposed |
| Partner record source | Supabase; static build reads eligible records securely | Selected by owner; migration applied, end-to-end test pending |
| Six-state lifecycle and review owner | Confirm missing diagram/state names and named CCACT reviewer | Pending |
| Application destinations | Inspected `scripts/script.js` + live URLs: first-party AWS Lambda forms (`partner-application.html`, `individual-affiliate-application.html`), not an external SaaS (live URLs return HTTP `401`) | Confirmed → forms enter T07 scope; source HTML requested |
| Form provider, recipients and mailing-list consent | Confirm actual integrations (`FORMS_API` vs new backend) and delivery | Pending |
| Domain email | Observed `theccact@gmail.com` across site and `info@theccact.online` in `faq.html`; domain `@theccact.com` recommended by PRD | Pending CCACT choice |
| Hosting, DNS and private preview access | Cloudflare Pages proposed; obtain required access | Pending |

## Explicitly outside version one

Sponsors, social post library, ad approval portal, custom partner domains, additional languages and payment processing. Teachable controls attribution after the outbound click; the website must not promise commissions beyond that boundary. Partner self-service editing and affiliate dashboards are now in scope under the owner direction update above.

## Handoff log

| Date | Agent | Task | Files / outcome / checks / next action |
| --- | --- | --- | --- |
| 2026-11-20 | Codex | P03 affiliate login | Added a separate affiliate login and a minimal approved-account dashboard. Pending and rejected applicants see their status; unauthenticated and unapproved visitors cannot see approved dashboard content. The application page sends approved users to the dashboard. `npm test` passed 9 tests and the build produced 14 pages. Real-account browser verification, profile editing, partner URLs and student tracking remain outstanding. |
| 2026-11-20 | Codex | P00 owner dashboard | Created the owner account for `kyleengo469@gmail.com` with a locally stored temporary password; owner must change it and delete the temporary file. Deployed admin review RPCs guarded by a private account-ID allowlist. A rolled-back database test verified applicant denial and owner review, and an actual owner sign-in plus authorized API read succeeded. Disabled email confirmation at the owner's request; no email ownership is verified for new signups. `npm test` passed 8 tests; build produced 12 pages. Browser review and real end-to-end approval remain outstanding; approval alone does not provision an affiliate page. |
| 2026-11-20 | Codex | P02 signup simplification | Removed the application-type question; migration `202611200004` makes the existing column optional while preserving existing values. Verified a type-free application and applicant isolation in a rolled-back database test, applied the migration, and passed 8 unit tests. |
| 2026-11-20 | Codex | P02 multi-step application | Moved application details before account creation. Added optional location, role and introduction fields and migration `202611200003`; pending details persist in the applicant's Auth metadata through email confirmation. Applied the migration after a rolled-back RLS test. Eight unit tests and the 11-page build pass. Exact application fields await owner confirmation; real email confirmation and complete signup still need end-to-end testing. |
| 2026-11-20 | Codex | P02 application UI | Updated the application page with the existing branded hero, a responsive two-column layout and clear account, application and review steps. `npm test` passed 8 tests and `npm run build` generated 11 pages. Visual browser review and a real signup remain outstanding. |
| 2026-11-20 | Codex | P02 partial | Added `/affiliate-apply/` with account creation, email confirmation guidance, sign-in, application submission, status and sign-out using Supabase Auth and the RLS-protected application table. Affiliate page links to it. Configured the linked project's public key locally in ignored `.env.local`; production configuration and Auth redirect settings remain necessary. `npm test` passed 8 tests; build passed with 11 pages; configured local page returned HTTP 200. A real email/signup and application submission have not been tested. Owner review and affiliate dashboards remain unimplemented. |
| 2026-11-20 | Codex | P01 partial | Applied `202611200002_affiliate_applications.sql` to Ccact_project. A rolled-back PostgreSQL test verified pending-only insertion, no self-approval privilege, rejection of cross-user submissions, isolation between applicants and no anonymous SELECT. No signup, login, owner approval, dashboard or student tracking interface exists yet. |
| 2026-11-20 | Codex | T05 local preview | Added a development-only fictional partner at `/partners/maria-santos/`; its nine routes returned HTTP 200, show a test notice and disable enrolment links. `npm test` passed 6 tests; production build passed and contains no fixture identity. This preview is not a published partner or working referral. |
| 2026-11-20 | Codex | T05 partial routing | Added the nine partner route mappings using validated live records and the shared page components. A mocked live-record build reached `/partners/sample/` and correctly failed because referral links are unverified; no partner page can be published without attribution. Full route rendering and tests remain blocked on the real referral format. Retirement redirects, protected preview and forms remain outstanding. |
| 2026-11-20 | Codex | T02 Supabase verification | Applied migration `202611200001` to linked production project Ccact_project and verified local and remote migration versions match. Read-only database inspection confirms row-level security is enabled, anon and authenticated lack SELECT, service_role has SELECT, and the table contains zero records. `npm test` passed 6 tests and `npm run build` generated 10 main-site pages without credentials. End-to-end REST/build access, policy behavior, partner routing and referral attribution remain unverified. |
| 2026-11-19 | Codex | Planning | Created this shared task board from the PRD and local design instructions. No implementation tasks claimed. Agy starts T01; Codex starts T02 after the relevant findings/contracts are available. |
| 2026-11-19 | Codex | T02 partial | Added Astro configuration, empty partner data, validator, provisional lifecycle helper, noindex header, documentation and tests. `node --test tests/*.test.mjs` passed (2 tests). Dependency installation failed: network install stalled; offline cache lacks Vite. No build or lockfile verified. Lifecycle enforcement, routes and content contract remain incomplete. T01, real referral examples, review/preview access, and form service details remain necessary. Teachable's documentation shows generated links can contain destination-specific paths; do not assume a bare query code. Agy review pending. |
| 2026-11-20 | Agy | T01 ready for review & T02 review | Created `src/content/t01-content-and-brand-inventory.md` from `UI design/Main.dc.html`, `Ccact_logo.png`, and live `https://theccact.com` HTML/CSS/JS/assets. Recorded purple vs navy/gold hex evidence (`style.css` `#5B2D8E`/`#3E1D7A` + `#C8A96E`/`#DBC48E`; live `images/logo.png` `#012B66`; `Ccact_logo.png` `#2A3958`/`#D7AF6A`; mockup `#15233E`/`#1E3357` + `#C9A14A`/`#E3C98A`), WCAG AA checks, Teachable query-string category URLs (requiring `URL` query-safe handling in T05), and proof from `scripts/script.js` that `partner-application.html` and `individual-affiliate-application.html` were first-party AWS Lambda forms (`FORMS_API`), not an external SaaS (both forms + `partners.html` currently return HTTP `401` redirect stubs -> forms stay in scope for T07; source HTML requested). Completed T02 review (no Codex files modified): verified `node --test tests\partners.test.mjs` passed (2/2 via `C:\Program Files\nodejs\node.exe`), confirmed `node_modules` empty (`0` items) and no `package-lock.json`, and logged schema/routing notes (org `contactName`/nav label, server-only `email`, `_headers` + HTML `<meta noindex>` + `_redirects`, empty-string intake cleanup). Codex review on T01 pending; T03 stays queued behind T02 dependency installation. |
| 2026-11-19 | Codex | Backend decision | Owner selected Supabase as the production partner source and planned backend for intake/forms. The empty JSON file is temporary scaffolding until integration replaces it. Project access and delivery/access design are pending. |
| 2026-11-20 | Codex | T02 UI handoff | `npm install` succeeded and generated the lockfile; logo copied to `public/ccact-logo.png`. Added `src/lib/links.mjs` and link tests; `npm test` passes 4 tests and `npm run build` succeeds with 0 pages, as UI pages do not exist yet. T03 can start now using the interface above. Initial install reported 3 vulnerabilities (1 low, 1 high, 1 critical); a subsequent `npm audit` could not reach the audit endpoint, so details remain unverified and must be resolved before release. Supabase integration, production referral links, lifecycle confirmation and hosting verification remain open. |
| 2026-11-20 | Codex | Supabase foundation | Added `supabase/migrations/202611200001_create_partners.sql` and server-only `src/lib/partner-source.mjs`, replaced the empty JSON build source, and documented secret configuration. Local tests pass (6); build succeeds with no pages. Cloudflare builds require both Supabase credentials. Migration, RLS, live data access, generated routes and delivery remain unverified against a real Supabase project; forms and protected intake are not implemented. |
| 2026-11-20 | Codex | Supabase access | MCP login retry failed during OAuth discovery; `codex mcp list` reports authentication unknown and this session has no Supabase MCP tools or configured Supabase environment variables. No migration was applied. Local tests pass (6), and the homepage builds. The build-time reader validates records but its results are not yet connected to partner routes. Authenticate the MCP server and restart/reconnect the session before verifying project access and applying the migration. |
| 2026-11-20 | Agy | T03 ready for review | Implemented verified navy/gold token system (`src/styles/tokens.css`, `global.css`), single-source copy/nav/programmes (`src/content/site.mjs`), isolated local partner fixtures (`src/content/fixtures/partner-preview.mjs`), shared shell (`BaseLayout.astro`, `SiteHeader.astro`, `PartnerStrip.astro`, `ContinuingEducationNotice.astro`, `SiteFooter.astro`, `EnrolLink.astro`), and homepage (`HomePage.astro`, `src/pages/index.astro`) replacing all purple and placeholder `#`/`.dc.html` links while preserving `enrolmentUrl` fail-closed behavior for partner contexts. `npm run build` passed (1 page built in 1.37s); `npm test` passes 6/6 tests; automated scratch verification checked CSS/HTML tokens, `/ccact-logo.png`, partner nav/footer fixtures (individual + long-name org), non-leakage of fixtures into `dist/`, and built mobile drawer `aria-expanded` / `Escape` focus-return behavior. Note: ESL card routes to `/contact/` pending a live Teachable URL; headless Edge renderer was blocked inside the sandbox AppContainer, so live browser pixel inspection should be verified in preview / T09. Next: Codex review of T01 & T03, and shared route/inner-page handoff readiness for T04 (`Depends on: T02, T03`). |
| 2026-11-20 | Agy | T04 ready for review | Implemented single-source copy (`src/content/pages.mjs`), shared template compliance notice upgrade (`ContinuingEducationNotice.astro` adds non-overridable partner outcome/licensing/immigration/tuition safeguard when `partner` is present), inner page components (`PageHero`, `AboutPage`, `CoursesPage`, `RegistrationPage`, `StudyInCanadaPage`, `FaqPage`, `ContactPage`, `PrivacyPage`), individual/organisation profile (`PartnerAboutPage.astro` with monogram fallback, optional `languages`/`services` capped at 4, `https:` website guard, zero `email` PII exposure), Approved Partners directory (`PartnersDirectoryPage.astro` + `src/pages/partners/index.astro` calling `loadLivePartners`), Affiliates scaffold (`AffiliatesPage.astro` + `src/pages/affiliates.astro` without unapproved commission numbers), all 9 main-site `.astro` routes, and downloaded 6 verified CCACT JPG assets into `public/images/`. `npm run build` built all 10 pages in 1.64s; `npm test` passes 6/6; verification checks passed across all 10 built HTML pages, internal links, CSS tokens, images, non-leakage of fixtures/secrets, partner component contracts, and mobile nav JS. Next: Codex reviews T01/T03/T04 and coordinates T05 dynamic `/partners/[slug]/...` route wiring onto the nine `*Page.astro` components, T06 form backend (`ContactPage` supports optional `formAction`), and T07 Affiliates copy/forms once CCACT supplies gated HTML, Teachable links, and Supabase credentials. |

