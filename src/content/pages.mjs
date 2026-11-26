import { BRAND, TEACHABLE_CATALOG_URL } from './site.mjs';
import { SITE_BRAND } from '../lib/links.mjs';

export const ABOUT_PAGE = {
  title: 'About CCACT',
  description:
    'Learn about the Canadian Centre For Advanced Career Training — our mission, leadership, and continuing education standards.',
  hero: {
    eyebrow: 'Established 2012 · Toronto, Canada',
    title: 'About CCACT',
    lead: 'Our mission, our team, and the story behind The Canadian Centre For Advanced Career Training.',
  },
  missionHeading: 'Our Mission',
  missionQuote:
    '“Our mission is to help students build their skills in the health and wellness field to serve their community as successful, competent and confident practitioners.”',
  missionParagraphs: [
    'Established in 2012, the Canadian Centre For Advanced Career Training (CCACT) is dedicated to providing high-quality online continuing education and professional development for healthcare professionals.',
    'Our certificate and review courses are designed for internationally educated student nurses, practical nurses, registered nurses, and Personal Support Workers (PSWs) who are looking to expand their knowledge and support their ongoing professional development.',
    "CCACT's founders are educators with more than 25 years of experience owning and operating a private healthcare college in Canada and internationally. This experience has shaped our commitment to delivering practical, affordable, and accessible continuing education that meets the evolving needs of today's nursing industry.",
    'Our courses are offered entirely online and are self-paced, allowing busy healthcare professionals to learn whenever and wherever it is convenient. Whether you are preparing to enter the Canadian healthcare system, refreshing your knowledge, preparing for employment, or pursuing continuing education to advance your career, our programs are designed to support your professional goals.',
    'At CCACT, we believe that lifelong learning is essential to providing exceptional patient care. We are proud to help healthcare professionals build confidence, expand their expertise, and continue making a meaningful difference in the communities they serve.',
  ],
  pillars: [
    {
      title: 'Quality Courses',
      body: 'Over 50 online courses built around Canadian healthcare standards and best practices.',
    },
    {
      title: 'Student-Focused',
      body: 'A supportive learning environment that meets you wherever you are in your journey.',
    },
    {
      title: 'Global Accessibility',
      body: 'Study from anywhere in the world — no relocation required to get a Canadian education.',
    },
  ],
  collegeMessage: {
    heading: 'A Message From Our College',
    paragraphs: [
      'Thank you for visiting our online college. Our team is passionate about personal and professional development, and all of our courses were designed with that in mind.',
      'Whether you have previous training in Canada or abroad, or you are just starting your career in health care, we want to help you on this very rewarding journey.',
      'At CCACT we are proud to offer quality courses that are accessible and affordable, and within a student-focused environment that aims to support your unique goals.',
    ],
    signoff: 'Sincerely, The Staff & Faculty of CCACT',
  },
  directorsSection: {
    heading: 'Our Directors',
    lead: 'Founded by Jean Robles and Jeanelle Robles in 2012, CCACT is guided by a family-led team with experience in education, student support, collaboration, business development, and community engagement. Together, our directors are committed to providing accessible online learning and creating new educational opportunities in Canada and internationally.',
    members: [
      {
        name: 'Jean McInnes Robles',
        role: 'Co-Founder & International Executive Director',
        photo: '/images/jean-mcinnes-robles.jpg',
        width: 574,
        height: 646,
        bio: "Jean co-founded CCACT with her daughter, Jeanelle, in 2012. For 25 years, she owned and operated Robetech Institute, a private medical career college in Toronto. Her extensive experience in healthcare education, college operations, international collaboration, and program development guides CCACT's educational direction and international growth.",
      },
      {
        name: 'Jeanelle Robles',
        role: 'Co-Founder & National Executive Director',
        photo: '/images/jeanelle-robles.jpg',
        width: 574,
        height: 646,
        bio: "Jeanelle co-founded CCACT with her mother, Jean, in 2012. She previously served as Vice President and National Director of Robetech Institute and has substantial experience in educational administration and program development. She continues to work alongside Jean in designing educational programs and leading CCACT's Canadian operations.",
      },
      {
        name: 'Yvonne Sanchez',
        role: 'Director of Student Success',
        photo: '/images/yvonne-sanchez.jpg',
        width: 574,
        height: 646,
        bio: 'Yvonne brings experience in administration, client relations, and entrepreneurship. She has worked alongside Edward in supporting the administration and client service needs of his business and has also owned and operated her own health-and-wellness products business. Her background helps her provide students and clients with a welcoming, organized, and supportive experience.',
      },
      {
        name: 'Edward Robles',
        role: 'Director of Community Partnerships',
        photo: '/images/edward-robles.jpg',
        width: 574,
        height: 646,
        bio: "Edward previously worked with Robetech Institute and brings practical experience in business operations and client service. In 2016 he established and has operated his own general contracting company, where he has worked as a project manager overseeing client relationships, projects, and day-to-day operations. His business experience supports CCACT's community relationships and future development.",
      },
    ],
  },
  cta: {
    heading: 'Ready to Get Started?',
    lead: 'Browse our course catalog and begin your continuing education journey today.',
    primaryLabel: 'View Courses',
    secondaryLabel: 'Contact Us',
  },
};

