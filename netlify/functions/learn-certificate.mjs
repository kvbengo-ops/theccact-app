// GET /.netlify/functions/learn-certificate?course=<id> with the student's Bearer token.
// Returns the signed-in student's certificate for that course as a branded PDF.
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (statusCode, error) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify({ error }) });
const hex = (value) => rgb(...[1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255));

// Colors match src/styles/tokens.css for each brand.
export const BRANDS = {
  ccact: { short: 'CCACT', name: 'Canadian Centre for Advanced Career Training', logo: '/ccact-logo.png', main: hex('#15233E'), gold: hex('#C9A14A'), goldDark: hex('#8A6A28') },
  cces: { short: 'CCES', name: 'Canadian Centre of Emerging Studies', logo: '/cces-crest.png', main: hex('#3E1D7A'), gold: hex('#C8A96E'), goldDark: hex('#8A6A28') },
};

// Standard PDF fonts only cover Western European letters: drop accents first, then replace anything left.
const PLAIN = { Ł: 'L', ł: 'l', Đ: 'D', đ: 'd', ı: 'i', Ħ: 'H', ħ: 'h' };
export function printable(text, font) {
  return [...String(text ?? '')].map((ch) => {
    for (const option of [ch, ch.normalize('NFD').replace(/\p{M}/gu, ''), PLAIN[ch]]) {
      try { if (option) { font.encodeText(option); return option; } } catch { /* not in the font */ }
    }
    return '?';
  }).join('');
}

// Greedy word wrap into at most `max` lines, shrinking the size until it fits.
function fit(text, font, size, width, max = 2) {
  for (let s = size; s > 10; s -= 1) {
    const lines = [];
    for (const word of text.split(/\s+/)) {
      const line = lines.length ? `${lines.at(-1)} ${word}` : word;
      if (lines.length && font.widthOfTextAtSize(line, s) <= width) lines[lines.length - 1] = line;
      else lines.push(word);
    }
    if (lines.length <= max && lines.every((l) => font.widthOfTextAtSize(l, s) <= width)) return { lines, size: s };
  }
  return { lines: [text], size: 10 };
}

