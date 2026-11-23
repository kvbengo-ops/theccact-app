// Affiliate application questions, ported from the CCES application pages (individual and business).
// Written with CCACT; the CCES build swaps the name (astro.config.mjs). Rendered by AffiliateApplyForm.astro.
// Items: { p } paragraph, { h } subheading, { li } list, { field } input, { group } checkbox/radio set, { check } single required checkbox.
export const AFFILIATE_FORMS = {
  "individual": [
    {
      "title": "Personal & Professional Information",
      "items": [
        {
          "field": "fullLegalName",
          "label": "Full Legal Name",
          "type": "text",
          "required": true
        },
        {
          "field": "preferredName",
          "label": "Preferred/Public Name",
          "type": "text"
        },
        {
          "field": "email",
          "label": "Email Address",
          "type": "email",
          "required": true
        },
        {
          "field": "phone",
          "label": "Telephone/Mobile",
          "type": "tel"
        },
        {
          "field": "altEmail",
          "label": "Alternative Email Address",
          "type": "email"
        },
        {
          "field": "altPhone",
          "label": "Alternative Telephone Number",
          "type": "tel"
        },
        {
          "field": "city",
          "label": "City",
          "type": "text"
        },
        {
          "field": "province",
          "label": "Province/State",
          "type": "text"
        },
        {
          "field": "country",
          "label": "Country",
          "type": "text"
        },
        {
          "field": "professionalBackground",
          "label": "Professional or Educational Background",
          "type": "textarea"
        },
        {
          "field": "currentOccupation",
          "label": "Current Occupation/Role (if applicable)",
          "type": "text"
        },
        {
          "field": "employer",
          "label": "Employer/Organization (optional)",
          "type": "text"
        },
        {
          "field": "school",
          "label": "School/College/University (if applicable)",
          "type": "text"
        },
        {
          "field": "website",
          "label": "Website/Blog (if applicable)",
          "type": "url",
          "placeholder": "https://"
        },
        {
          "p": "Social Media / Online Communities Used Professionally"
        },
        {
          "field": "facebook",
          "label": "Facebook",
          "type": "text"
        },
        {
          "field": "instagram",
          "label": "Instagram",
          "type": "text"
        },
        {
          "field": "linkedin",
          "label": "LinkedIn",
          "type": "text"
        },
        {
          "field": "tiktok",
          "label": "TikTok",
          "type": "text"
        },
        {
          "field": "youtube",
          "label": "YouTube",
          "type": "text"
        },
        {
          "field": "whatsappOther",
          "label": "WhatsApp/Other",
          "type": "text"
        }
      ]
    },
    {
      "title": "Your Healthcare Connections",
      "items": [
        {
          "p": "Please select all that apply:"
        },
        {
          "group": "healthcareConnections",
          "type": "checkbox",
          "required": false,
          "options": [
            "Healthcare student",
            "Recent healthcare graduate",
            "Nurse / Practical Nurse",
            "PSW / Healthcare Support Worker",
            "Internationally Educated Nurse / Healthcare Professional",
            "Hospital or clinic employee",
            "Long-term care / community healthcare worker",
            "Healthcare educator / mentor",
            "Healthcare-focused content creator / social-media administrator",
            "Professional or community network organizer"
          ]
        },
        {
          "field": "healthcareConnectionsOther",
          "label": "Other",
          "type": "text"
        },
        {
          "p": "Who is in your network or audience?"
        },
        {
          "group": "networkAudience",
          "type": "checkbox",
          "required": false,
          "options": [
            "Nursing students",
            "Nursing graduates",
            "Internationally educated nurses",
            "PSWs / healthcare support workers",
            "Caregivers",
            "Hospital/clinic staff",
            "Other healthcare professionals",
            "People considering healthcare careers"
          ]
        },
        {
          "field": "networkAudienceOther",
          "label": "Other",
          "type": "text"
        },
        {
          "field": "networkSize",
          "label": "Approximate size of your professional/social network or audience",
          "type": "text"
        }
      ]
    },
    {
      "title": "How Do You Plan to Promote CCACT?",
      "items": [
        {
          "group": "promotionMethods",
          "type": "checkbox",
          "required": false,
          "options": [
            "Personal professional network",
            "Social media posts/content",
            "Healthcare student/graduate groups",
            "Direct referrals",
            "Professional networking",
            "Community groups",
            "Email/newsletter",
            "Educational events or webinars"
          ]
        },
        {
          "field": "promotionMethodsOther",
          "label": "Other",
          "type": "text"
        },
        {
          "field": "promotionDescription",
          "label": "Please describe how you intend to promote CCACT and the audience you intend to reach",
          "type": "textarea"
        },
        {
          "p": "Estimated number of students you may refer in your first 12 months"
        },
        {
          "group": "estimatedReferrals",
          "type": "radio",
          "required": false,
          "options": [
            "1–24",
            "25–49",
            "50–99",
            "100–199",
            "200+",
            "Unsure at this time"
          ]
        }
      ]
    },
    {
      "title": "Employer / School & Professional Boundaries",
      "items": [
        {
          "p": "Being employed by a hospital, clinic, school or other organization does not mean that organization is a CCACT affiliate or endorses CCACT. Individual affiliates must comply with their employer, school and professional rules regarding outside activities, solicitation, social media, conflicts of interest and use of organizational names, logos, email systems or premises."
        },
        {
          "group": "employerBoundaryAck",
          "type": "checkbox",
          "required": true,
          "options": [
            "I understand that I may not state or imply that my employer, school, hospital, clinic or professional regulator endorses CCACT without written authorization.",
            "I will not use confidential patient, client, student, employee or workplace information for affiliate marketing.",
            "I am responsible for determining whether my employer, school or professional obligations permit my affiliate activities."
          ]
        },
        {
          "field": "s4Initials",
          "label": "Affiliate Initials",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "title": "Website Directory Preference",
      "items": [
        {
          "p": "Approved individual affiliates may choose to have their professional name and appropriate public contact information listed in the CCACT Affiliate Directory. This can provide additional visibility to CCACT students and website visitors. Participation in the directory is optional."
        },
        {
          "group": "directoryPreference",
          "type": "radio",
          "required": true,
          "options": [
            "YES — CCACT may list my approved public/professional information in the Affiliate Directory.",
            "NO — Please do not list me in the public Affiliate Directory."
          ]
        },
        {
          "field": "publicName",
          "label": "Public name to display (if different)",
          "type": "text"
        },
        {
          "field": "publicProfile",
          "label": "Public website/social profile",
          "type": "text"
        },
        {
          "field": "publicContact",
          "label": "Public contact information (optional)",
          "type": "text"
        },
        {
          "field": "s5Initials",
          "label": "Affiliate Initials",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "title": "Commission Payment Information",
      "items": [
        {
          "p": "Payment Method"
        },
        {
          "p": "Commission payments are made via Wise.com only."
        },
        {
          "field": "wiseEmail",
          "label": "Wise Email Address",
          "type": "email",
          "required": true
        },
        {
          "field": "paymentPayeeName",
          "label": "Name to receive commission payments",
          "type": "text"
        },
        {
          "field": "paymentCountry",
          "label": "Country where payment will be received",
          "type": "text"
        }
      ]
    },
    {
      "title": "Professional Conduct, Suspension & Termination",
      "items": [
        {
          "p": "CCACT may suspend or terminate affiliate status and deactivate the personalized link for conduct including misinformation, misrepresentation, illegal or fraudulent activity, unauthorized guarantees, deceptive marketing, misuse of CCACT intellectual property, manipulation of referral tracking, privacy violations, or conduct that may expose students or CCACT to financial, legal or reputational harm."
        },
        {
          "p": "Eligible commissions through the effective termination date remain subject to verification, refunds, chargebacks, cancellations and disputes. If termination or suspension involves suspected misinformation, misconduct, fraud, student complaints or disputed activity, CCACT may hold potentially payable commissions for up to 60 days to allow refunds, chargebacks and related issues to be assessed. Ineligible, refunded, fraudulent or improperly attributed transactions do not qualify for commission."
        }
      ]
    },
    {
      "title": "Death of an Individual Affiliate",
      "items": [
        {
          "p": "If an individual affiliate dies, CCACT will reconcile eligible commissions. Subject to appropriate estate documentation and applicable adjustments, the affiliate's estate may receive eligible commissions earned through the month following the affiliate's death. The personalized affiliate link and status do not automatically transfer to another individual."
        }
      ]
    },
    {
      "title": "Applicant Acknowledgements",
      "items": [
        {
          "p": "By signing this application, I confirm that:"
        },
        {
          "group": "ack",
          "type": "checkbox",
          "required": true,
          "options": [
            "The information in this application is accurate and complete.",
            "I understand that application does not guarantee acceptance.",
            "I will represent CCACT accurately and use current approved information.",
            "I will provide prospective students access to applicable Terms and FAQs.",
            "I will not make unauthorized guarantees or representations.",
            "I understand how my personalized affiliate link is used for referral tracking.",
            "I understand commissions are subject to eligibility, reconciliation, refunds, cancellations and chargebacks.",
            "I understand the monthly reporting and payment process.",
            "I will comply with applicable employer/school/professional requirements and CCACT marketing standards.",
            "I understand affiliate status may be suspended or terminated for misconduct, misinformation, misrepresentation or other breaches.",
            "I understand final participation is governed by this affiliate agreement."
          ]
        }
      ]
    },
    {
      "title": "Applicant Declaration",
      "items": [
        {
          "p": "I certify that the information provided is true and complete to the best of my knowledge. If approved, I agree that participation in the CCACT Individual Affiliate Program is subject to this affiliate agreement and applicable program policies."
        },
        {
          "field": "declarationName",
          "label": "Full Legal Name (E-Signature)",
          "type": "text",
          "required": true,
          "placeholder": "Type your full legal name to sign"
        },
        {
          "field": "declarationDate",
          "label": "Date",
          "type": "text"
        },
        {
          "p": "By typing your name above and submitting this form, you are electronically signing this application."
        },
        {
          "check": "I confirm I am 18 years of age or older.",
          "required": true
        },
        {
          "h": "Non-Disclosure and Non-Compete"
        },
        {
          "p": "By signing below, I agree to keep all non-public information received through the CCACT Affiliate Program confidential and use it only for authorized affiliate activities."
        },
        {
          "p": "I will not copy, sell, share, or adapt course content or proprietary materials without written permission, except for approved promotional use. During and after my participation, I will not use these materials or confidential information to support competing courses or divert students, affiliates, or business associates to another provider."
        },
        {
          "p": "When my participation ends, I will stop representing CCACT and return or securely delete confidential information as requested, except records legally required to be retained. My confidentiality obligations continue while the information remains confidential."
        },
        {
          "group": "confidentialityAgree",
          "type": "checkbox",
          "required": true,
          "options": [
            "I have read and agree to these terms."
          ]
        }
      ]
    }
  ],
  "organisation": [
    {
      "title": "Applicant Information",
      "items": [
        {
          "field": "contactName",
          "label": "Applicant/Contact Name",
          "type": "text",
          "required": true
        },
        {
          "field": "companyName",
          "label": "Company/Organization Name",
          "type": "text"
        },
        {
          "field": "position",
          "label": "Position/Title",
          "type": "text"
        },
        {
          "field": "businessAddress",
          "label": "Business Address/ Mailing Address",
          "type": "text"
        },
        {
          "field": "city",
          "label": "City",
          "type": "text"
        },
        {
          "field": "province",
          "label": "Province/State",
          "type": "text"
        },
        {
          "field": "country",
          "label": "Country",
          "type": "text"
        },
        {
          "field": "postalCode",
          "label": "Postal/ZIP Code",
          "type": "text"
        },
        {
          "field": "businessPhone",
          "label": "Business Telephone",
          "type": "tel"
        },
        {
          "field": "mobilePhone",
          "label": "Mobile Telephone",
          "type": "tel"
        },
        {
          "field": "email",
          "label": "Email Address",
          "type": "email",
          "required": true
        },
        {
          "field": "altEmail",
          "label": "Alternative Email Address",
          "type": "email"
        },
        {
          "field": "altPhone",
          "label": "Alternative Telephone Number",
          "type": "tel"
        },
        {
          "field": "website",
          "label": "Website",
          "type": "url",
          "placeholder": "https://"
        },
        {
          "p": "Social Media Accounts/Pages Used for Business Promotion"
        },
        {
          "field": "facebook",
          "label": "Facebook",
          "type": "text"
        },
        {
          "field": "instagram",
          "label": "Instagram",
          "type": "text"
        },
        {
          "field": "otherSocial",
          "label": "Other",
          "type": "text"
        }
      ]
    },
    {
      "title": "About Your Business or Professional Practice",
      "items": [
        {
          "p": "Please select the category or categories that best describe your organization or professional activities:"
        },
        {
          "group": "categories",
          "type": "checkbox",
          "required": false,
          "options": [
            "Immigration Consultant / RCIC",
            "Immigration Law Firm",
            "International Education Agency",
            "Nursing School or College",
            "Healthcare/caregiver/PSW Training Organization",
            "Healthcare Recruitment Company",
            "Healthcare Staffing Agency",
            "ESL / Language Training Provider",
            "Hospital or Healthcare Organization",
            "Professional Association",
            "Community Organization",
            "Career Consultant",
            "Education Consultant"
          ]
        },
        {
          "field": "categoryOther",
          "label": "Other",
          "type": "text"
        },
        {
          "field": "yearsOperating",
          "label": "How many years has your organization/business been operating?",
          "type": "text"
        },
        {
          "p": "Approximately how many students, clients, candidates or healthcare professionals does your organization serve annually?"
        },
        {
          "group": "annualVolume",
          "type": "radio",
          "required": false,
          "options": [
            "Under 25",
            "25–49",
            "50–99",
            "100–199",
            "200–499",
            "500+"
          ]
        },
        {
          "field": "annualVolumeOther",
          "label": "Other",
          "type": "text"
        }
      ]
    },
    {
      "title": "Countries & Demographics You Serve",
      "items": [
        {
          "field": "primaryCountry",
          "label": "Primary country where your organization operates",
          "type": "text"
        },
        {
          "field": "countriesServed",
          "label": "Countries from which you currently serve or recruit students/clients",
          "type": "textarea"
        },
        {
          "p": "Which groups do you primarily serve?"
        },
        {
          "group": "groupsServed",
          "type": "checkbox",
          "required": false,
          "options": [
            "Internationally Educated Nurses",
            "Registered Nurses",
            "Practical Nurses",
            "Nursing Students",
            "Personal Support Workers / Healthcare Support Workers",
            "Caregivers",
            "Other Healthcare Professionals",
            "International Students",
            "Immigration Applicants",
            "Individuals considering a healthcare career"
          ]
        },
        {
          "field": "groupsServedOther",
          "label": "Other",
          "type": "text"
        },
        {
          "p": "Approximately how many potential students do you believe you could introduce to CCACT during your first 12 months?"
        },
        {
          "group": "potentialStudents",
          "type": "radio",
          "required": false,
          "options": [
            "1–24",
            "25–49",
            "50–99",
            "100–199",
            "200+",
            "Unsure at this time"
          ]
        }
      ]
    },
    {
      "title": "How Do You Intend to Promote CCACT?",
      "items": [
        {
          "p": "Proposed marketing methods:"
        },
        {
          "group": "marketingMethods",
          "type": "checkbox",
          "required": false,
          "options": [
            "Company Website",
            "Facebook",
            "Instagram",
            "LinkedIn",
            "WhatsApp",
            "Email Marketing",
            "Direct Client Referrals",
            "Seminars / Webinars",
            "Educational Events",
            "College or School Presentations",
            "Healthcare Recruitment Activities",
            "Professional Networking",
            "Printed Promotional Materials"
          ]
        },
        {
          "field": "marketingMethodsOther",
          "label": "Other",
          "type": "text"
        },
        {
          "field": "promotionPlan",
          "label": "Please briefly describe how you plan to promote CCACT programs",
          "type": "textarea"
        },
        {
          "field": "targetAudience",
          "label": "Describe the primary audience or demographic you intend to target",
          "type": "textarea"
        }
      ]
    },
    {
      "title": "Affiliate Website & Marketing Responsibilities",
      "items": [
        {
          "p": "CCACT wants prospective students to receive accurate and consistent information before enrolling. Affiliates who promote CCACT programs through their website, social media, advertising, email campaigns or other channels are expected to:"
        },
        {
          "li": [
            "Present CCACT and its programs accurately.",
            "Use current CCACT-approved program descriptions and promotional information.",
            "Clearly identify CCACT as the provider of the applicable CCACT programs.",
            "Provide prospective students with access to the applicable CCACT Terms and Conditions and Student FAQs, either directly or through an approved link to the current CCACT information.",
            "Ensure tuition, course duration, delivery format and other material information are current before publishing them.",
            "Clearly explain that CCACT programs are continuing education/professional development programs unless CCACT expressly identifies a particular program otherwise.",
            "Not guarantee employment, immigration results, professional licensing, registration, examination success, certification recognition or any other outcome that CCACT has not expressly guaranteed in writing.",
            "Promptly correct or remove information if CCACT advises that it is inaccurate, misleading, outdated or unauthorized.",
            "Use the affiliate's personalized referral link when directing prospective students to CCACT."
          ]
        },
        {
          "field": "s5Initials",
          "label": "Affiliate Initials",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "title": "CCACT Website Directory",
      "items": [
        {
          "p": "As an additional affiliate benefit, CCACT may publish the affiliate's business or professional information in the CCACT Affiliate Directory. Unless the affiliate requests otherwise, CCACT may display: affiliate or company name, website, business telephone number, general business email/contact information, country or region served, and a general description of services."
        },
        {
          "p": "This provides affiliates with additional exposure to CCACT students and website visitors."
        },
        {
          "p": "Website Directory Preference"
        },
        {
          "group": "directoryPreference",
          "type": "radio",
          "required": true,
          "options": [
            "YES — CCACT may list my/company information in the Affiliate Directory.",
            "NO — Please do not publish my/company contact information on the CCACT website."
          ]
        },
        {
          "field": "s6Initials",
          "label": "Affiliate Initials",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "title": "Personalized Affiliate Link",
      "items": [
        {
          "p": "Once approved, the affiliate will receive a personalized affiliate referral link through the CCACT online learning platform. The affiliate should use this link whenever directing prospective students to CCACT. Eligible student enrollments attributed to the affiliate through the applicable tracking process will be used to calculate referral commissions. The affiliate understands that CCACT cannot guarantee manual attribution of a referral when a prospective student does not use the appropriate affiliate link or referral process."
        },
        {
          "field": "s7Initials",
          "label": "Affiliate Initials",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "title": "Commission Reporting & Payment",
      "items": [
        {
          "p": "CCACT will provide affiliates with a monthly referral activity report, expected to be issued on or about the 1st day of each month covering: eligible enrollments, applicable tuition collected, refunds or cancellations, adjustments, applicable commission level and estimated commission payable."
        },
        {
          "p": "Subject to reconciliation, commissions for the previous month will normally be paid on or about the 15th day of the following month. Before commission is released, CCACT may verify successful payment of tuition, refunds, cancellations, chargebacks, duplicate or disputed referrals, affiliate attribution and other adjustments affecting commission eligibility. Only eligible tuition actually received and retained by CCACT will qualify for commission unless otherwise stated in this affiliate agreement."
        }
      ]
    },
    {
      "title": "Commission Payment Information",
      "items": [
        {
          "p": "Payment Method"
        },
        {
          "p": "Commission payments are made via Wise.com only."
        },
        {
          "field": "wiseEmail",
          "label": "Wise Email Address",
          "type": "email",
          "required": true
        },
        {
          "field": "paymentPayeeName",
          "label": "Name of Individual or Business to Receive Commission Payments",
          "type": "text"
        },
        {
          "field": "paymentCountry",
          "label": "Country Where Payment Will Be Received",
          "type": "text"
        },
        {
          "p": "The affiliate is responsible for providing accurate payment information and advising CCACT promptly of any changes."
        }
      ]
    },
    {
      "title": "Professional Conduct & Prohibited Activities",
      "items": [
        {
          "p": "CCACT Affiliates are expected to conduct themselves professionally, ethically and lawfully. Affiliate status may be suspended or terminated where CCACT reasonably believes an affiliate has:"
        },
        {
          "li": [
            "Provided false, inaccurate or misleading information to prospective students.",
            "Misrepresented CCACT, its programs, certificates, recognition or services.",
            "Guaranteed employment, immigration status, professional licensing, examination success or other outcomes.",
            "Engaged in fraudulent, deceptive, unlawful or unethical activity connected with the promotion of CCACT.",
            "Collected unauthorized fees or represented themselves as authorized to collect CCACT tuition when they are not.",
            "Misused the CCACT name, logo, course materials, intellectual property or marketing materials.",
            "Created unauthorized advertisements, websites or social media content that could damage or misrepresent the CCACT brand.",
            "Used spam, deceptive advertising or inappropriate marketing practices.",
            "Failed to comply with applicable privacy, advertising, consumer protection or professional requirements.",
            "Failed to correct inaccurate information after being notified by CCACT.",
            "Attempted to manipulate referral tracking or commission calculations.",
            "Engaged in conduct that may reasonably expose students or CCACT to financial, legal or reputation harm.",
            "Materially breached this affiliate agreement or program requirements."
          ]
        },
        {
          "p": "CCACT may suspend an affiliate link while investigating a potential violation. Where necessary to protect students, CCACT or the integrity of the program, CCACT may immediately deactivate an affiliate's personalized referral link."
        }
      ]
    },
    {
      "title": "Termination & Outstanding Commissions",
      "items": [
        {
          "p": "Either CCACT or the affiliate may terminate the affiliate relationship in accordance with this affiliate agreement. Upon termination, the affiliate's personalized referral link may be deactivated and no new referrals will qualify after the effective termination date unless CCACT confirms otherwise in writing. Eligible commissions earned up to the effective date of termination will remain subject to verification, refunds, chargebacks, cancellations, disputes and other applicable adjustments."
        },
        {
          "p": "Standard Termination: Where the relationship ends in good standing, verified outstanding commissions will be paid according to the normal payment process or within the period specified in this affiliate agreement."
        },
        {
          "p": "Termination Involving Misrepresentation, Misconduct or Disputed Activity: If an affiliate is terminated or suspended because of suspected misinformation, misrepresentation, misconduct, fraudulent activity, disputed referrals, student complaints or another matter requiring investigation, CCACT may hold otherwise potentially payable commissions for up to 60 days following termination, to allow sufficient time to identify student refund requests, chargebacks, complaints, disputed transactions or other adjustments related to the affiliate's activities. At the end of the review period, any commission determined by CCACT to be legitimately earned and payable will be reconciled and paid, subject to applicable deductions and this affiliate agreement. Nothing in this provision requires CCACT to pay commission on transactions that are fraudulent, refunded, charged back, cancelled, improperly attributed or otherwise ineligible under this affiliate agreement."
        }
      ]
    },
    {
      "title": "Death of an Individual Affiliate",
      "items": [
        {
          "p": "If an affiliate operating as an individual dies, CCACT will reconcile commissions legitimately earned through the applicable period. Subject to verification and receipt of appropriate estate documentation, the affiliate's estate will be entitled to eligible commissions earned through the month following the affiliate's death, subject to refunds, chargebacks, cancellations and other applicable adjustments. The deceased affiliate's personalized referral link and affiliate status will not automatically transfer to another individual."
        },
        {
          "p": "Affiliate Operated Through a Company: Where the affiliate relationship is held through a corporation or other legal business entity, the death of an individual director, owner or representative does not automatically transfer affiliate rights to another person. A surviving director, owner or authorized representative of the company may apply to CCACT to continue or maintain the company's affiliate status. CCACT will review the request and may require updated corporate, contact, banking and authorization information before approving continued participation."
        }
      ]
    },
    {
      "title": "Affiliate Acknowledgements",
      "items": [
        {
          "p": "By signing this application, I confirm that:"
        },
        {
          "group": "ack",
          "type": "checkbox",
          "required": true,
          "options": [
            "The information provided in this application is accurate and complete.",
            "I understand that submitting this application does not guarantee acceptance.",
            "I understand that CCACT may require additional information before approving the application.",
            "I will represent CCACT and its programs accurately.",
            "I will provide prospective students with access to applicable CCACT Terms and FAQs.",
            "I will not make unauthorized guarantees or representations.",
            "I understand how the personalized affiliate referral link is used for tracking.",
            "I understand that commissions are subject to eligibility, reconciliation, refunds, cancellations and chargebacks.",
            "I understand the monthly reporting and commission payment process.",
            "I agree to comply with CCACT marketing and brand requirements.",
            "I understand that affiliate status may be suspended or terminated for misconduct, misinformation, misrepresentation or other breaches.",
            "I understand that final participation is governed by this affiliate agreement."
          ]
        }
      ]
    },
    {
      "title": "Applicant Declaration",
      "items": [
        {
          "p": "I certify that the information provided in this application is true and complete to the best of my knowledge. I understand that, if approved, participation in the CCACT Affiliate Program will be subject to this affiliate agreement and applicable program policies."
        },
        {
          "field": "declarationName",
          "label": "Full Legal Name (E-Signature)",
          "type": "text",
          "required": true,
          "placeholder": "Type your full legal name to sign"
        },
        {
          "field": "declarationCompany",
          "label": "Company",
          "type": "text"
        },
        {
          "field": "declarationTitle",
          "label": "Title/Position",
          "type": "text"
        },
        {
          "field": "declarationDate",
          "label": "Date",
          "type": "text"
        },
        {
          "p": "By typing your name above and submitting this form, you are electronically signing this application."
        },
        {
          "check": "I confirm I am 18 years of age or older.",
          "required": true
        },
        {
          "h": "Non-Disclosure and Non-Compete"
        },
        {
          "p": "By signing below, I agree to keep all non-public information received through the CCACT Affiliate Program confidential and use it only for authorized affiliate activities."
        },
        {
          "p": "I will not copy, sell, share, or adapt course content or proprietary materials without written permission, except for approved promotional use. During and after my participation, I will not use these materials or confidential information to support competing courses or divert students, affiliates, or business associates to another provider."
        },
        {
          "p": "When my participation ends, I will stop representing CCACT and return or securely delete confidential information as requested, except records legally required to be retained. My confidentiality obligations continue while the information remains confidential."
        },
        {
          "group": "confidentialityAgree",
          "type": "checkbox",
          "required": true,
          "options": [
            "I have read and agree to these terms."
          ]
        }
      ]
    }
  ]
};