// CCES leadership copy, from the live CCES About page (CCES was established in 2022, so the CCACT founding story does not apply).
if (SITE_BRAND === 'cces') {
  const [jean, jeanelle, yvonne, edward] = ABOUT_PAGE.directorsSection.members;
  ABOUT_PAGE.directorsSection = {
    heading: 'Leadership Team',
    lead: 'At the Canadian Centre of Emerging Studies (CCES), our leadership team brings together experience in healthcare education, student support, community engagement, and cross-sector collaboration. Together, we are committed to providing accessible, high-quality online continuing education opportunities for healthcare professionals.',
    members: [
      { ...jean, name: 'Jean McInnes-Robles', role: 'International Executive Director', bio: "Jean provides strategic leadership for CCES and brings more than 35 years of experience in healthcare education and private college operations in Canada and internationally. She oversees the organization's vision, educational direction, external relationships, and commitment to quality professional development." },
      { ...jeanelle, role: 'National Executive Director – Director of National Partnerships', bio: "Jeanelle leads CCES's work with healthcare organizations, educational institutions, employers, and community organizations to expand learning opportunities and strengthen professional connections across Canada and internationally." },
      { ...yvonne, role: 'Director of Student Success & Client Experience', bio: 'Yvonne and her team support learners throughout their CCES journey by providing enrollment assistance, student guidance, and ongoing client support. She is committed to ensuring students receive a positive, welcoming, and successful online learning experience.' },
      { ...edward, name: 'Edward (Eddie) Robles', role: 'Community Outreach Director', bio: 'Eddie supports CCES community engagement initiatives by building relationships with community organizations, healthcare networks, and professional groups. He helps increase awareness of CCES programs and connects learners with opportunities for professional growth.' },
    ],
  };
}

