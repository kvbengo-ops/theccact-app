# T01 Brand, Design & Content Inventory (CCACT Affiliate Sites)

Prepared by: **Agy** · Date: `2026-11-19` · Reviewer: **Codex**
Sources inspected:
- Local design & brand assets: `UI design/Main.dc.html`, `UI design/README.md`, `Ccact_logo.png`, `CCACT Affiliate Websites — Product Requirements.md`, `task.md`
- Live website (`https://theccact.com`, fetched `2026-11-19`):
  - `https://theccact.com/` (`index.html`), `style.css`, `scripts/script.js`, `includes/header.html`, `includes/footer.html`, `images/logo.png`
  - `about.html`, `course-list.html`, `registration.html`, `study-in-canada.html`, `faq.html`, `contact.html`, `privacy-notice.html`
  - Gated/redirected routes tested: `partners.html`, `partner-application.html`, `individual-affiliate-application.html`, `affiliates.html`, `robots.txt`, `sitemap.xml`

---

## 1. Brand Palette & Logo Evidence

Owner direction (`task.md`): *"you can just change the purple for blue and use the colors that are on our current website including the gold."*

### 1.1 Observed Colors Across All Primary Sources

| Source | Role | Observed Values | Notes / Evidence |
| --- | --- | --- | --- |
| Live `https://theccact.com/style.css` (`:root`, lines 3–12, 212, 448, 621, 643–647, 455–456) | Current live purple overrides | `--navy: #5B2D8E`, `--navy-dark: #3E1D7A`, hero overlay `rgba(62, 29, 122, 0.3)` → `0.55`, tints `rgba(91, 45, 142, 0.1)` / `0.06` | Purple theme overrides variables still named `--navy` / `--navy-dark`; replace all purple tokens with Navy/Blue. |
| Live `https://theccact.com/style.css` (`:root`) | Current website gold & neutrals | `--gold: #C8A96E`, `--gold-light: #DBC48E`, `--light: #F8F4EE`, `--white: #FFFFFF`, `--gray: #6B7280`, `--text: #1F2937`, `--border: #E5E7EB` | Status colors: `--success: #1A7F37`, `--error: #C0392B`; highlight amber box: `#FFF7E0` fill / `#E0A800` border / `#6B5500` ink. |
| Live circle emblem `https://theccact.com/images/logo.png` (`100×100`) | Live logo navy & warm accent | Dominant deep navy pixels `#012B66` / `#002B66` / `#002A65`; bright amber/gold border/cross pixels `#FFB462` / `#FF9326` | Notice `style.css` contains zero blue hexes — blue/navy on the current website only appears inside `images/logo.png`. |
| Workspace shield logo `Ccact_logo.png` (`407×381`) | New shield navy & ribbon gold | Shield navy pixels `#2A3958` / `#2B3858`; ribbon & stars antique gold pixels `#D7AF6A` / `#D8AE6C` | Matches owner shield mark; replaces inline SVG placeholder in `UI design/Main.dc.html`. |
| Mockup `UI design/Main.dc.html` | Mockup Navy & Gold system (already de-purpled) | Navy: `#15233E` (primary), `#1E3357` (hero card), `#2C3E60` (footer divider), `#33456B` (card border), `#5A6B8C` (outline button border)<br>Gold: `#C9A14A` (eyebrow/accents/active underline/left callout rule), `#E3C98A` (primary CTA & announcement ink), `#8A6A28` (dark gold link hover & eyebrow on light bg), `#6B5423` (`Authorised CCACT Partner` on sand)<br>Paper/Slate: `#FBF9F4` (page cream), `#F4EEE1` (partner strip sand), `#FFFFFF` (cards/header), `#E4DED1` (hairline borders), `#D8CDB4` (strip vertical divider), `#414C60` (body ink), `#5B6678` (muted copy), `#6B7689` (sub-wordmark/meta), `#8494AE` / `#96A3BA` / `#C8D0DE` (light text on `#15233E`) | Directly aligns with `Ccact_logo.png` navy & gold while darkening navy to `#15233E` so light gold `#C9A14A` / `#E3C98A` and muted `#C8D0DE` / `#96A3BA` achieve strong readability. |

### 1.2 WCAG 2.1 Contrast Verification on Mockup Tokens (Computed Locally)

