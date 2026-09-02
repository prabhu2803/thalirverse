// Second-wave mock data seed — additive and idempotent (like
// seed-mock-data.mjs, never touches existing rows), built to exercise the
// gamification expansion (streaks, milestone tiers, XP bonus-tier rolls,
// school-scoped leaderboard) with realistic-looking data:
//
//  - 2 new schools (new chapter + reused chapter) with the standard
//    4-persona roster, for more admin/leaderboard breadth.
//  - 5 additional students, one per existing school, covering personas the
//    first script didn't: a real multi-day consecutive streak ending today,
//    a streak that was broken a few days ago, and exact 25%/75% overall
//    completion tiers (the first script only produced 0/50/100%).
//  - Every passed quiz attempt created here rolls a weighted XP bonus tier
//    (common/uncommon/rare/jackpot), matching the award_quiz_xp RPC's odds,
//    so quiz_attempts.xp_awarded/xp_bonus_tier — and therefore the profile
//    timeline and leaderboard — show real variety instead of flat numbers.
//
// Usage: node scripts/seed-mock-data-v2.mjs
// Requires seed-mock-data.mjs to have already been run once (schools/course
// content) and requires sql/add_gamification_v2.sql to already be applied
// (xp_awarded/xp_bonus_tier columns).

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
const MODULES = ['road-safety', 'masoom', 'entrepreneurship', 'leadership'];
const LESSONS_BY_MODULE = {
  'road-safety': ['rs-1', 'rs-2'],
  masoom: ['ms-1', 'ms-2'],
  entrepreneurship: ['ep-1', 'ep-2'],
  leadership: ['ld-1', 'ld-2'],
};
const QUIZ_BY_MODULE = { 'road-safety': 'quiz-rs', masoom: 'quiz-ms', entrepreneurship: 'quiz-ep', leadership: 'quiz-ld' };

function daysAgo(n) { return new Date(Date.now() - n * 86400000).toISOString(); }

// Mirrors award_quiz_xp's weighted roll so mock data looks like it actually
// went through the RPC: 60% common / 25% uncommon / 12% rare / 3% jackpot.
function rollBonusTier() {
  const r = Math.random();
  if (r < 0.60) return { tier: 'common', bonus: Math.floor(Math.random() * 11) };
  if (r < 0.85) return { tier: 'uncommon', bonus: 15 + Math.floor(Math.random() * 16) };
  if (r < 0.97) return { tier: 'rare', bonus: 40 + Math.floor(Math.random() * 31) };
  return { tier: 'jackpot', bonus: 100 + Math.floor(Math.random() * 51) };
}

// Mirrors computeBaseXp(score, totalQuestions) — every quiz here has 2 questions.
function baseXp(score) { return Math.round((score / 100) * (2 * 10) + 100); }

// ── New schools ──────────────────────────────────────────────────────
async function seedNewSchools() {
  await rest('chapters?on_conflict=name', { method: 'POST', prefer: 'resolution=ignore-duplicates', body: [
    { name: 'Salem', city: 'Salem' },
  ] });

  const chapters = await rest('chapters?select=id,name');
  const chapterByName = Object.fromEntries(chapters.map(c => [c.name, c.id]));

  const schoolsToCreate = [
    { name: 'Vivekananda Vidyalaya', city: 'Salem', district: 'Salem', chapter_id: chapterByName['Salem'], organization_id: null, coordinator_name: 'Ganesan R', coordinator_mobile: '9840056789' },
    { name: 'Holy Angels Convent', city: 'Madurai', district: 'Madurai', chapter_id: chapterByName['Madurai'], organization_id: null, coordinator_name: 'Fathima Begum', coordinator_mobile: '9840067890' },
  ];
  await rest('schools?on_conflict=name', { method: 'POST', prefer: 'resolution=ignore-duplicates', body: schoolsToCreate });

  const schools = await rest('schools?select=id,name');
  return Object.fromEntries(schools.map(s => [s.name, s.id]));
}