export const COURSES_PAGE = {
  title: 'Online Courses — CCACT',
  description:
    'Browse 50+ online courses in gerontology nursing, Canadian healthcare, nursing exam review, hospice & palliative care, diagnostic modalities, and English communication skills.',
  hero: {
    eyebrow: 'Continuing Education Catalog',
    title: 'Online Courses',
    lead: 'A Certificate of Completion is issued upon successful completion for all the courses listed below unless otherwise noted.',
    ctaLabel: 'Browse All Courses on Teachable',
  },
  highlights: [
    'For health care professionals',
    'Immediate access upon enrollment',
    '100% online — study anywhere, anytime',
    'Built around Canadian standards',
  ],
  categories: [
    {
      id: 'gerontology',
      title: 'Gerontology Nursing',
      lead: 'Students will be introduced to the role of the Geriatric Nurse. Topics include health promotion strategies and common health conditions in the aging population.',
      seriesTitle: 'Gerontology Nursing Series',
      seriesSubtitle: '9-course comprehensive program covering all major aspects of geriatric care',
      courses: [
        { code: 'GN 101', title: 'Introduction to Geriatric Nursing: Screening & Assessments' },
        { code: 'GN 102', title: 'Introduction to Health & Wellness Promotion for the Aging Client' },
        { code: 'GN 103', title: 'Introduction to Common Health Conditions in the Aging Population' },
        { code: 'GN 104', title: 'Introduction to Pulmonary Health Conditions in the Aging Population' },
        { code: 'GN 105', title: 'Introduction to Neurological & Mental Health Conditions in the Aging Population' },
        { code: 'GN 106', title: 'Introduction to Hematological & Immunological Health Conditions in the Aging Population' },
        { code: 'GN 107', title: 'Introduction to Cardiac Health Conditions in the Aging Population' },
        { code: 'GN 108', title: 'Introduction to Gastrointestinal Health Conditions in the Aging Population' },
        { code: 'GN 109', title: 'Introduction to Genitourinary Health Conditions in the Aging Population' },
        { code: 'GN.BC', title: 'Gerontology Nursing Bundle Course — Includes all 9 GN courses', isBundle: true },
      ],
      detailTitle: "What You'll Learn",
      bullets: [
        'The role and responsibilities of the Geriatric Nurse',
        'Health promotion strategies for aging clients',
        'Pulmonary, cardiac, and neurological conditions',
        'Mental health issues in aging populations',
        'Hematological and immunological health',
        'Gastrointestinal and genitourinary conditions',
        'Comprehensive screening and assessment techniques',
      ],
      primaryCta: {
        label: 'Browse & Enroll on Teachable',
        teachableUrl:
          'https://thecces.teachable.com/l/products?sortKey=recommended&sortDirection=asc&courseCategory=Gerontology+Nursing',
      },
    },
    {
      id: 'nursing-exam',
      title: 'Canadian Registered Nurse Exam Review',
      lead: 'These courses will help nurse graduates prepare for the Canadian Nursing Exam with exam writing techniques and comprehensive practice exam guides.',
      seriesTitle: 'CRNE Review Series',
      seriesSubtitle: '7-course preparation program plus practice exams for the Canadian Nursing Exam',
      courses: [
        { code: 'CRNER-101', title: 'Exam Writing Strategies' },
        { code: 'CRNER-102', title: 'Nursing Competency Categories' },
        { code: 'CRNER-103', title: 'A Guide for Nursing Students: Fast Facts for Quick Study' },
        { code: 'CRNER-104', title: 'Individual Study Guides and Nursing Interventions' },
        { code: 'CRNER-105', title: 'Review of the Body Systems & Terminology' },
        { code: 'CRNER-106', title: 'Practice Nursing Exam (3 attempts)' },
        { code: 'CRNER-107', title: 'Practice Nursing Exam (8 attempts)' },
        { code: 'CRNER.BC', title: 'CRNE Review Bundle Course', isBundle: true },
      ],
      detailTitle: 'Who Is This For?',
      bullets: [
        'Internationally trained nurses seeking Canadian licensure',
        'Nurse graduates preparing for first-time exam',
        'Nurses requiring exam retake preparation',
        'Anyone seeking structured, guided exam review',
      ],
      callout: 'Practice Exams Available: CRNER-106 (3 attempts) and CRNER-107 (8 attempts) give you real exam simulation to build confidence.',
      primaryCta: {
        label: 'Browse & Enroll on Teachable',
        teachableUrl:
          'https://thecces.teachable.com/l/products?sortKey=recommended&sortDirection=asc&courseCategory=Canadian+Nursing+Exam+Review',
      },
    },
    {
      id: 'healthcare',
      title: 'Canadian Health Care System',
      lead: 'Students will learn the Canadian standards and regulations in health care, including ethics & informed consent, and nurse-client relationships.',
      seriesTitle: 'Canadian Health Care Standards',
      seriesSubtitle: '4 core courses on Canadian healthcare regulations and ethics',
      courses: [
        { code: 'CHS101', title: 'Nursing in Canada' },
        { code: 'CHS102', title: 'Ethics & Informed Consent' },
        { code: 'CHS103', title: 'Nurse-Client Relationship' },
        { code: 'CHS104', title: 'Legal Implications, Medical Administration & Documentation' },
        { code: 'CHS.BC', title: 'Canadian Health Care System Bundle Course', isBundle: true },
      ],
      detailTitle: 'CHS Bundle',
      detailParagraph:
        'The CHS.BC bundle includes all 4 Canadian Health Care System courses. Upon completion, you will receive a Certificate of Completion listing each course title.',
      callout: 'Bundle Price: CAD $149 — Includes CHS101 through CHS104 with immediate access upon enrollment.',
      primaryCta: {
        label: 'Enroll in CHS Bundle — $149',
        teachableUrl:
          'https://thecces.teachable.com/l/products?sortKey=recommended&sortDirection=asc&courseCategory=Canadian+Health+Care+System',
      },
      secondaryTeachableCta: {
        label: 'Browse Individual Courses',
        teachableUrl:
          'https://thecces.teachable.com/l/products?sortKey=recommended&sortDirection=asc&courseCategory=Canadian+Health+Care+System',
      },
    },
    {
      id: 'palliative',
      title: 'Hospice & Palliative Care',
      lead: 'Students will learn about compassionate end-of-life care within the Canadian healthcare context, including ethics and symptom management.',
      seriesTitle: 'Hospice & Palliative Care Series',
      seriesSubtitle: '2-course program on ethics and symptom management in end-of-life care',
      courses: [
        { code: 'HPC101', title: 'Hospice & Palliative Care: Ethics in Modern Medicine' },
        { code: 'HPC102', title: 'Hospice & Palliative Care: Symptoms Management' },
        { code: 'HPC.BC', title: 'Hospice & Palliative Care Bundle Course', isBundle: true },
      ],
      detailTitle: "What You'll Learn",
      bullets: [
        'Ethical principles in modern hospice and palliative care',
        'Symptom assessment and management strategies',
        'Compassionate patient and family communication',
        'Canadian standards for end-of-life care',
      ],
      primaryCta: {
        label: 'Browse & Enroll on Teachable',
        teachableUrl: TEACHABLE_CATALOG_URL,
      },
    },
    {
      id: 'diagnostics',
      title: 'Diagnostic Modalities',
      lead: 'Students will learn the theoretical components to perform various diagnostic modalities including Electrocardiography, Phlebotomy, and IV Therapy.',
      seriesTitle: 'Diagnostic Modalities (Theoretical)',
      seriesSubtitle: 'Theoretical foundations for key clinical diagnostic procedures',
      courses: [
        { code: 'DM.101', title: 'Introduction to Electrocardiography' },
        { code: 'DM.102', title: 'Introduction to Phlebotomy' },
        { code: 'DM.103', title: 'IV Training: Peripheral Intravenous Therapy Initiation' },
        { code: 'DM.BC', title: 'Diagnostic Modalities Bundle Course', isBundle: true },
      ],
      detailTitle: 'Important Note',
      detailParagraph:
        'These courses cover the theoretical components of diagnostic modalities. Students will learn the underlying principles and knowledge required to perform ECG, phlebotomy, and IV therapy procedures.',
      callout:
        'Recommended: Prior practical experience in a clinical setting is beneficial but not required for enrollment.',
      primaryCta: {
        label: 'Enroll in DM Bundle',
        teachableUrl:
          'https://thecces.teachable.com/l/products?sortKey=recommended&sortDirection=asc&courseCategory=Diagnostic+Modalities',
      },
      secondaryInternalPage: {
        label: 'Ask an Advisor',
        pageKey: 'contact',
      },
    },
  ],
  eslSection: {
    id: 'esl',
    title: 'English Communication Skills for Healthcare Professionals',
    lead: "Strong communication skills are essential for success in today's global healthcare environment. Whether your goal is to prepare for the CELPIP examination, strengthen your professional English skills, or communicate confidently with patients, families, and healthcare teams, CCACT English Communication Skills for Healthcare Professionals is designed specifically for internationally trained nurses and healthcare professionals.",
    seriesTitle: 'CCACT English Communication Skills',
    seriesSubtitle: 'Professional English training built specifically for healthcare careers',
    photo: '/images/english-communication-skills.jpg',
    photoAlt: 'Physician speaking with a patient during a clinical consultation',
    photoWidth: 900,
    photoHeight: 651,
    modules: [
      'Professional English for Healthcare Settings',
      'Patient-Centered Communication',
      'Professional Documentation and Report Writing',
      'Grammar, Pronunciation, and Vocabulary Development',
      'Speaking and Listening: Real-Life Healthcare Scenarios',
      'Reading Comprehension for Healthcare Professionals',
      'CELPIP Preparation Strategies, Practice Exercises & Mock Testing',
    ],
    detailTitle: 'About This Program',
    paragraphs: [
      'Unlike general English language courses, our program focuses on the communication skills required in healthcare settings. Participants will develop their speaking, listening, reading, and writing abilities while building confidence in professional communication, patient interactions, documentation, and workplace conversations.',
      'Developed by experienced Canadian healthcare professionals and educators, the curriculum is designed to support learners pursuing careers in Canada and other English-speaking countries, providing practical language skills relevant across various healthcare environments.',
    ],
    celpipNote:
      'CELPIP Preparation: As part of our long-term vision, CCACT is developing a comprehensive English language program that will include CELPIP preparation courses and is working toward becoming an approved CELPIP Preparation and Testing Centre, with the goal of offering both preparation and official testing in India and Canada, subject to approval.',
    expandingTitle: 'Expanding Our English Language Department',
    expandingBody:
      'We are currently expanding our curriculum and look forward to welcoming students from around the world. Join our mailing list to receive updates on course launches, CELPIP preparation programs, and future testing opportunities.',
    ctaLabel: 'Join Our Mailing List',
  },
  bottomCta: {
    heading: 'Ready to Start Learning?',
    lead: 'All courses are hosted on our secure Teachable platform. Registration is open 24/7 — get immediate access upon enrollment.',
    primaryLabel: 'Browse All Courses on Teachable',
    secondaryLabel: 'Talk to an Advisor',
  },
};