export async function certificatePdf({ name, course, brand, issuedAt, ceHours, number, verifyUrl, logo }) {
  const b = BRANDS[brand];
  const doc = await PDFDocument.create();
  doc.setTitle(`${b.short} certificate ${number}`);
  doc.setAuthor(b.name);
  const page = doc.addPage([792, 612]); // US Letter, landscape
  const { width, height } = page.getSize();
  const fonts = {
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    serifBold: await doc.embedFont(StandardFonts.TimesRomanBold),
    italic: await doc.embedFont(StandardFonts.TimesRomanItalic),
    sans: await doc.embedFont(StandardFonts.Helvetica),
    sansBold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const muted = rgb(0.36, 0.38, 0.43);
  const center = (text, y, font, size, color = b.main) => {
    const safe = printable(text, font);
    page.drawText(safe, { x: (width - font.widthOfTextAtSize(safe, size)) / 2, y, size, font, color });
  };

  page.drawRectangle({ x: 18, y: 18, width: width - 36, height: height - 36, borderColor: b.main, borderWidth: 3 });
  page.drawRectangle({ x: 28, y: 28, width: width - 56, height: height - 56, borderColor: b.gold, borderWidth: 1 });

  let y = height - 96;
  if (logo) {
    try {
      const image = await doc.embedPng(logo);
      const h = 92;
      const w = (image.width / image.height) * h;
      page.drawImage(image, { x: (width - w) / 2, y: y - h, width: w, height: h });
      y -= h + 26;
    } catch { y -= 10; /* not a usable PNG: skip the logo */ }
  }

  center(b.name.toUpperCase(), y, fonts.sansBold, 10.5, b.goldDark);
  y -= 54;
  center('Certificate of Completion', y, fonts.serifBold, 36);
  y -= 40;
  center('This certifies that', y, fonts.italic, 14, muted);

  const student = fit(printable(name, fonts.serifBold), fonts.serifBold, 32, width - 200, 1);
  y -= 50;
  center(student.lines[0], y, fonts.serifBold, student.size);
  const half = Math.max(200, fonts.serifBold.widthOfTextAtSize(student.lines[0], student.size) / 2 + 24);
  page.drawLine({ start: { x: width / 2 - half, y: y - 10 }, end: { x: width / 2 + half, y: y - 10 }, thickness: 1, color: b.gold });

  y -= 42;
  center('has successfully completed', y, fonts.italic, 14, muted);
  const title = fit(printable(course, fonts.sansBold), fonts.sansBold, 20, width - 180);
  for (const line of title.lines) {
    y -= title.size + 10;
    center(line, y, fonts.sansBold, title.size);
  }

  const date = new Date(issuedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Toronto' });
  const hours = Number(ceHours) > 0 ? ` · ${Number(ceHours)} continuing-education ${Number(ceHours) === 1 ? 'hour' : 'hours'}` : '';
  y -= 40;
  center(`Completed on ${date}${hours}`, y, fonts.serif, 13, muted);

  page.drawText(`Certificate number ${number}`, { x: 52, y: 48, size: 9, font: fonts.sans, color: muted });
  const verify = printable(`Verify at ${verifyUrl}`, fonts.sans);
  page.drawText(verify, { x: width - 52 - fonts.sans.widthOfTextAtSize(verify, 9), y: 48, size: 9, font: fonts.sans, color: muted });

  return doc.save();
}

export const createHandler = (makeClient = createClient, fetchImpl = globalThis.fetch) => async (event) => {
  if (event.httpMethod !== 'GET') return json(405, 'Method not allowed');
  const token = event.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return json(401, 'Sign in required');
  const courseId = event.queryStringParameters?.course ?? '';
  if (!uuid.test(courseId)) return json(400, 'Invalid course');
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, PUBLIC_SUPABASE_ANON_KEY: anon } = process.env;
  if (!url || !key || !anon) return json(500, 'Server is not configured');
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const { data: auth, error: authError } = await makeClient(url, anon, options).auth.getUser(token);
  if (authError || !auth?.user) return json(401, 'Sign in required');
  const user = auth.user;

  try {
    const service = makeClient(url, key, options);
    const [cert, course, enrollment, profile] = await Promise.all([
      service.from('certificates').select('number, issued_at').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
      service.from('courses').select('title, brand, ce_hours').eq('id', courseId).maybeSingle(),
      service.from('enrollments').select('student_name').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
      service.from('student_profiles').select('full_name').eq('user_id', user.id).maybeSingle(),
    ]);
    for (const result of [cert, course, enrollment, profile]) if (result.error) throw result.error;
    // ponytail: same 404 as "no such function" so the page says "not available"; a separate "not finished yet" message isn't needed while the button only shows once a certificate exists.
    if (!cert.data || !course.data || !BRANDS[course.data.brand]) return json(404, 'No certificate for this course');

    // The name the student gave for the certificate, then their profile, then their account.
    const name = enrollment.data?.student_name || profile.data?.full_name || user.user_metadata?.full_name || user.email;
    const origin = new URL(event.rawUrl).origin;
    let logo = null;
    try {
      const res = await fetchImpl(`${origin}${BRANDS[course.data.brand].logo}`);
      if (res.ok) logo = new Uint8Array(await res.arrayBuffer());
    } catch { /* the certificate still works without the logo */ }

    const pdf = await certificatePdf({
      name,
      course: course.data.title,
      brand: course.data.brand,
      issuedAt: cert.data.issued_at,
      ceHours: course.data.ce_hours,
      number: cert.data.number,
      verifyUrl: `${origin}/learn/verify/?n=${encodeURIComponent(cert.data.number)}`,
      logo,
    });
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${BRANDS[course.data.brand].short}-certificate-${cert.data.number}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
      body: Buffer.from(pdf).toString('base64'),
      isBase64Encoded: true,
    };
  } catch {
    return json(500, 'Could not create the certificate');
  }
};

export const handler = createHandler();
