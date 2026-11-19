# CCACT Affiliate Websites — Product Requirements

Nov 19, 2026 · @Kyle Engo

## Overview

CCACT will give every approved affiliate partner their own website, generated from one platform rather than built as a separate copy of the main site.

Each partner site carries the full CCACT content — About, Online Courses, Registration, Study in Canada, FAQ, Contact and Privacy Notice — plus one page about that partner, and every enrolment button points at that partner's personal Teachable referral link.

The program has two stated purposes, and they pull in the same direction:

- **Accuracy.** Prospective students get one reliable place to read what a course covers, what it does not, and what the policies are. Partners stop paraphrasing course details from memory.
- **Ownership.** Each partner gets a real website to promote, not just a tracking link, which is what turns a list of referrers into a community of ambassadors.

The referral link itself is not the deliverable — Teachable already issues one per affiliate. What this project builds is the website wrapped around that link, and the system that produces thirty of them without thirty builds.

## Goals and success criteria

The build succeeds when adding a partner is an administrative task rather than a development job, and when no partner can lose a commission to a mislinked button.

| Goal | How it is measured |
| --- | --- |
| A new partner goes live quickly | Under 10 minutes from receiving their materials to a preview link |
| No referral is lost to a missed link | Every enrolment and browse button on every partner site carries that partner's referral code |
| Course and policy content never drifts | One content edit reaches all partner sites in a single deploy |
| Legal notices are always present | Required disclaimers render on 100% of partner pages and cannot be removed per partner |
| Students can confirm a partner is genuine | Every partner page links to a directory of approved partners on the main site |
| The main site keeps its search ranking | Partner pages are excluded from search indexing |

A secondary goal, harder to measure but worth stating: partners should feel the site is theirs. Their name sits in the navigation, their page carries their photo and words, and the URL is one they can read out over the phone.

## Out of scope for version one

The following are real and worth building, but not in this phase. Each would be quoted separately.

| Not in version one | Why it waits |
| --- | --- |
| Sponsor program (featuring real estate agents and other professionals) | Needs its own records, placement rules and approval flow; design the data model to allow it, build it later |
| Ready-made social media post library | A content production job as much as a build job |
| Ad submission and approval portal | Email handles this volume until partner numbers justify a tool |
| Partner self-service editing of their own bio | Every change currently passes CCACT review, which the approval flow already covers |
| Custom domains per partner | Per-domain certificates and DNS add cost and support load with no student-facing benefit |
| Partner statistics dashboards | Teachable already reports referrals to CCACT; duplicating it here risks disagreeing with it |
| Languages other than English | CCACT courses are delivered in English and assessed in English |

Also out of scope: payment processing of any kind. No money moves through these sites. All enrolment and payment happens on Teachable.

## Users and roles

Four groups use the system, and only one of them edits it.

**Prospective student.** Arrives from a partner's social post, message or presentation. Needs to understand what a course covers, confirm the partner is legitimate, and reach Teachable to enrol. Often evaluating whether CCACT is real at all, so trust signals matter more than persuasion.

**Individual partner.** A nurse, graduate or community connector. Supplies a bio and photo, reviews their page before it goes live, then shares the URL. Does not log in or edit anything.

**Organisation partner.** An immigration consultancy, education agency, nursing school or healthcare recruiter. Supplies a logo, a company description and a named contact instead of a personal bio. Otherwise behaves identically.

**CCACT administrator.** Approves applications, collects partner materials, holds the referral codes, reviews bios for compliance, and decides when a page goes live or comes down. This is the only role that changes what partners see.

**Developer.** Maintains the platform, deploys content changes, and onboards partners until CCACT takes that over. Version one assumes the developer runs the intake; a later phase can move it to the administrator.

## What each partner site contains

Nine pages. Eight are the main CCACT site's content, rendered from the same source. One is the partner's own. One page from the main site is deliberately absent.

| Page | Source | Notes |
| --- | --- | --- |
| Home | Shared | Headline identifies the partner as an authorised CCACT partner |
| About | Shared | Unchanged |
| Online Courses | Shared | All browse and enrol buttons carry the partner's referral code |
| Registration | Shared | Same |
| Study in Canada | Shared | Unchanged |
| FAQ | Shared | Unchanged |
| Contact | Shared | Enquiry form tags the partner |
| Privacy Notice | Shared | Unchanged |
| About \[Partner\] | Partner | Their bio or company description, photo or logo |