export const REGISTRATION_PAGE = {
  title: 'Registration — CCACT',
  description:
    'Learn how enrollment works on Teachable, admission requirements, prerequisites, and 24/7 online access at CCACT.',
  hero: {
    eyebrow: '24/7 Open Enrollment',
    title: 'Registration',
    lead: 'Enroll in minutes — enter your email and payment method for immediate access to your study material.',
    primaryLabel: 'Browse Courses on Teachable',
    secondaryLabel: 'View Course Catalog',
  },
  stepsHeading: 'How Enrollment Works',
  stepsLead: 'Simply select the course you want from our list — the whole process takes just a few minutes.',
  steps: [
    { num: '1', title: 'Choose Your Course', body: 'Browse our catalog and select the course that fits your goals.' },
    { num: '2', title: 'Click to Register', body: "You'll be taken directly to our secure Teachable learning platform." },
    { num: '3', title: 'Enter Your Details', body: "Just your email address and payment method — that's all that's required." },
    { num: '4', title: 'Start Learning Immediately', body: 'Your registration is complete with immediate access to your study material.' },
  ],
  photo: {
    src: '/images/registration-student.jpg',
    alt: 'Student holding study materials in a computer lab',
    width: 900,
    height: 555,
  },
  openCard: {
    title: 'Open 24 Hours a Day',
    body: "Registration is open 7 days a week, 24 hours a day. Enroll whenever it's convenient for you.",
    note: 'Creating an account on Teachable does not enroll you in a course or result in any charge.',
  },
  whoCanEnroll: {
    heading: 'Who Can Enroll?',
    body: 'Courses are open to anyone interested in healthcare and wellness, with most requiring no prerequisites. Students should be comfortable reading and understanding written English. Some advanced courses may suit those with healthcare backgrounds.',
  },
  requirements: {
    heading: 'Admission Requirements',
    lead: 'Our courses are designed for those with a health care background or career path in mind.',
    cards: [
      { title: 'Health Care Focus', body: 'Course content assumes familiarity with health care concepts and terminology.' },
      { title: 'International Students Welcome', body: 'Open to students around the world.' },
      { title: 'All Career Stages', body: 'Whether beginning or continuing professional development.' },
    ],
    notes: [
      {
        label: 'Prerequisites:',
        text: 'Unless otherwise stated, there are no formal prerequisites for enrollment. Our courses are designed for nursing students, Practical Nurses (LPN/RPN), Registered Nurses (RN), Personal Support Workers (PSWs), Internationally Educated Nurses (IENs), and other health care professionals seeking continuing education and professional development.',
      },
      {
        label: 'Note for Diagnostic Modality Courses:',
        text: 'DM.101, DM.102, and DM.103 are theoretical courses only. Prior practical training or work experience is recommended but not required.',
      },
    ],
  },
  futureNote: {
    heading: 'A Note to Future Students',
    body: 'We are so excited to have you join us! If you have any questions please reach out to one of our knowledgeable academic advisors.',
    ctaLabel: 'Contact Us',
  },
  advisorBand: {
    heading: 'Need Help Choosing a Course?',
    body: 'Contact our student support team and tell us about your education, experience, and learning goals.',
    ctaLabel: 'Send an Inquiry',
  },
};