// ── Standard 4-persona roster for the 2 new schools ─────────────────
const STANDARD_ROSTER = [
  { name: 'Yogesh Waran', gender: 'male', standard: '10th Standard', school: 'Vivekananda Vidyalaya', district: 'Salem', persona: 'graduate' },
  { name: 'Abinaya Selvi', gender: 'female', standard: '9th Standard', school: 'Vivekananda Vidyalaya', district: 'Salem', persona: 'in_progress' },
  { name: 'Dinesh Kanna', gender: 'male', standard: '8th Standard', school: 'Vivekananda Vidyalaya', district: 'Salem', persona: 'just_started' },
  { name: 'Pavithra Devi', gender: 'female', standard: '11th Standard', school: 'Vivekananda Vidyalaya', district: 'Salem', persona: 'inactive' },

  { name: 'Rahul Fernando', gender: 'male', standard: '10th Standard', school: 'Holy Angels Convent', district: 'Madurai', persona: 'graduate' },
  { name: 'Josephine Mary', gender: 'female', standard: '9th Standard', school: 'Holy Angels Convent', district: 'Madurai', persona: 'in_progress' },
  { name: 'Naveen Xavier', gender: 'male', standard: '8th Standard', school: 'Holy Angels Convent', district: 'Madurai', persona: 'just_started' },
  { name: 'Angel Priya', gender: 'female', standard: '12th Standard', school: 'Holy Angels Convent', district: 'Madurai', persona: 'inactive' },
];

// ── Variety roster: real streaks + exact 25%/75% milestone tiers ────
const VARIETY_ROSTER = [
  { name: 'Arjun Selvam',    gender: 'male',   standard: '10th Standard', school: 'Mahatama KK Nagar',              district: 'Madurai',        persona: 'streak_master' },
  { name: 'Lakshmi Narayan', gender: 'female', standard: '9th Standard',  school: 'Mahatma Anna Nagar',             district: 'Chennai',        persona: 'streak_broken' },
  { name: 'Mohammed Irfan',  gender: 'male',   standard: '11th Standard', school: 'Chennai Public School',          district: 'Chennai',        persona: 'milestone_25' },
  { name: 'Keerthana Balan', gender: 'female', standard: '8th Standard',  school: 'Nirmala Matric Hr Sec School',   district: 'Coimbatore',     persona: 'milestone_75' },
  { name: 'Sanjay Kumar',    gender: 'male',   standard: '9th Standard',  school: "St. Joseph's Matriculation",     district: 'Tiruchirappalli', persona: 'streak_master' },
];

async function seedStandardPersona(studentId, persona, seedOffset) {
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
      progressRows.push({ student_id: studentId, module_id: moduleId, lesson_id: lessons[0], status: 'COMPLETED', watch_percentage: 100, completed_at: daysAgo(dayOffset) });
      progressRows.push({ student_id: studentId, module_id: moduleId, lesson_id: lessons[1], status: 'IN_PROGRESS', watch_percentage: 55, completed_at: null });
      return;
    }

    lessons.forEach(lessonId => {
      progressRows.push({ student_id: studentId, module_id: moduleId, lesson_id: lessonId, status: 'COMPLETED', watch_percentage: 100, completed_at: daysAgo(dayOffset) });
    });

    const quizId = QUIZ_BY_MODULE[moduleId];
    if (persona === 'graduate') {
      const { tier, bonus } = rollBonusTier();
      const total = baseXp(100) + bonus;
      quizAttemptRows.push({ student_id: studentId, quiz_id: quizId, score: 100, passed: true, attempted_at: daysAgo(dayOffset - 1), xp_awarded: total, xp_bonus_tier: tier });
      xp += total;
    } else if (persona === 'in_progress' && mi === 0) {
      const { tier, bonus } = rollBonusTier();
      const total = baseXp(100) + bonus;
      quizAttemptRows.push({ student_id: studentId, quiz_id: quizId, score: 100, passed: true, attempted_at: daysAgo(dayOffset - 1), xp_awarded: total, xp_bonus_tier: tier });
      xp += total;
    } else if (persona === 'in_progress' && mi === 1) {
      const { tier, bonus } = rollBonusTier();
      const total = baseXp(100) + bonus;
      // PostgREST's bulk insert requires every object in the array to have
      // the same key set, so the failed attempt needs explicit nulls too.
      quizAttemptRows.push({ student_id: studentId, quiz_id: quizId, score: 50, passed: false, attempted_at: daysAgo(dayOffset - 1), xp_awarded: null, xp_bonus_tier: null });
      quizAttemptRows.push({ student_id: studentId, quiz_id: quizId, score: 100, passed: true, attempted_at: daysAgo(dayOffset - 0.5), xp_awarded: total, xp_bonus_tier: tier });
      xp += total;
    }
  });

  if (progressRows.length) await rest('progress', { method: 'POST', body: progressRows });
  if (quizAttemptRows.length) await rest('quiz_attempts', { method: 'POST', body: quizAttemptRows });
  if (xp > 0) await rest(`profiles?id=eq.${studentId}`, { method: 'PATCH', body: { xp } });
}