| Foreground on Background | Measured Ratio | Level | Decision for T03 |
| --- | --- | --- | --- |
| `#E3C98A` on `#15233E` (Announcement bar) | `9.68:1` | AAA | Keep |
| `#15233E` on `#E3C98A` (Gold CTA button) | `9.68:1` | AAA | Keep |
| `#C8D0DE` on `#15233E` (Hero copy / Footer links) | `10.09:1` | AAA | Keep |
| `#C9A14A` on `#15233E` (Eyebrow / Section labels) | `6.47:1` | AA / Large AAA | Keep |
| `#96A3BA` on `#15233E` (Hero microcopy / Footer lead) | `6.14:1` | AA | Keep |
| `#8494AE` on `#15233E` (Footer copyright bar) | `5.09:1` | AA | Keep |
| `#6B5423` on `#F4EEE1` (`Authorised CCACT Partner`) | `6.23:1` | AA | Keep |
| `#5B6678` on `#FBF9F4` (Card description on cream) | `5.52:1` | AA | Keep |
| `#8A6A28` on `#FBF9F4` (Card eyebrows / Link hover) | `4.78:1` | AA | Keep |
| `#6B7689` on `#FFFFFF` (Header subtitle / Meta) | `4.59:1` | AA (borderline on `#FBF9F4`) | Use `#5B6678` on `#FBF9F4` surfaces (avoid `#6B7689` on cream to stay >= 4.5:1) |

### 1.3 Brand Palette Direction for T03 (`src/styles/`)
- Use **`UI design/Main.dc.html`** tokens (`#15233E` / `#1E3357` navy + `#C9A14A` / `#E3C98A` / `#8A6A28` / `#6B5423` gold + `#FBF9F4` / `#F4EEE1` / `#FFFFFF` paper/cream, `#1A7F37` / `#C0392B` semantic status from live `style.css`), preserving close continuity with live `--gold: #C8A96E`, `--gold-light: #DBC48E`, `--light: #F8F4EE`, and `Ccact_logo.png` (`#2A3958` / `#D7AF6A`).
- Render `Ccact_logo.png` in the header brand lockup instead of the mockup's inline placeholder `<svg>` shield (`task.md` directive).

---

## 2. Full `UI design/Main.dc.html` Inventory & PRD Gap Analysis

Reference runtime constraint (`UI design/README.md`): treat `Main.dc.html` as a visual spec only; recreate cleanly in Astro components/CSS without `vendor/react*`, `support.js`, or `<x-dc>`/`<helmet>` runtime.

### 2.1 Typography & Spacing Spec (Mockup vs Live Site)
- **Mockup fonts:** `Source Serif 4` (`400;600;700`) for display/headings/brand wordmark + `Inter` (`400;500;600`) for UI & body text. *(Live `theccact.com/style.css` uses `Cormorant Garamond` + `Lato`.)* Follow `Main.dc.html` typography for T03 presentation fidelity unless CCACT requests `Cormorant Garamond`/`Lato`.
- **Container & Gutters:** `max-width: 1200px`, desktop horizontal padding `40px`. **Must adjust responsively** (e.g., `24px` at `<= 900px`, `16px–20px` at `<= 640px`).
- **Sharp editorial geometry:** Mockup buttons use `border-radius: 2px`, cards use `1px solid #E4DED1` flat hairline borders with zero drop shadow (contrasting with live `style.css` `8px` pill-ish cards/shadows). Follow `Main.dc.html` per `UI design/README.md`.

### 2.2 Section-by-Section Inventory & Gaps (`Main.dc.html` lines 23–158)