export const STUDY_IN_CANADA_PAGE = {
  title: 'Study in Canada — CCACT',
  description:
    'Learn about study and Canadian immigration consulting services provided separately through Jean Robles Immigration Consulting.',
  hero: {
    eyebrow: 'International Pathways & Immigration',
    title: 'Study in Canada',
    lead: 'Make your dream of studying and living in Canada a reality — with expert immigration support every step of the way.',
  },
  portrait: {
    src: '/images/jean-mcinnes-robles.jpg',
    alt: 'Jean McInnes Robles, International Executive Director of CCACT',
    width: 574,
    height: 646,
  },
  greeting: 'Hello!',
  paragraphs: [
    'I am Jean McInnes-Robles, the International Executive Director of CCACT. I am also a licensed Canadian Immigration Consultant since 2016 and have worked with international students for over 35 years.',
    'Since launching my immigration practice, I have had the pleasure to work alongside a diverse range of clients — including those in IT, photography, the TV and film industry, skilled trades, athletes and of course, the health field.',
    'I wanted to be a licensed immigration consultant to help clients just like you make your dream of studying in Canada a reality.',
    'For those of you in health care who require our immigration services, you will have access to several of our online courses for FREE while your application is being processed.',
  ],
  signoff: 'We look forward to getting to know you.',
  websiteUrl: 'https://jeanrobles.com',
  websiteLabel: 'Visit www.jeanrobles.com',
  experienceHeading: 'My Experience',
  experienceBody:
    '25 years as president and co-founder of Robetech Institute, a Toronto medical career college, plus international educational program development in the Philippines. This background inspired the creation of CCACT for online continuing education.',
  contactHeading: 'Get in Touch with Jean',
  separationNotice:
    'Whether you have questions about immigration services, want to learn about available courses, or discuss your options — Jean is happy to connect. Immigration services operate separately through Jean Robles Immigration Consulting.',
  email: 'immigration@jeanrobles.com',
  textPhone: '+1 416-893-8158 (text only)',
};

