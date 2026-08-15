// One-off dev seed script — populates course content (if missing) plus a
// realistic spread of mock schools, students, lesson progress, and quiz
// attempts so the full app (admin analytics, student dashboard, quiz flow,
// certificates) can be exercised end to end in a dev/test Supabase project.
//
// Usage: node scripts/seed-mock-data.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local

import fs from 'node:fs';

const env = {};
fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').forEach(l => {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
});
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function rest(path, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...headers, ...(prefer ? { Prefer: prefer } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function createAuthUser({ email, password, user_metadata }) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`createUser(${email}) -> ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

function makePlaceholderEmail(fullName) {
  const slug = fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '') || 'student';
  const suffix = Math.random().toString(36).slice(2, 10);
  return `${slug}.${suffix}@students.thalirverse.internal`;
}

const MOCK_PASSWORD = 'MockStudent#2026';

// ── 1. Course content (idempotent — matches schema.sql's own seed data) ──
async function seedCourseContent() {
  const { count: moduleCount } = await fetch(`${SUPABASE_URL}/rest/v1/modules?select=id`, {
    headers: { ...headers, Prefer: 'count=exact' },
  }).then(async r => ({ count: Number(r.headers.get('content-range')?.split('/')[1] ?? 0) }));

  if (moduleCount > 0) {
    console.log(`Course content already present (${moduleCount} modules) — skipping.`);
    return;
  }

  console.log('Seeding course content (modules, lessons, quizzes, questions, answers)...');

  await rest('modules', { method: 'POST', prefer: 'resolution=ignore-duplicates', body: [
    { id: 'road-safety', title: 'Road Safety', description: 'Essential road safety rules and guidelines for young students to navigate city streets securely.', category: 'Road Safety', order_index: 0, is_published: true, badge_id: 'road-safety-champ', badge_title: 'Road Safety Champion' },
    { id: 'masoom', title: 'Masoom', description: 'Personal body safety, child safety awareness, and identifying safe vs. unsafe touches.', category: 'Masoom', order_index: 1, is_published: true, badge_id: 'masoom-badge', badge_title: 'Masoom Safety Badge' },
    { id: 'entrepreneurship', title: 'Entrepreneurship 101', description: 'Learn the fundamentals of critical thinking, starting a business, and serving community needs.', category: 'Entrepreneurship', order_index: 2, is_published: true, badge_id: 'entrepreneurship-badge', badge_title: 'Young Entrepreneur Badge' },
    { id: 'leadership', title: 'Leadership Explorer', description: 'Harness teamwork, emotional intelligence, public speaking, and leading community initiatives.', category: 'Leadership', order_index: 3, is_published: true, badge_id: 'leadership-badge', badge_title: 'Leadership Explorer Badge' },
  ] });

  await rest('lessons', { method: 'POST', prefer: 'resolution=ignore-duplicates', body: [
    { id: 'rs-1', module_id: 'road-safety', title: 'Pedestrian Crossing & Signals', lesson_type: 'VIDEO', content_url: 'https://www.youtube.com/watch?v=R9KbeH_3Hok', order_index: 0 },
    { id: 'rs-2', module_id: 'road-safety', title: 'Traffic Signs & Lane Disciplines', lesson_type: 'VIDEO', content_url: 'https://www.youtube.com/watch?v=2Tz8A2E8m98', order_index: 1 },
    { id: 'ms-1', module_id: 'masoom', title: 'Safe and Unsafe Touches', lesson_type: 'VIDEO', content_url: 'https://www.youtube.com/watch?v=aGshf7_jD3I', order_index: 0 },
    { id: 'ms-2', module_id: 'masoom', title: 'The Safe Circle Concept', lesson_type: 'VIDEO', content_url: 'https://www.youtube.com/watch?v=F_f0XW8r8q8', order_index: 1 },
    { id: 'ep-1', module_id: 'entrepreneurship', title: 'Introduction to Startups', lesson_type: 'VIDEO', content_url: 'https://www.youtube.com/watch?v=FqChyVEPEOI', order_index: 0 },
    { id: 'ep-2', module_id: 'entrepreneurship', title: 'Market Research Basics', lesson_type: 'VIDEO', content_url: 'https://www.youtube.com/watch?v=b-hMkfQ6gEs', order_index: 1 },
    { id: 'ld-1', module_id: 'leadership', title: 'Core Leadership Styles', lesson_type: 'VIDEO', content_url: 'https://www.youtube.com/watch?v=17XmfeH8hR4', order_index: 0 },
    { id: 'ld-2', module_id: 'leadership', title: 'Effective Communication & Teamwork', lesson_type: 'VIDEO', content_url: 'https://www.youtube.com/watch?v=t_9XF6t_8m8', order_index: 1 },
  ] });

  await rest('quizzes', { method: 'POST', prefer: 'resolution=ignore-duplicates', body: [
    { id: 'quiz-rs', module_id: 'road-safety', title: 'Road Safety Basics Quiz', pass_percentage: 80, retry_limit: 3, is_published: true },
    { id: 'quiz-ms', module_id: 'masoom', title: 'Masoom Safety Quiz', pass_percentage: 80, retry_limit: 3, is_published: true },
    { id: 'quiz-ep', module_id: 'entrepreneurship', title: 'Entrepreneurship Basics Quiz', pass_percentage: 80, retry_limit: 3, is_published: true },
    { id: 'quiz-ld', module_id: 'leadership', title: 'Leadership Skills Quiz', pass_percentage: 80, retry_limit: 3, is_published: true },
  ] });

  await rest('questions', { method: 'POST', prefer: 'resolution=ignore-duplicates', body: [
    { id: 'q-rs-1', quiz_id: 'quiz-rs', question_text: 'What does a flashing yellow traffic light mean?', order_index: 0 },
    { id: 'q-rs-2', quiz_id: 'quiz-rs', question_text: 'Which side of the road should pedestrians walk on if there is no sidewalk?', order_index: 1 },
    { id: 'q-ms-1', quiz_id: 'quiz-ms', question_text: 'Who belongs in your "Safe Circle"?', order_index: 0 },
    { id: 'q-ms-2', quiz_id: 'quiz-ms', question_text: 'What should you do if someone gives you an unsafe touch?', order_index: 1 },
    { id: 'q-ep-1', quiz_id: 'quiz-ep', question_text: 'What is the first step in starting a business?', order_index: 0 },
    { id: 'q-ep-2', quiz_id: 'quiz-ep', question_text: 'What does "value proposition" mean?', order_index: 1 },
    { id: 'q-ld-1', quiz_id: 'quiz-ld', question_text: 'Which trait is most important for a modern leader?', order_index: 0 },
    { id: 'q-ld-2', quiz_id: 'quiz-ld', question_text: 'How should a good leader handle mistakes?', order_index: 1 },
  ] });

  await rest('answers', { method: 'POST', prefer: 'resolution=ignore-duplicates', body: [
    { id: 'a1', question_id: 'q-rs-1', answer_text: 'Stop completely', is_correct: false },
    { id: 'a2', question_id: 'q-rs-1', answer_text: 'Proceed with caution', is_correct: true },
    { id: 'a3', question_id: 'q-rs-1', answer_text: 'Speed up to clear the intersection', is_correct: false },
    { id: 'a4', question_id: 'q-rs-1', answer_text: 'Yield to pedestrians only', is_correct: false },
    { id: 'b1', question_id: 'q-rs-2', answer_text: 'Facing oncoming traffic', is_correct: true },
    { id: 'b2', question_id: 'q-rs-2', answer_text: 'In the direction of traffic', is_correct: false },
    { id: 'b3', question_id: 'q-rs-2', answer_text: 'Directly in the middle of the street', is_correct: false },
    { id: 'b4', question_id: 'q-rs-2', answer_text: 'Any side is fine', is_correct: false },
    { id: 'c1', question_id: 'q-ms-1', answer_text: 'Strangers you meet at the park', is_correct: false },
    { id: 'c2', question_id: 'q-ms-1', answer_text: 'A small group of trusted adults like parents or teachers', is_correct: true },
    { id: 'c3', question_id: 'q-ms-1', answer_text: 'Anyone who offers you candy', is_correct: false },
    { id: 'c4', question_id: 'q-ms-1', answer_text: 'Only older kids at school', is_correct: false },
    { id: 'd1', question_id: 'q-ms-2', answer_text: 'Keep it a secret', is_correct: false },
    { id: 'd2', question_id: 'q-ms-2', answer_text: 'Say NO, run away, and tell a trusted adult immediately', is_correct: true },
    { id: 'd3', question_id: 'q-ms-2', answer_text: 'Ignore it and hope it does not happen again', is_correct: false },
    { id: 'd4', question_id: 'q-ms-2', answer_text: 'Blame yourself', is_correct: false },
    { id: 'e1', question_id: 'q-ep-1', answer_text: 'Hiring 100 people', is_correct: false },
    { id: 'e2', question_id: 'q-ep-1', answer_text: 'Identifying a problem and doing Market Research', is_correct: true },
    { id: 'e3', question_id: 'q-ep-1', answer_text: 'Spending all your money on ads', is_correct: false },
    { id: 'e4', question_id: 'q-ep-1', answer_text: 'Renting a huge office', is_correct: false },
    { id: 'f1', question_id: 'q-ep-2', answer_text: 'The price tag on your product', is_correct: false },
    { id: 'f2', question_id: 'q-ep-2', answer_text: 'The unique benefit your product or service offers to customers', is_correct: true },
    { id: 'f3', question_id: 'q-ep-2', answer_text: 'The location of your business', is_correct: false },
    { id: 'f4', question_id: 'q-ep-2', answer_text: 'The legal contract with your partner', is_correct: false },
    { id: 'g1', question_id: 'q-ld-1', answer_text: 'Telling everyone what to do without listening', is_correct: false },
    { id: 'g2', question_id: 'q-ld-1', answer_text: 'Empathy and active listening to empower others', is_correct: true },
    { id: 'g3', question_id: 'q-ld-1', answer_text: 'Being the loudest voice in the room', is_correct: false },
    { id: 'g4', question_id: 'q-ld-1', answer_text: 'Making all decisions completely alone', is_correct: false },
    { id: 'h1', question_id: 'q-ld-2', answer_text: 'Blame team members immediately', is_correct: false },
    { id: 'h2', question_id: 'q-ld-2', answer_text: 'Acknowledge the mistake, learn from it, and solve it together', is_correct: true },
    { id: 'h3', question_id: 'q-ld-2', answer_text: 'Hide the mistake so no one finds out', is_correct: false },
    { id: 'h4', question_id: 'q-ld-2', answer_text: 'Cancel the project', is_correct: false },
  ] });

  console.log('Course content seeded.');
}

// ── 2. Chapters + schools ──
async function seedSchools() {
  await rest('chapters', { method: 'POST', prefer: 'resolution=ignore-duplicates', body: [
    { name: 'Trichy', city: 'Tiruchirappalli' },
  ] });

  const chapters = await rest('chapters?select=id,name');
  const chapterByName = Object.fromEntries(chapters.map(c => [c.name, c.id]));

  const orgs = await rest('organizations?select=id,name');
  const mahatmaOrgId = orgs.find(o => o.name === 'Mahatma schools')?.id ?? null;

  const schoolsToCreate = [
    { name: 'Mahatma Anna Nagar', city: 'Chennai', district: 'Chennai', chapter_id: chapterByName['Chennai'], organization_id: mahatmaOrgId, coordinator_name: 'Radha Krishnan', coordinator_mobile: '9840012345' },
    { name: 'Chennai Public School', city: 'Chennai', district: 'Chennai', chapter_id: chapterByName['Chennai'], organization_id: null, coordinator_name: 'Vijay Anand', coordinator_mobile: '9840023456' },
    { name: 'Nirmala Matric Hr Sec School', city: 'Coimbatore', district: 'Coimbatore', chapter_id: chapterByName['Coimbatore'], organization_id: null, coordinator_name: 'Saranya Moorthy', coordinator_mobile: '9840034567' },
    { name: "St. Joseph's Matriculation", city: 'Tiruchirappalli', district: 'Tiruchirappalli', chapter_id: chapterByName['Trichy'], organization_id: null, coordinator_name: 'Manikandan S', coordinator_mobile: '9840045678' },
  ];

  await rest('schools', { method: 'POST', prefer: 'resolution=ignore-duplicates', body: schoolsToCreate });

  const schools = await rest('schools?select=id,name');
  return Object.fromEntries(schools.map(s => [s.name, s.id]));
}

// ── 3. Students, progress, quiz attempts ──
const PERSONAS = {
  graduate: { lessonsDone: 'all', quizzes: 'all-pass' },
  in_progress: { lessonsDone: 'half', quizzes: 'partial' },
  just_started: { lessonsDone: 'one', quizzes: 'none' },
  inactive: { lessonsDone: 'none', quizzes: 'none' },
};

const MODULES = ['road-safety', 'masoom', 'entrepreneurship', 'leadership'];
const LESSONS_BY_MODULE = {
  'road-safety': ['rs-1', 'rs-2'],
  masoom: ['ms-1', 'ms-2'],
  entrepreneurship: ['ep-1', 'ep-2'],
  leadership: ['ld-1', 'ld-2'],
};
const QUIZ_BY_MODULE = { 'road-safety': 'quiz-rs', masoom: 'quiz-ms', entrepreneurship: 'quiz-ep', leadership: 'quiz-ld' };

const ROSTER = [
  { name: 'Praveen Kumar', gender: 'male', standard: '10th Standard', school: 'Mahatama KK Nagar', district: 'Madurai', persona: 'graduate' },
  { name: 'Divya Sri', gender: 'female', standard: '9th Standard', school: 'Mahatama KK Nagar', district: 'Madurai', persona: 'in_progress' },
  { name: 'Karthik Raja', gender: 'male', standard: '8th Standard', school: 'Mahatama KK Nagar', district: 'Madurai', persona: 'just_started' },
  { name: 'Meena Priya', gender: 'female', standard: '11th Standard', school: 'Mahatama KK Nagar', district: 'Madurai', persona: 'inactive' },

  { name: 'Arun Prakash', gender: 'male', standard: '10th Standard', school: 'Mahatma Anna Nagar', district: 'Chennai', persona: 'graduate' },
  { name: 'Swetha Ramesh', gender: 'female', standard: '9th Standard', school: 'Mahatma Anna Nagar', district: 'Chennai', persona: 'in_progress' },
  { name: 'Vignesh Babu', gender: 'male', standard: '8th Standard', school: 'Mahatma Anna Nagar', district: 'Chennai', persona: 'just_started' },
  { name: 'Nithya Sundar', gender: 'female', standard: '12th Standard', school: 'Mahatma Anna Nagar', district: 'Chennai', persona: 'inactive' },

  { name: 'Harish Chandran', gender: 'male', standard: '11th Standard', school: 'Chennai Public School', district: 'Chennai', persona: 'graduate' },
  { name: 'Priyanka Devi', gender: 'female', standard: '10th Standard', school: 'Chennai Public School', district: 'Chennai', persona: 'in_progress' },
  { name: 'Suresh Babu', gender: 'male', standard: '9th Standard', school: 'Chennai Public School', district: 'Chennai', persona: 'just_started' },
  { name: 'Anitha Kumari', gender: 'female', standard: '8th Standard', school: 'Chennai Public School', district: 'Chennai', persona: 'inactive' },

  { name: 'Manoj Kumar', gender: 'male', standard: '12th Standard', school: 'Nirmala Matric Hr Sec School', district: 'Coimbatore', persona: 'graduate' },
  { name: 'Deepika Ramesh', gender: 'female', standard: '11th Standard', school: 'Nirmala Matric Hr Sec School', district: 'Coimbatore', persona: 'in_progress' },
  { name: 'Ashwin Raj', gender: 'male', standard: '10th Standard', school: 'Nirmala Matric Hr Sec School', district: 'Coimbatore', persona: 'just_started' },
  { name: 'Kavya Shree', gender: 'female', standard: '9th Standard', school: 'Nirmala Matric Hr Sec School', district: 'Coimbatore', persona: 'inactive' },

  { name: 'Gokul Nath', gender: 'male', standard: '10th Standard', school: "St. Joseph's Matriculation", district: 'Tiruchirappalli', persona: 'graduate' },
  { name: 'Sandhya Rani', gender: 'female', standard: '9th Standard', school: "St. Joseph's Matriculation", district: 'Tiruchirappalli', persona: 'in_progress' },
  { name: 'Bala Murugan', gender: 'male', standard: '8th Standard', school: "St. Joseph's Matriculation", district: 'Tiruchirappalli', persona: 'just_started' },
  { name: 'Revathi Krishnan', gender: 'female', standard: '11th Standard', school: "St. Joseph's Matriculation", district: 'Tiruchirappalli', persona: 'inactive' },
];

function daysAgo(n) { return new Date(Date.now() - n * 86400000).toISOString(); }

async function seedStudents(schoolIdByName) {
  const existing = await rest('profiles?select=full_name');
  const existingNames = new Set(existing.map(p => p.full_name.trim().toLowerCase()));

  let created = 0, skipped = 0;
  for (const [i, person] of ROSTER.entries()) {
    if (existingNames.has(person.name.toLowerCase())) {
      console.log(`  skip (already exists): ${person.name}`);
      skipped++;
      continue;
    }

    const email = makePlaceholderEmail(person.name);
    const schoolId = schoolIdByName[person.school];
    const authUser = await createAuthUser({
      email,
      password: MOCK_PASSWORD,
      user_metadata: {
        fullName: person.name,
        school: person.school,
        standard: person.standard,
        section: 'A',
        district: person.district,
        gender: person.gender,
      },
    });
    const userId = authUser.id ?? authUser.user?.id;

    // Trigger auto-creates profiles + students rows; backfill school_id (bulk paths don't set it).
    await rest(`profiles?id=eq.${userId}`, { method: 'PATCH', body: { school_id: schoolId } });
    await rest(`students?user_id=eq.${userId}`, { method: 'PATCH', body: { school_id: schoolId } });

    await seedProgressAndQuizzes(userId, person.persona, i);
    created++;
    console.log(`  created: ${person.name} (${person.persona}) @ ${person.school}`);
  }
  return { created, skipped };
}

async function seedProgressAndQuizzes(studentId, persona, seedOffset) {
  const progressRows = [];
  const quizAttemptRows = [];
  let xp = 0;

  const modulesToTouch =
    persona === 'graduate' ? MODULES :
    persona === 'in_progress' ? MODULES.slice(0, 2) :
    persona === 'just_started' ? MODULES.slice(0, 1) :
    [];

  modulesToTouch.forEach((moduleId, mi) => {
    const lessons = LESSONS_BY_MODULE[moduleId];
    const dayOffset = 20 - seedOffset - mi * 2;

    if (persona === 'just_started') {
      // First lesson completed, second in progress.
      progressRows.push({ student_id: studentId, module_id: moduleId, lesson_id: lessons[0], status: 'COMPLETED', watch_percentage: 100, completed_at: daysAgo(dayOffset) });
      progressRows.push({ student_id: studentId, module_id: moduleId, lesson_id: lessons[1], status: 'IN_PROGRESS', watch_percentage: 55, completed_at: null });
      return;
    }

    // graduate + in_progress: all lessons in this module completed.
    lessons.forEach(lessonId => {
      progressRows.push({ student_id: studentId, module_id: moduleId, lesson_id: lessonId, status: 'COMPLETED', watch_percentage: 100, completed_at: daysAgo(dayOffset) });
    });

    const quizId = QUIZ_BY_MODULE[moduleId];
    if (persona === 'graduate') {
      quizAttemptRows.push({ student_id: studentId, quiz_id: quizId, score: 100, passed: true, attempted_at: daysAgo(dayOffset - 1) });
      xp += 120;
    } else if (persona === 'in_progress' && mi === 0) {
      // First module: passed on first try.
      quizAttemptRows.push({ student_id: studentId, quiz_id: quizId, score: 100, passed: true, attempted_at: daysAgo(dayOffset - 1) });
      xp += 120;
    } else if (persona === 'in_progress' && mi === 1) {
      // Second module: failed once, then passed.
      quizAttemptRows.push({ student_id: studentId, quiz_id: quizId, score: 50, passed: false, attempted_at: daysAgo(dayOffset - 1) });
      quizAttemptRows.push({ student_id: studentId, quiz_id: quizId, score: 100, passed: true, attempted_at: daysAgo(dayOffset - 0.5) });
      xp += 120;
    }
  });

  if (progressRows.length) await rest('progress', { method: 'POST', body: progressRows });
  if (quizAttemptRows.length) await rest('quiz_attempts', { method: 'POST', body: quizAttemptRows });
  if (xp > 0) await rest(`profiles?id=eq.${studentId}`, { method: 'PATCH', body: { xp } });
}

async function main() {
  await seedCourseContent();
  console.log('Seeding schools...');
  const schoolIdByName = await seedSchools();
  console.log('Schools ready:', Object.keys(schoolIdByName));

  console.log('Seeding mock students...');
  const { created, skipped } = await seedStudents(schoolIdByName);

  console.log('\nDone.');
  console.log(`Students created: ${created}, skipped (already existed): ${skipped}`);
  console.log(`All mock students share password: ${MOCK_PASSWORD}`);
}

main().catch(err => { console.error(err); process.exit(1); });