**Removed: the Affiliates page.** It publishes the commission ladder and illustrative partner earnings, which should not be visible to a prospective student weighing up a course. Hiding it from the navigation is not enough — the page would still exist at its address and be reachable by a guessed or stale link. On partner sites that address redirects to the main CCACT site.

The navigation on a partner site therefore reads: Home, About, Online Courses, Registration, Study in Canada, FAQ, About \[Partner\], Contact — with the Enrol Now button alongside.

## Becoming a partner

Recruitment lives on the main CCACT site only. No partner site invites a visitor to become a partner.

This follows from CCACT's own instruction to remove the Affiliates item from partner navigation, and there are two reasons behind it. The page publishes the commission ladder and illustrative earnings, which a prospective student should not be reading while deciding whether to enrol. And partners should not be recruiting partners from pages CCACT built and paid for.

| Route | Purpose | Who reaches it |
| --- | --- | --- |
| Affiliates page on the main site | Program overview, commission levels, expectations | Anyone, from the main site navigation |
| Apply as an organisation | Application for agencies, schools, recruiters | Prospective partners, from that page |
| Apply as an individual | Application for nurses, graduates, community connectors | Prospective partners, from that page |
| Partner intake form | Collects bio, photo, languages and services after approval | Approved partners, by private link |

The first three already exist on the live site. The Affiliates page is rebuilt with the rest of the main site and keeps its current content. The two application forms are reached from buttons on that page — where those buttons point today needs confirming, because if they lead to an external form service there is nothing to build, and if they do not, the forms are in scope.

The intake form is new and is what turns an approval into a live page. One submission fills the partner record, which generates the site. This is the step that has to take minutes rather than an email thread, because it happens once per partner forever.

On partner sites, the Affiliates address redirects to the main site. A visitor who genuinely wants to apply still arrives in the right place, through the front door, where CCACT controls what they read first.

## The partner record

One record per partner generates their whole site. This list is the contract: if CCACT supplies these fields, the site can be produced without further development work.

| Field | Required | Supplied by | Notes |
| --- | --- | --- | --- |
| Full name or organisation name | Yes | CCACT | Appears in navigation, page title and directory |
| URL slug | Yes | Developer | Derived from the name, fixed for the life of the partnership |
| Partner type | Yes | CCACT | Individual or organisation — selects which About layout renders |
| Referral code | Yes | CCACT | From Teachable; appended to every enrolment link |
| Bio or company description | Yes | Partner, reviewed by CCACT | Two to three short paragraphs |
| Photo or logo | No | Partner | A placeholder renders cleanly if absent |
| Role or organisation category | Yes | CCACT | Shown under the name |
| Location | Yes | CCACT | City and country, for the directory |
| Languages spoken | No | Partner | Useful to students, optional |
| Services or areas of help | No | Partner | Four short items |
| Contact email | Yes | CCACT | Receives tagged enquiries |
| Organisation website | No | Partner | Organisations only |
| Approval date | Yes | CCACT | Shown in the directory |
| Status | Yes | CCACT | Drives whether the site is live |

The record lives in one place that CCACT can see and the build can read. A shared spreadsheet is the simplest option and needs no new tool; the decision is noted in the open questions below.

One consequence worth stating plainly: a field that is not on this list cannot vary per partner without new development. If CCACT wants partners to differ in some other way later, that is a change request, not a configuration.

## Partner lifecycle

&#91;embedded content: partner lifecycle · 6 states, approval to retirement\]

Nothing reaches a student until the partner has seen their own page and approved it. A partner can also retire directly from live without being suspended first.

Two states CCACT's brief does not yet cover are worth deciding now, while they are cheap. **Suspended** takes the page offline but keeps the record and the referral code, so a partner under review or on a pause can be restored in minutes. **Retired** removes the page and redirects its address to the main CCACT site, so old links, printed cards and social posts still land somewhere sensible rather than on an error page. In both cases the partner leaves the directory immediately.

## Referral tracking and attribution

Every link that leaves a partner site for Teachable carries that partner's referral code, and the site guarantees nothing beyond that point.

There are roughly fifteen outbound enrolment and browse links across the nine pages — the header Enrol button on every page, two on the home page, and about a dozen across the course listing. All of them are produced by one shared component that reads the partner from the page address and appends their code. The code cannot be present on some buttons and missing from others; either every link is correct or the build fails.