export const FAQ_PAGE = {
  title: 'Frequently Asked Questions — CCACT',
  description:
    'Answers about CCACT online courses, eligibility, self-paced format, certificates, licensing, fees, and enrollment policies.',
  hero: {
    eyebrow: 'Student Help Center',
    title: 'Frequently Asked Questions',
    lead: 'Answers about how CCACT online continuing education courses work, eligibility, certificates, and policies.',
  },
  introNotice:
    'CCACT online courses are designed primarily for internationally educated nurses, nursing students, PSWs, caregivers and other healthcare professionals. They may also be of interest to individuals who are considering a future career in healthcare.',
  sections: [
    {
      id: 'about',
      label: 'About Our Courses',
      title: 'About Our Courses',
      items: [
        {
          q: 'Why am I directed to Teachable.com when I register?',
          a: 'CCACT uses Teachable as its secure online learning platform. Course registration, payment and access to purchased course materials are completed through our CCACT Teachable school.',
        },
        {
          q: 'What are CCACT courses?',
          a: 'Courses offer fully online, self-paced continuing-education for various learners, helping expand knowledge and build confidence. They do not award diplomas, degrees, licenses, or regulated qualifications.',
        },
        {
          q: 'Who can take the courses?',
          a: 'Programs are open to anyone interested in healthcare and wellness. Most require no prior education or admission. Students must read and understand English well enough to complete the course materials and assessments.',
        },
        {
          q: 'Do I need to be a nurse or healthcare professional?',
          a: 'No formal healthcare training is required. Courses provide continuing education but do not substitute for formal education or training needed for regulated professions.',
        },
        {
          q: 'Are the courses helpful for internationally educated healthcare professionals?',
          a: 'Yes, they help refresh knowledge, study Canadian healthcare topics, and build confidence. They do not replace official licensing requirements.',
        },
      ],
    },
    {
      id: 'eligibility',
      label: 'Eligibility',
      title: 'Eligibility & Requirements',
      items: [
        {
          q: 'Are there any educational prerequisites?',
          a: 'Most courses have no formal prerequisites unless stated otherwise. English comprehension is required for course materials and assessments.',
        },
        {
          q: 'Do I need previous work experience?',
          a: 'No previous healthcare experience is needed for most courses. Review individual course descriptions.',
        },
        {
          q: 'What are the English-language requirements?',
          a: 'Courses delivered in English are primarily text-based. Students must understand materials, follow written instructions, and complete assessments in English. No formal language testing is typically required.',
        },
      ],
    },
    {
      id: 'format',
      label: 'Format & Support',
      title: 'Format, Duration & Support',
      items: [
        {
          q: 'How are the courses delivered?',
          a: 'Fully online and self-paced. Students access materials independently, with most courses including written lessons and assessments.',
        },
        {
          q: 'Are there live classes or scheduled lectures?',
          a: "Generally, no. CCACT's standard online continuing-education courses are designed for independent study and do not require live attendance.",
        },
        {
          q: 'How long do the courses take?',
          a: 'Duration varies by subject and depth. Estimated length appears in individual course descriptions.',
        },
        {
          q: 'Is there a time limit for completing a course?',
          a: 'Any enrollment period stated in course information should be reviewed before registering.',
        },
        {
          q: 'Will an instructor be available to answer questions?',
          a: 'Support levels vary by course. Check individual course descriptions for details.',
        },
        {
          q: 'What equipment do I need?',
          a: 'Reliable internet and a computer, tablet, or mobile device are required. Computers or tablets are recommended for easier access and assessments.',
        },
      ],
    },
    {
      id: 'certificates',
      label: 'Certificates',
      title: 'Certificates & Assessments',
      items: [
        {
          q: 'Will I receive a certificate?',
          a: 'Successfully completing courses yields a Certificate of Completion. This confirms course completion but is not a diploma, degree, license, or regulated qualification.',
        },
        {
          q: 'Are there tests or assessments?',
          a: 'Methods vary and may include multiple-choice quizzes, assignments, or practice examinations. Check individual descriptions.',
        },
        {
          q: 'What mark do I need to pass?',
          a: 'Required passing marks are stated in individual course information when applicable.',
        },
        {
          q: 'Can I use the certificate for employment or licensing?',
          a: 'Certificates may support professional records, but acceptance is determined by employers, institutions, or regulators. CCACT cannot guarantee employment, admission, licensing, registration, or immigration results.',
        },
      ],
    },
    {
      id: 'licensing',
      label: 'Licensing & Immigration',
      title: 'Licensing & Immigration',
      items: [
        {
          q: 'Do CCACT courses lead to professional licensing or registration?',
          a: 'No. Courses do not lead to licensing by themselves. Students must confirm requirements with appropriate regulatory bodies.',
        },
        {
          q: 'Can a CCACT course help with an immigration application?',
          a: 'Completing courses does not guarantee permits or permanent residence. Immigration services are provided separately through Jean Robles Immigration Consulting.',
        },
        {
          q: 'Can I obtain a Canadian study permit for these courses?',
          a: "CCACT's short online continuing-education courses are not intended to provide eligibility for a Canadian study permit. Professional advice is recommended.",
        },
      ],
    },
    {
      id: 'fees',
      label: 'Fees & Refunds',
      title: 'Fees, Refunds & Transfers',
      items: [
        {
          q: 'When do I pay the course fee?',
          a: 'Fees are paid during online registration. Access is normally provided after successful payment processing.',
        },
        {
          q: 'Are course fees refundable?',
          a: 'Course fees are non-refundable once enrollment or course access has been provided, except where required by law.',
        },
        {
          q: 'Can I transfer my enrollment?',
          a: 'Enrollments are non-transferable unless CCACT provides written approval. Contact the organization before registering if unsure.',
        },
        {
          q: 'Are textbooks or additional materials required?',
          a: 'Most required materials are included online. Additional requirements are clearly stated in course descriptions.',
        },
      ],
    },
    {
      id: 'before-enroll',
      label: 'Before You Enroll',
      title: 'Before You Enroll',
      items: [
        {
          q: 'How do I choose the right course?',
          a: 'Review descriptions, duration, learning objectives, and requirements. Contact us for assistance if needed.',
        },
        {
          q: 'When can I start?',
          a: 'Registration is available online. Access is normally provided after successful payment and registration.',
        },
        {
          q: 'Can I study from outside Canada?',
          a: 'Yes. Online courses are accessible from many countries with reliable internet and English proficiency.',
        },
        {
          q: 'What should I do if I have questions before enrolling?',
          a: `Contact us at ${BRAND.contactEmail} (or info@theccact.online as listed on the legacy FAQ) or by WhatsApp or text at +1 416-893-8158.`,
        },
      ],
    },
  ],
  enrollmentNotice:
    'Important Enrollment Notice: By enrolling, students should confirm that they have reviewed the course description and understand that CCACT courses are continuing education/CPD, not vocational training; practical placement is not included unless specifically stated; and course registrations are non-refundable and non-transferable.',
};