| # | Mockup Section | Spec Values | Discrepancies / Missing Functional Needs |
| --- | --- | --- | --- |
| 1 | **Announcement bar** (`L23–25`) | `#15233E` bg, `#E3C98A` text, `13px`, `0.04em` tracking, `padding: 11px 24px`. Text: `"Registration is open 7 days a week, 24 hours a day"` | Live header appends `" — Enroll today!"`. Keep concise mockup copy or verify wording preference. |
| 2 | **Header & Primary Nav** (`L27–53`) | `#FFFFFF` bg, `1px solid #E4DED1` bottom, `18px 40px` inner padding. Logo mark + `"CCACT"` (`23px` serif bold `0.12em`) + `"Canadian Centre for Advanced Career Training"` (`9.5px` uppercase `0.17em`). Nav links `14px` `#414C60`, `22px` gap; active gold bottom rule `2px solid #C9A14A`; CTA `#E3C98A` bg, `#15233E` text, `12px 20px`. | **1.** Replace inline `<svg>` shield with `Ccact_logo.png`.<br>**2. Missing nav link:** `Study in Canada` is omitted from `Main.dc.html` but **required by PRD L81** (`Home, About, Online Courses, Registration, Study in Canada, FAQ, About [Partner], Contact` + `Enrol Now`).<br>**3.** Organisation partner naming: mockup uses `About {{firstName}}`, which breaks for organisations (e.g., `About ABC Nursing` vs `About [Organisation]` / partner short label).<br>**4.** Main site vs partner site nav: Main site needs `Affiliates` (removed from partner sites + redirected to main `/affiliates` or `/partners` per PRD) and omits `About [Partner]`. Live nav also includes `Privacy Notice` (`includes/header.html`), while PRD puts Privacy Notice in the page list / footer.<br>**5.** Spelling: `Enrol Now` (mockup/PRD) vs `Enroll Now` (live site).<br>**6.** Responsive: 9 links need an accessible mobile drawer toggle at `<= 960px` (`<button aria-expanded>`), avoiding crowded multi-line wrapping. |
| 3 | **Partner Attribution Strip** (`L55–66`) | `#F4EEE1` bg, `1px solid #E4DED1` bottom, `14px 40px`, `gap: 14px`. `34px` circle monogram (`#15233E` / `#E3C98A`), `"Presented by {{partnerName}}"`, hairline divider (`#D8CDB4`), shield icon + `"Authorised CCACT Partner"` (`#6B5423`), right-aligned `"Verify this partner"` underlined link to directory. | **1.** Partner sites only (omit on main site).<br>**2.** Support optional partner photo/logo thumbnail in place of monogram when `partner.image` is set (keep monogram fallback).<br>**3.** Responsive: at `< 640px`, ensure `"Verify this partner"` wraps cleanly left-aligned rather than floating oddly with `margin-left: auto`. |
| 4 | **Hero** (`L68–91`) | `#15233E` bg; `84px 40px 78px`; left copy `flex: 999 1 560px`; right dark card `flex: 1 1 320px` (`#1E3357` bg, `1px solid #33456B`, `padding: 30px 28px`). Eyebrow `12px` `0.19em` `#C9A14A`; `h1` `57px` serif `#FFFFFF` (`1.1` line-height); body `17px` `#C8D0DE` (`max-width: 580px`); 2 CTAs (`Browse online courses` filled `#E3C98A`, `Register now` bordered `#5A6B8C`); microcopy `12.5px` `#96A3BA`. | **1.** Responsive typography: scale `h1` smoothly (`clamp(2.125rem, 5vw, 3.5625rem)`) and reduce vertical padding on mobile (`48px 20px`).<br>**2.** Two hero CTAs & attribution: clarify PRD L139 (`two on the home page`) vs destination: if `Register now` links internally to `/partners/[slug]/registration` (which holds a referral CTA) or directly to Teachable, ensure all Teachable-bound buttons carry the partner's referral link in T05.<br>**3.** Live site uses `"Welcome to CCACT"` photo banner + separate cream tagline section; mockup consolidates into `"Study in Canada from anywhere in the world"` architectural navy hero + `"Why study with CCACT"` card (which also replaces the live split open-enrollment band!).<br>**4. Missing on mockup Home:** Live `index.html` and PRD L151/175/185 include the **mailing list signup (`Stay Connected`)** carrying a hidden partner field on partner sites. Add a clean mailing list section matching mockup aesthetics before the Notice/Footer! |
| 5 | **Online Courses Overview Grid** (`L93–115`) | `#FFFFFF` bg, `1px solid #E4DED1` bottom, `60px 40px 64px`. Header flex (`h2` `36px`, subtitle `15.5px`, outlined CTA `Browse all courses on Teachable`). `3-column` CSS grid (`repeat(3, minmax(0, 1fr))`, `gap: 20px`); 6 cream cards (`#FBF9F4`, `1px solid #E4DED1`, `28px 26px 26px`). | **1. Critical responsive bug in mockup:** fixed 3-column grid overflows/squishes tablets & phones (`<= 960px` → 2 cols; `<= 640px` → 1 col).<br>**2.** Card CTA `"Browse & enrol"` has `padding: 12px 0` (ensure min-height >= 44px touch target). Link destinations map cleanly to live Teachable category URLs (except ESL — see Section 3.2).<br>**3.** Note live site `index.html` did NOT have these 6 cards (they live on `course-list.html`); `Main.dc.html` brings programme discovery onto Home cleanly using real live-site metadata! |
| 6 | **Continuing Education Notice** (`L117–124`) | `#FBF9F4` bg, `58px 40px`. White callout box with `3px solid #C9A14A` left accent, `1px solid #E4DED1` other sides, `30px 34px`. | Matches live `about.html` / `course-list.html` notice verbatim. PRD L27 & L161 require template-level non-removable legal notices on **100% of partner pages** (consider compact global disclaimer strip or footer compliance notice on all pages in addition to featured home/course/about box). |
| 7 | **Footer** (`L126–157`) | `#15233E` bg, `56px 40px 40px`, 4 flex columns (`gap: 48px`). Cols: Brand, `Quick navigation` (4 links), `Your partner` (2 links on partner sites), `Get in touch` (`theccact@gmail.com`, `+1 416-893-8158`). Bottom border `#2C3E60`, `20px 40px`, `#8494AE` copyright `© 2026 Canadian Centre For Advanced Career Training (CCACT). All rights reserved.` | **1. Missing links in mockup footer:** `Study in Canada` and `Privacy Notice` (`includes/footer.html` includes both; PRD lists all 8 shared pages + `About [Partner]`). On main site, `Affiliates` replaces `Your partner` column (`Verify partners` directory link + `Affiliates` link).<br>**2. Email discrepancy:** `theccact@gmail.com` appears here/contact/registration, while `faq.html` lists `info@theccact.online` (and PRD L223 flags Gmail vs custom-domain address). |