Across thirty partners this is roughly 450 individual link instances. That number is the clearest argument for one platform: hand-built copies would require 450 correct manual edits, and a single miss sends a referral to nobody with no visible symptom.

**What the site cannot control.** Once a visitor reaches Teachable, attribution follows Teachable's own tracking rules and the Affiliate Agreement. The site cannot guarantee a commission when a student:

- browses a partner site, then enrols later from the main CCACT site or a search result
- clears cookies, switches device, or returns after Teachable's tracking window closes
- is referred by two different partners

These are platform limits, not build defects. CCACT's own partner materials already say that affiliates should not assume a referral can be identified manually when the tracking process was not followed, and that position should be stated the same way to partners here.

**Catching the enquiries that never click.** Some students will email or message instead of clicking through. The enquiry form and mailing list signup on each partner site carry a hidden field naming that partner, so CCACT can see where the enquiry came from even when no referral cookie was ever set. This does not create an automatic commission — it gives CCACT the information to decide.

## Compliance and required content

CCACT's required notices are part of the template, not part of any partner's editable content. This is the single strongest reason to run one platform rather than thirty copies.

CCACT operates in a regulated space. Its courses sit alongside nursing licensure, professional registration and immigration, and its approved partners include regulated immigration consultants. The existing site already carries the necessary language: courses are continuing education, they do not provide a diploma or degree, they do not lead directly to licensing or registration in Canada, and partners must never guarantee employment, immigration outcomes, licensing or professional recognition.

Three rules follow.

1. **Disclaimers render from the template.** They appear on every partner page automatically. No partner record can suppress, shorten or alter them.
2. **One edit updates every site.** When the Affiliate Agreement is finalised or legal wording is revised, the change deploys everywhere at once. With thirty separate copies, every revision is thirty chances to leave a stale notice live — and the exposure sits with CCACT, not the partner.
3. **Partner-supplied text is reviewed before it goes live.** Bios and company descriptions pass CCACT review, because a bio implying immigration or employment outcomes creates the same exposure as a non-compliant advertisement.

The partner directory on the main site carries its own notice: partners introduce students and never collect tuition, all payment is made directly to CCACT through Teachable, and no partner can guarantee an outcome. Students are a newcomer audience that is actively targeted by credential and immigration scams, so a verifiable list of approved partners protects both the students and the partners' own credibility.

## Technical approach

One codebase generates every partner site at build time. Content is written once; partner records are data.

The current CCACT site is flat static HTML, which makes it straightforward to move into a templated generator. The proposed stack is Astro, deployed to Cloudflare Pages. Both are free to host at this scale, output plain static files, and serve from a global network — which matters when a large share of the audience is in South Asia and Southeast Asia rather than Canada.

&#91;embedded content: build architecture · sources, build, output\]

Nothing in the middle of that picture is per-partner. The only thing that scales with partner count is rows in the records file, which is why the thirtieth partner costs the same as the third. Enquiry and mailing list submissions take a separate path, reaching CCACT with the partner's name attached rather than passing through Teachable at all.

| Concern | Approach |
| --- | --- |
| Shared content | Written once as source files, rendered into every partner site |
| Partner records | One data file or spreadsheet, read at build |
| Partner pages | A dynamic route generates all nine pages per partner |
| Enrolment links | One shared component appends the partner's referral code |
| Search indexing | Partner pages carry a no-index instruction so they cannot compete with the main site |
| Commission page | The Affiliates address redirects to the main site on partner sites |
| Forms | Enquiry and mailing list submissions carry a hidden partner field |
| Hosting | Static files on a global network, no server to maintain |

**On URLs.** The recommendation is a path on the main domain, such as `theccact.com/partners/firstname-lastname`. It keeps every partner under the domain students are asked to trust, consolidates search authority on the main site, and needs no per-partner certificate. A subdomain per partner is possible and feels more like a separate site, at the cost of extra configuration and a weaker trust story. This is a decision for CCACT and is listed below.

**Why not thirty WordPress sites.** It would work, but it means thirty installations to update, a plugin surface to maintain, recurring hosting to pay for, and no mechanism preventing content and disclaimers from drifting apart. The maintenance cost arrives every month and grows with each new partner.

## Delivery phases