export const CONTACT_PAGE = {
  title: 'Contact Us — CCACT',
  description:
    'Get in touch with CCACT for questions about online courses, registration, or student support.',
  hero: {
    eyebrow: 'Student Support',
    title: 'Contact Us',
    lead: "We're here to help — we look forward to hearing from you.",
  },
  officeHours: 'Monday – Friday, 8:30 am – 4:30 pm (Eastern Standard Time)',
  introText:
    'Have a question about our courses, registration, or student support? Contact us by email or complete the inquiry form, and our team will be happy to assist you.',
  resources: [
    { key: 'courses', title: 'Course Catalog', body: 'Browse all our online courses.', cta: 'View Courses' },
    { key: 'registration', title: 'Registration Info', body: 'Learn how enrollment works.', cta: 'Learn More' },
    { key: 'faq', title: 'FAQ', body: 'Answers to common questions.', cta: 'Read FAQ' },
    { key: 'study-in-canada', title: 'Study in Canada', body: 'Explore immigration services.', cta: 'Explore' },
  ],
};

export const PRIVACY_PAGE = {
  title: 'Privacy Notice — CCACT',
  description: 'How CCACT collects, stores, secures, and uses personal information.',
  hero: {
    eyebrow: 'Policies & Governance',
    title: 'Privacy Notice',
    lead: 'Information collection, usage purposes, data security, communications, and cookie practices.',
  },
  sections: [
    {
      heading: 'Information Collection',
      paragraphs: [
        'We receive, collect and store any information you enter on our website or provide us in any other way. Collected data may include names, email addresses, passwords, IP addresses, and payment details.',
        'We also gather technical data such as page response times, length of visits to certain pages, and page interaction information through software tools.',
      ],
    },
    {
      heading: 'Data Usage Purposes',
      paragraphs: ['Personal information is collected for the following reasons:'],
      orderedList: [
        'Service provision and operation',
        'Customer support and technical assistance',
        'Service-related communications and promotional messages',
        'Creating statistical data to improve services',
        'Legal and regulatory compliance',
      ],
    },
    {
      heading: 'Data Security',
      paragraphs: ['All direct payments used by our company adhere to the international standards set by PCI-DSS.'],
    },
    {
      heading: 'Communication Methods',
      paragraphs: [
        'We may contact users via email, telephone, text messages, and postal mail regarding accounts, troubleshooting, disputes, and company updates.',
      ],
    },
    {
      heading: 'Cookie Usage',
      paragraphs: ['Three cookie types are deployed:'],
      unorderedList: [
        'Necessary cookies for core functionality',
        'Functional cookies storing user preferences',
        'Analytics cookies collecting aggregated usage statistics',
      ],
    },
    {
      heading: 'Policy Changes',
      paragraphs: [
        'This notice reserves the right to modify its privacy policy at any time, with changes taking effect immediately upon posting.',
      ],
    },
  ],
};