---

## 3. Shared Pages, Courses, Policies & Live Site Inventory

### 3.1 Live Site Navigation & Route Map (`https://theccact.com`)

From `includes/header.html`, `includes/footer.html`, and `scripts/script.js`:

| Nav Label | Live Path | Status on `2026-11-19` | Partner Site Role (PRD) |
| --- | --- | --- | --- |
| Home | `/index.html` (`/`) | HTTP `200` (2,374 B) | Shared content + partner attribution strip & Teachable links |
| About | `/about.html` | HTTP `200` (9,760 B) | Shared (unchanged copy + global partner attribution/legal shell) |
| Online Courses | `/course-list.html` | HTTP `200` (22,088 B) | Shared catalog + **all Teachable CTAs use partner referral link** |
| Registration | `/registration.html` | HTTP `200` (5,960 B) | Shared steps/eligibility + Teachable/courses links carry partner referral where outbound |
| Study in Canada | `/study-in-canada.html` | HTTP `200` (3,735 B) | Shared (Jean McInnes-Robles immigration consultancy info; separated from CCACT tuition) |
| FAQ | `/faq.html` | HTTP `200` (12,889 B) | Shared (7 anchor sections, native `<details>` accordions, enrollment notice) |
| Affiliates | `/partners.html` | **HTTP `401 Unauthorized`** (145 B meta-refresh to `/`) | **Excluded on partner sites**; partner `/affiliates` redirects to main site (`T06`) |
| Contact | `/contact.html` | HTTP `200` (4,378 B) | Shared UI + **hidden partner identifier field** on enquiry form (`T06`/`T07`) |
| Privacy Notice | `/privacy-notice.html` | HTTP `200` (2,923 B) | Shared |
| Apply (Org) | `/partner-application.html` *(from `script.js`)* | **HTTP `401 Unauthorized`** (145 B meta-refresh to `/`) | Main site only (`T07`) |
| Apply (Individual) | `/individual-affiliate-application.html` *(from `script.js`)* | **HTTP `401 Unauthorized`** (145 B meta-refresh to `/`) | Main site only (`T07`) |
| Enroll Now CTA | `/registration.html` *(live header)* | HTTP `200` | Header `Enrol Now` button — on partner sites links to Teachable with referral (`PRD L139`) |

*(Note: `affiliates.html` returns S3 `403 AccessDenied`; `robots.txt` and `sitemap.xml` also return `403 Forbidden`.)*

### 3.2 Course Programs & Exact Teachable Destinations (`https://theccact.com/course-list.html`)

All existing outbound course links point to subdomain `https://the-canadian-centre-for-advanced-career-traini.teachable.com`:

| Program Section | Courses & Codes on Live Site | Live Outbound URL / Action (`href`) | Count of Outbound Enrol CTAs |
| --- | --- | --- | --- |
| **Catalog Header & Bottom CTA** | Page hero CTA (`Browse All Courses on Teachable`) + Bottom CTA (`Browse All Courses on Teachable`) | `https://the-canadian-centre-for-advanced-career-traini.teachable.com/l/products?sortKey=name&sortDirection=asc&page=1` | 2 Teachable links (+ `contact.html` "Talk to an Advisor") |
| **1. Gerontology Nursing (`#gerontology`)** | `GN 101` Screening & Assessments; `GN 102` Health & Wellness Promotion; `GN 103` Common Health Conditions; `GN 104` Pulmonary; `GN 105` Neurological & Mental Health; `GN 106` Hematological & Immunological; `GN 107` Cardiac; `GN 108` Gastrointestinal; `GN 109` Genitourinary; `GN.BC` Bundle (all 9) | `https://the-canadian-centre-for-advanced-career-traini.teachable.com/l/products?sortKey=name&sortDirection=asc&page=1&courseCategory=Gerontology+Nursing` | 1 category CTA (`Browse & Enroll on Teachable`) |
| **2. Canadian Registered Nurse Exam Review (`#nursing-exam`)** | `CRNER-101` Exam Writing Strategies; `CRNER-102` Nursing Competency Categories; `CRNER-103` Fast Facts for Quick Study; `CRNER-104` Individual Study Guides & Nursing Interventions; `CRNER-105` Body Systems & Terminology; `CRNER-106` Practice Nursing Exam (3 attempts); `CRNER-107` Practice Nursing Exam (8 attempts); `CRNER.BC` Bundle | `https://the-canadian-centre-for-advanced-career-traini.teachable.com/l/products?sortKey=name&sortDirection=asc&page=1&courseCategory=Canadian+Nursing+Exam+Review` | 1 category CTA (`Browse & Enroll on Teachable`) |
| **3. Canadian Health Care System (`#healthcare`)** | `CHS101` Nursing in Canada; `CHS102` Ethics & Informed Consent; `CHS103` Nurse-Client Relationship; `CHS104` Legal Implications, Medical Administration & Documentation; `CHS.BC` Bundle (**CAD $149**) | `https://the-canadian-centre-for-advanced-career-traini.teachable.com/l/products?sortKey=name&sortDirection=asc&page=1&courseCategory=CHS+-+Canadian+Healthcare+System` | 2 category CTAs (`Enroll in CHS Bundle — $149`, `Browse Individual Courses`) |
| **4. Hospice & Palliative Care (`#palliative`)** | `HPC101` Ethics in Modern Medicine; `HPC102` Symptoms Management; `HPC.BC` Bundle | `https://the-canadian-centre-for-advanced-career-traini.teachable.com/l/products?sortKey=name&sortDirection=asc&page=1` *(unfiltered base catalog URL on live site)* | 1 CTA (`Browse & Enroll on Teachable`) |
| **5. Diagnostic Modalities (Theoretical) (`#diagnostics`)** | `DM.101` Intro to Electrocardiography; `DM.102` Intro to Phlebotomy; `DM.103` IV Training: Peripheral IV Therapy Initiation; `DM.BC` Bundle *(theory only; clinical experience beneficial, not required)* | `https://the-canadian-centre-for-advanced-career-traini.teachable.com/l/products?sortKey=name&sortDirection=asc&page=1&courseCategory=Diagnostic+Modalities+%28Theoretical%29` | 1 category CTA (`Enroll in DM Bundle`) + `contact.html` (`Ask an Advisor`) |
| **6. English Communication Skills for Healthcare Professionals (`#esl`)** | 7 `ESL` modules: Professional English for Healthcare Settings; Patient-Centred Communication; Professional Documentation & Report Writing; Grammar, Pronunciation & Vocabulary; Speaking & Listening: Real-Life Healthcare Scenarios; Reading Comprehension; CELPIP Prep Strategies, Practice Exercises & Mock Testing | **No Teachable link yet** — CTA `"Join Our Mailing List"` links to `contact.html` *(CELPIP Prep & Testing Centre in India & Canada is a "long-term vision... subject to approval")* | 0 Teachable links (needs mailing list / partner-tagged CTA) |

**Critical URL implication for T05 (`src/lib/` referral helper):** Every existing Teachable category URL already carries `?sortKey=name&sortDirection=asc&page=1[&courseCategory=...]`. T05 MUST handle URLs with existing query strings (e.g., `URL` / `searchParams`) AND accommodate whatever destination-specific link structure CCACT's real Teachable affiliate samples reveal — never concatenate `?code=` naively onto URLs that already have `?`.