// Passes a quiz with a rolled bonus tier and returns the XP it awarded.
function passQuiz(quizAttemptRows, studentId, quizId, attemptedAt) {
  const { tier, bonus } = rollBonusTier();
  const total = baseXp(100) + bonus;
  quizAttemptRows.push({ student_id: studentId, quiz_id: quizId, score: 100, passed: true, attempted_at: attemptedAt, xp_awarded: total, xp_bonus_tier: tier });
  return total;
}

async function seedVarietyPersona(studentId, persona) {
  const progressRows = [];
  const quizAttemptRows = [];
  let xp = 0;

  const complete = (moduleId, dayOffset) => {
    LESSONS_BY_MODULE[moduleId].forEach((lessonId, li) => {
      progressRows.push({
        student_id: studentId, module_id: moduleId, lesson_id: lessonId,
        status: 'COMPLETED', watch_percentage: 100, completed_at: daysAgo(dayOffset - li * 0.01),
      });
    });
  };

  if (persona === 'milestone_25') {
    // Exactly one module complete (25% overall) — nothing else touched.
    complete('road-safety', 10);
    xp += passQuiz(quizAttemptRows, studentId, 'quiz-rs', daysAgo(9));
  }

  if (persona === 'milestone_75') {
    // First three modules complete (75% overall), leadership untouched.
    complete('road-safety', 18);
    complete('masoom', 13);
    complete('entrepreneurship', 8);
    xp += passQuiz(quizAttemptRows, studentId, 'quiz-rs', daysAgo(17));
    xp += passQuiz(quizAttemptRows, studentId, 'quiz-ms', daysAgo(12));
    xp += passQuiz(quizAttemptRows, studentId, 'quiz-ep', daysAgo(7));
  }

  if (persona === 'streak_master') {
    // One lesson completed per day, 6 consecutive days ending TODAY —
    // computeStreak() walks these back to a real 6-day streak, and
    // hasCompletedToday() is true so the dashboard never shows the
    // danger state for this student.
    const plan = [
      ['road-safety', 'rs-1', 5], ['road-safety', 'rs-2', 4],
      ['masoom', 'ms-1', 3], ['masoom', 'ms-2', 2],
      ['entrepreneurship', 'ep-1', 1], ['entrepreneurship', 'ep-2', 0],
    ];
    plan.forEach(([moduleId, lessonId, dayOffset]) => {
      progressRows.push({ student_id: studentId, module_id: moduleId, lesson_id: lessonId, status: 'COMPLETED', watch_percentage: 100, completed_at: daysAgo(dayOffset) });
    });
    xp += passQuiz(quizAttemptRows, studentId, 'quiz-rs', daysAgo(4.5));
    xp += passQuiz(quizAttemptRows, studentId, 'quiz-ms', daysAgo(2.5));
  }

  if (persona === 'streak_broken') {
    // Five consecutive days of activity that stopped 4 days ago — long
    // enough for isStreakBroken() to flag it (>= 2 days since the last
    // completion), so the one-time "Streak Lost" modal has real data.
    const plan = [
      ['road-safety', 'rs-1', 8], ['road-safety', 'rs-2', 7],
      ['masoom', 'ms-1', 6], ['masoom', 'ms-2', 5],
      ['entrepreneurship', 'ep-1', 4],
    ];
    plan.forEach(([moduleId, lessonId, dayOffset]) => {
      progressRows.push({ student_id: studentId, module_id: moduleId, lesson_id: lessonId, status: 'COMPLETED', watch_percentage: 100, completed_at: daysAgo(dayOffset) });
    });
    progressRows.push({ student_id: studentId, module_id: 'entrepreneurship', lesson_id: 'ep-2', status: 'IN_PROGRESS', watch_percentage: 40, completed_at: null });
    xp += passQuiz(quizAttemptRows, studentId, 'quiz-rs', daysAgo(7.5));
    xp += passQuiz(quizAttemptRows, studentId, 'quiz-ms', daysAgo(5.5));
  }

  if (progressRows.length) await rest('progress', { method: 'POST', body: progressRows });
  if (quizAttemptRows.length) await rest('quiz_attempts', { method: 'POST', body: quizAttemptRows });
  if (xp > 0) await rest(`profiles?id=eq.${studentId}`, { method: 'PATCH', body: { xp } });
}