Version one is the platform plus the partners CCACT has actually approved. Phases two and three are separate pieces of work, quoted when CCACT wants them.

| Phase | Delivered | CCACT supplies first |
| --- | --- | --- |
| One — platform | Templated site, nine page types, partner routing, referral code injection, tagged forms, partner directory, redirect of the commission page, onboarding intake form | Final content for all eight shared pages, approved disclaimer wording, partner records for the launch group |
| Two — sponsors | Sponsor records, sponsor placement on course and partner pages, sponsor approval states | Sponsor tiers, what a sponsor receives, placement rules |
| Three — partner enablement | Social post library, advertisement submission and approval workflow | Approved creative, the review process and who performs it |

**On the launch group.** The brief assumes roughly thirty partner sites. CCACT's own partner page currently describes proposed commission levels and an Affiliate Agreement that is not yet final, which suggests the program has not signed partners at that scale yet. Building thirty namespaces for a program with three approved partners costs the same as building for three and delays launch.

The recommendation is to launch with the partners who are approved and ready, prove the onboarding loop end to end, and add the rest as they are approved — which the platform does at no extra development cost. The number of partners does not change the build; only the content and the records change.

**Ongoing.** After launch, hosting, content updates and partner onboarding continue. These are a monthly commitment rather than part of the build, and should be priced separately.

## Decisions needed before build

Eight answers unblock the work. Each has a recommended default, so none of them needs to stall the project.

| Decision | Recommendation | Why it matters |
| --- | --- | --- |
| Referral link format — does Teachable issue a bare code to append, or a complete prebuilt link per partner? | A bare code | A code templates across all fifteen buttons from one field; prebuilt links mean storing and maintaining many links per partner |
| How many partners are approved and ready today? | Launch with those, add the rest as approved | Determines the launch date, not the build cost |
| URL structure — path or subdomain? | Path on the main domain | Consolidates trust and search authority, no per-partner certificates |
| Where do the two Apply buttons on the Affiliates page point today? | Keep whatever external form service is already in use | If the applications run on an external service there is nothing to build; if not, two forms enter scope |
| Who edits course and policy content after launch? | CCACT supplies copy, developer deploys | Decides whether a content management system is needed at all |
| Where does the partner record live? | A shared spreadsheet CCACT maintains | No new tool to learn, and CCACT can see every partner at a glance |
| Who reviews partner bios for compliance? | A named person at CCACT | The review must happen before a page goes live, and someone must own it |
| Confirm branding is CCACT throughout | CCACT | The written brief refers to a different name; the live site is CCACT |

Two smaller items worth settling at the same time. The contact address published across every partner site is currently a Gmail address — an address on the CCACT domain would cost little and matters to an audience that is checking whether the organisation is genuine. And the brand currently appears in two colour schemes, the navy and gold of the new shield logo and the purple of recent promotional material; partner sites should use one.

## Assumptions, dependencies and risks

**Assumptions.** Teachable remains the enrolment and payment platform and the system of record for referrals. No payment passes through these sites. Partner bios and photos are supplied by CCACT, already reviewed. The main CCACT site's content is final enough to template, and future changes come through CCACT rather than being edited by partners.

**Dependencies.** Teachable referral codes for each launch partner. Final content for the eight shared pages. Approved disclaimer wording. Partner bios, photos and the rest of the record. Access to the domain's DNS settings.

**Risks.**

| Risk | Effect | Response |
| --- | --- | --- |
| The Affiliate Agreement is not final | Legal wording will change after launch | Disclaimers are template-level, so revisions deploy everywhere at once |
| Teachable's tracking is weaker than partners expect | Partners blame the websites for lost commissions | State the limits in the partner materials before launch, not after the first dispute |
| Fewer approved partners than planned | Capacity built for volume that does not arrive | Launch with the approved group; the platform scales without further build |
| Partner churn | Dead pages and orphaned referral codes | Retirement is part of the lifecycle, not an afterthought |
| A partner publishes a non-compliant claim in their bio | Regulatory exposure for CCACT | Review before go-live; the partner never edits the page directly |
| Scope expands into sponsors or creative | Version one never ships | Named as out of scope above and quoted separately |

The risk worth watching most closely is the second one. Attribution is the partners' entire financial interest in the program, the websites are the most visible thing in the chain, and the one part of the chain that cannot guarantee attribution is the part nobody can see.