### 3.3 Shared Page Content Summary & Preserved Assets
- **`about.html`:** Founded `2012` by Jean Robles and Jeanelle Robles (`25+ years` private healthcare college experience operating `Robetech Institute` in Toronto + Philippines program development). Mission statement quote, 3 highlight pillars (`50+ online courses`, student-focused, global accessibility), Continuing Education Notice, College Letter signed `"Sincerely, The Staff & Faculty of CCACT"`, and 4 Directors (`Jean McInnes Robles`, `Jeanelle Robles`, `Yvonne Sanchez`, `Edward Robles`) with headshots (`images/jean-mcinnes-robles.jpg`, `jeanelle-robles.jpg`, `yvonne-sanchez.jpg`, `edward-robles.jpg` — all return HTTP `200`).
- **`registration.html`:** 4-step enrollment flow (Choose → Click to Teachable → Email & payment → Immediate access); 24/7 open access card + `images/registration-student.jpg` (`HTTP 200`); `Who Can Enroll?` (English written comprehension required; most courses need no prerequisites); `Admission Requirements` (Health care focus, International students welcome, All career stages; Prerequisites & DM.101–103 theoretical notes); `"A Note to Future Students"` CTA (`mailto:theccact@gmail.com`); `"Need Help Choosing a Course?"` CTA.
- **`study-in-canada.html`:** Features `Jean McInnes Robles` (International Executive Director, licensed Canadian Immigration Consultant since 2016, 35+ years working with international students), link to external `https://jeanrobles.com`, mention of access to several online CCACT courses for free for healthcare immigration clients during processing, Robetech background, and explicit separation notice (`"Immigration services operate separately through Jean Robles Immigration Consulting"`), contact `mailto:immigration@jeanrobles.com`, text-only `+1 416-893-8158`.
- **`faq.html`:** 23 native `<details>` FAQs across 7 anchored sections (`#about`, `#eligibility`, `#format`, `#certificates`, `#licensing`, `#fees`, `#before-enroll`) + top intro banner + bottom Important Enrollment Notice. Note `Before You Enroll` (`#L230`) lists `info@theccact.online` + WhatsApp/text `+1 416 893 8158`.
- **`contact.html`:** Office hours (`Mon–Fri 8:30 am – 4:30 pm EST`), email `theccact@gmail.com`, `#contact-form` (`firstName`, `lastName`, `email`, optional `phone`, `message`), 4 Helpful Resource cards (`course-list`, `registration`, `faq`, `study-in-canada`). (Also note live `includes/footer.html` renders a `#contact` sticky `Let's Chat!` FAB — omitted cleanly in `Main.dc.html`.)
- **`privacy-notice.html`:** 6 sections (`Information Collection`, `Data Usage Purposes`, `Data Security` PCI-DSS, `Communication Methods`, `Cookie Usage` [3 types], `Policy Changes`).
- **Live imagery HTTP `200` verified (not yet stored in this workspace repo):** `images/logo.png`, `images/doctors-desk.jpg`, `images/registration-student.jpg`, `images/english-communication-skills.jpg`, `images/jean-mcinnes-robles.jpg`, `images/jeanelle-robles.jpg`, `images/yvonne-sanchez.jpg`, `images/edward-robles.jpg`.

### 3.4 Verbatim Compliance, Legal & Policy Notices

1. **Continuing Education Notice** (`Main.dc.html`, `about.html`, `course-list.html`):
   > CCACT offers online continuing-education, review, and professional-development courses. These courses do not provide a diploma or degree and do not lead directly to professional licensing or registration in Canada. They are designed to strengthen knowledge, practical understanding, and confidence while supporting personal and professional development.
2. **Account / No-Charge Microcopy** (`Main.dc.html`, `index.html`):
   > Creating an account does not enrol you in a course or result in any charge.
3. **Important Enrollment Notice** (`faq.html`):
   > By enrolling, students should confirm that they have reviewed the course description and understand that CCACT courses are continuing education/CPD, not vocational training; practical placement is not included unless specifically stated; and course registrations are non-refundable and non-transferable.
4. **Licensing & Immigration Separation Notices** (`faq.html`, `study-in-canada.html`):
   - Courses do not lead to licensing or registration by themselves, nor are short online CE courses intended to confer Canadian study-permit eligibility.
   - `Immigration services operate separately through Jean Robles Immigration Consulting.`