async function createStudent(person, schoolIdByName) {
  const email = makePlaceholderEmail(person.name);
  const schoolId = schoolIdByName[person.school];
  const authUser = await createAuthUser({
    email,
    password: MOCK_PASSWORD,
    user_metadata: {
      fullName: person.name, school: person.school, standard: person.standard,
      section: 'A', district: person.district, gender: person.gender,
    },
  });
  const userId = authUser.id ?? authUser.user?.id;
  await rest(`profiles?id=eq.${userId}`, { method: 'PATCH', body: { school_id: schoolId } });
  await rest(`students?user_id=eq.${userId}`, { method: 'PATCH', body: { school_id: schoolId } });
  return userId;
}

async function main() {
  console.log('Seeding new schools...');
  const schoolIdByName = await seedNewSchools();
  console.log('Schools ready:', Object.keys(schoolIdByName).filter(n => ['Vivekananda Vidyalaya', 'Holy Angels Convent'].includes(n)));

  // Need every existing school's id too (variety roster targets them).
  const allSchools = await rest('schools?select=id,name');
  const allSchoolIdByName = Object.fromEntries(allSchools.map(s => [s.name, s.id]));

  const existing = await rest('profiles?select=full_name');
  const existingNames = new Set(existing.map(p => p.full_name.trim().toLowerCase()));

  let created = 0, skipped = 0;

  console.log('\nSeeding standard-persona roster for new schools...');
  for (const [i, person] of STANDARD_ROSTER.entries()) {
    if (existingNames.has(person.name.toLowerCase())) { console.log(`  skip (already exists): ${person.name}`); skipped++; continue; }
    const userId = await createStudent(person, schoolIdByName);
    await seedStandardPersona(userId, person.persona, i);
    created++;
    console.log(`  created: ${person.name} (${person.persona}) @ ${person.school}`);
  }

  console.log('\nSeeding streak/milestone variety roster...');
  for (const person of VARIETY_ROSTER) {
    if (existingNames.has(person.name.toLowerCase())) { console.log(`  skip (already exists): ${person.name}`); skipped++; continue; }
    const userId = await createStudent(person, allSchoolIdByName);
    await seedVarietyPersona(userId, person.persona);
    created++;
    console.log(`  created: ${person.name} (${person.persona}) @ ${person.school}`);
  }

  console.log('\nDone.');
  console.log(`Students created: ${created}, skipped (already existed): ${skipped}`);
  console.log(`All mock students share password: ${MOCK_PASSWORD}`);
}

main().catch(err => { console.error(err); process.exit(1); });