// The directory section of the Affiliates page.
export const DIRECTORY_PAGE = {
  eyebrow: 'Student Protection & Verification',
  heading: 'Approved CCACT Affiliates',
  lead: 'Confirm that an individual ambassador or affiliate organization is officially authorized by CCACT.',
  emptyHeading: 'Affiliate Directory Launch In Progress',
  emptyBody:
    'No affiliates are published in the public directory yet. Approved affiliates appear here after CCACT completes bio compliance review and preview approval.',
};

export const AFFILIATES_PAGE = {
  title: 'Affiliates — CCACT',
  description:
    'The CCACT affiliate program and the directory of approved individual and organization affiliates.',
  hero: {
    eyebrow: 'Affiliate Program',
    title: 'The CCACT Affiliate Program',
    lead: 'Approved individual educators and affiliate organizations share verified CCACT course information through an official Teachable referral link and a dedicated CCACT affiliate site. Affiliates join by invitation from CCACT.',
  },
  tracksEyebrow: 'Our affiliates',
  tracksHeading: 'Two kinds of affiliates',
  inviteNote: 'Affiliates join by invitation. Interested?',
  tracks: [
    {
      id: 'apply-individual',
      heading: 'Individual affiliate',
      audience: 'For internationally educated nurses, graduates, educators, and community connectors.',
      summary:
        'Share verified CCACT course information with the learners you already support.',
      gets: ['Your own authorized CCACT affiliate site', 'Your reviewed bio and optional headshot portrait', 'Languages spoken and areas of support', 'Personal Teachable referral links'],
    },
    {
      id: 'apply-organisation',
      heading: 'Organization affiliate',
      audience: 'For immigration consultancies, education agencies, nursing schools, and healthcare recruiters.',
      summary:
        'Offer your clients and students verified CCACT course information through a dedicated affiliate site.',
      gets: ['A dedicated CCACT site for your organization', 'Your reviewed description, logo and location', 'Optional link to your website', 'Teachable referral links'],
    },
  ],
  pendingDisclosureHeading: 'Program Terms & Commission Details Pending Final Sign-Off',
  pendingDisclosureBody:
    'The commission schedule, Affiliate Agreement wording, and existing live Affiliates copy are currently restricted on the legacy website and await formal CCACT approval before public publication. Per CCACT policy, referral attribution follows Teachable tracking rules and affiliates never collect tuition or guarantee employment, licensing, or immigration outcomes.',
};