5. **Diagnostic Modalities Theoretical Notice** (`course-list.html`, `registration.html`):
   - `DM.101`, `DM.102`, `DM.103` cover theoretical components only (`Prior practical training or work experience is recommended but not required`).
6. **PRD-Mandated Partner & Directory Notices** (`PRD L27, L149, L157, L161, L165` — approved exact wording still pending from CCACT):
   - Partner pages (`100%` of pages, template-enforced): Continuing Education / non-licensing notice + partner cannot guarantee employment, immigration outcomes, licensing, or professional recognition + disclosure that tracking follows Teachable / Affiliate Agreement rules (`manual attribution not guaranteed` when tracking steps aren't followed, for partner-facing/terms context).
   - Main-site Partner Directory (`PRD L165`): partners introduce students and never collect tuition; all payment is made directly to CCACT through Teachable; no partner can guarantee an outcome.

---

## 4. Affiliates Content & Application-Form Decision

### 4.1 Direct Technical Evidence (`https://theccact.com`)
- Header & Footer nav link `Affiliates` → `/partners.html` returns **`HTTP/1.1 401 Unauthorized`** (`Content-Length: 145`, body: `<meta http-equiv="refresh" content="0;url=/">`).
- `scripts/script.js` lines 88–134 explicitly documents two **first-party HTML pages** on `theccact.com`:
  - `partner-application.html` (`#partner-application-form`, `formType: 'partner-application'`)
  - `individual-affiliate-application.html` (`#individual-affiliate-application-form`, `formType: 'individual-affiliate-application'`)
  - Both pages stamp a `#declarationDate` field (`YYYY-MM-DD` via `en-CA`) and `POST` JSON to AWS Lambda Function URL `https://sgwyrqlzjwjj5ay7jyc6e6vqvu0jzimt.lambda-url.us-east-1.on.aws/`.
- Directly probing both URLs (`partner-application.html` and `individual-affiliate-application.html`) also returns **`HTTP/1.1 401 Unauthorized`** (`145 B` redirect to `/`).

### 4.2 Decision for T07 & T04
- **Are external SaaS forms already in use? NO.** Live `scripts/script.js` proves CCACT built **custom first-party HTML forms** on `theccact.com` wired to their own `FORMS_API` AWS Lambda endpoint, and did **not** link out to Google Forms / Typeform / Jotform.
- **Architectural consequence per PRD (`L96, L217`) & `task.md` (`T01, T07`):**
  1. **Both application forms (`Apply as an Organisation` and `Apply as an Individual`) MUST be included in T07**, alongside Contact, Mailing List, and Partner Intake forms.
  2. Before building T07 payloads or copying copy verbatim, **CCACT must either grant access to or supply the HTML source of `partners.html`, `partner-application.html`, and `individual-affiliate-application.html`** (plus confirm whether new partner-tagged submissions and intake submissions should target the existing AWS Lambda URL `FORMS_API` with updated CORS/payload handlers, or use a new form backend such as Formspree / Web3Forms / Pages Function).

---

## 5. Missing Inputs & Launch Blockers (Do Not Invent)

1. **Gated live Affiliates & Application HTML (`401 Unauthorized`):** Cannot inspect commission tiers, expectations, Affiliate Agreement copy, or form fields/declarations for `partners.html`, `partner-application.html`, and `individual-affiliate-application.html`.
2. **Real Teachable referral examples & format confirmation:** Need actual generated Teachable affiliate links from CCACT (especially tested against links with existing query params like `?sortKey=...&courseCategory=...`) — blocks `T05` implementation.
3. **Final approved copy & legal notices:** Pending CCACT final wording for:
   - Template partner-page disclaimer banner/footer notice (`PRD L27, L161, L229`),
   - Partner directory verification notice (`PRD L165`),
   - Updated Privacy Notice covering partner attribution/hidden enquiry fields if needed,
   - Affiliates commission schedule / Affiliate Agreement (PRD `L202` notes Affiliate Agreement not yet final).
4. **Partner launch records & assets:** Zero real partners in `src/data/partners.json`; need reviewed bios/descriptions, high-res photos/logos, roles, locations, contact emails, optional languages/services/org websites, `approvalDate`, `contentReviewedDate`, `partnerApprovedDate`, and partner lifecycle confirmation (`PRD L129` diagram still `embedded content`).
5. **Brand & copy consistency sign-offs:**
   - **Email:** Standardize `theccact@gmail.com` vs `info@theccact.online` (appears in `faq.html`) vs new custom `@theccact.com` address (`PRD L223`).
   - **Spelling / casing:** Confirm `Enrol Now` (UK/CA, mockup & PRD) vs `Enroll Now` (US, live site); Confirm `"for"` vs `"For"` in brand subtitle.
   - **Course catalog links:** Confirm whether HPC should have a `courseCategory` Teachable filter URL and whether ESL stays mailing-list-only for v1 launch.
   - **Visual imagery migration:** Confirm copying the 7 verified HTTP `200` `images/*.jpg` files from live `theccact.com` into Astro `public/images/` (and whether `images/doctors-desk.jpg` stays off the dark navy mockup Home hero).
6. **Build & Infrastructure blockers:**
   - `npm install` failed offline/network stall (`node_modules` has `0` items, `package-lock.json` missing, `astro` not installed) — blocks running `astro build`.
   - Form endpoint / recipient / CORS config for Contact (with hidden partner tag), Mailing List (`Stay Connected`), two Affiliate Applications (`T07`), and Intake (`T08`).
   - Cloudflare Pages preview authentication/access control (Cloudflare Access) before staging non-live partner records.

---

## 6. T02 Review Notes (`Agy -> Codex`)

Inspected Codex-owned files on `2026-11-19` without modifying any Codex files (`package.json`, `astro.config.mjs`, `src/data/partners.json`, `src/lib/partners.mjs`, `public/_headers`, `tests/partners.test.mjs`, `README.md`) and executed `& "C:\Program Files\nodejs\node.exe" --test "C:\Users\Asus\Desktop\Th ccact\tests\partners.test.mjs"` (`2/2` tests passed in `108ms`):

- **What works cleanly:**
  - `astro.config.mjs` build-start validation hook guarantees invalid `partners.json` aborts static output immediately.
  - `src/lib/partners.mjs` covers required PRD fields, strict slug regex, duplicate prevention, calendar-strict `YYYY-MM-DD` parsing (`2026-02-30` fails cleanly), `services` max 4 cap, org-only `https:` website validation, safe `/partner-images/` vs `https:` image URL validation, and `live`-only gating (`contentReviewedDate` + `partnerApprovedDate` checks match PRD approval rule!).
  - `public/_headers` enforces `X-Robots-Tag: noindex, nofollow` on `/partners/*`.
- **Gaps & interface notes for T02/T03/T05 coordination:**
  1. **Install blocker confirmed:** `node_modules/` exists with `0` entries, `astro` is absent, and `package-lock.json` does not exist yet. (`npm`/`node` also need PATH or `C:\Program Files\nodejs` invocation in this shell.) T03/T04 page builds remain blocked by `T02` completion.
  2. **PII / `email` leakage guard (`T04`/`T06`):** `partners.json` stores `email` (required) to route tagged enquiries. T03/T04 must ensure `email` is **never** rendered in client HTML / directory cards / partner bios unless CCACT explicitly requests public partner emails.
  3. **Organisation named contact & About nav label:** PRD L57 mentions an organisation supplies `"a logo, a company description and a named contact"` — verify in T02/T08 whether an optional `contactName` (organisations only) or `navLabel` is needed, because `About {{firstName}}` (`Main.dc.html`) only fits `type: 'individual'`.
  4. **Referral field evolution (`T05`):** Currently `referralCode` is a single non-empty string; Teachable's existing URLs already use query strings (`?sortKey=...&courseCategory=...`), and Codex flagged possible destination-specific affiliate path rules. T05 may need `referralUrl` / template rules alongside or derived from `referralCode`.
  5. **Defense in depth for noindex & redirects (`T02`/`T06`):** Keep `_headers` `X-Robots-Tag`, AND T03 `BaseLayout.astro` will emit `<meta name="robots" content="noindex, nofollow" />` on `/partners/*` routes plus exclude partner pages from any sitemap. Retired partner redirects will need `public/_redirects` generation or build-time static redirect files (`T02`/`T06`).
  6. **Empty-string/null coercion (`T08`):** Spreadsheet/form exports often leave optional columns as `""` or `null`; `validatePartners` currently checks `p.website !== undefined`, so intake conversion (`T08`) must strip empty optional keys before writing `partners.json`.
