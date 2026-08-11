import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// District / City → Region mapping (India-wide)
const DISTRICT_REGION: Record<string, string> = {
  // ── NORTH ──────────────────────────────────────────────────
  'Delhi': 'North', 'New Delhi': 'North', 'Noida': 'North', 'Gurgaon': 'North', 'Gurugram': 'North',
  'Faridabad': 'North', 'Ghaziabad': 'North',
  'Lucknow': 'North', 'Kanpur': 'North', 'Agra': 'North', 'Varanasi': 'North', 'Allahabad': 'North',
  'Prayagraj': 'North', 'Meerut': 'North', 'Mathura': 'North',
  'Jaipur': 'North', 'Jodhpur': 'North', 'Udaipur': 'North', 'Kota': 'North', 'Ajmer': 'North',
  'Chandigarh': 'North', 'Amritsar': 'North', 'Ludhiana': 'North', 'Patiala': 'North',
  'Shimla': 'North', 'Dehradun': 'North', 'Haridwar': 'North', 'Jammu': 'North', 'Srinagar': 'North',
  'Ambala': 'North', 'Rohtak': 'North', 'Panipat': 'North', 'Karnal': 'North',

  // ── SOUTH ──────────────────────────────────────────────────
  // Tamil Nadu
  'Chennai': 'South', 'Kancheepuram': 'South', 'Chengalpattu': 'South', 'Tiruvallur': 'South',
  'Vellore': 'South', 'Tirupattur': 'South', 'Ranipet': 'South',
  'Coimbatore': 'South', 'Tiruppur': 'South', 'Erode': 'South', 'Salem': 'South',
  'Namakkal': 'South', 'Dharmapuri': 'South', 'Krishnagiri': 'South',
  'Madurai': 'South', 'Dindigul': 'South', 'Theni': 'South', 'Virudhunagar': 'South',
  'Tirunelveli': 'South', 'Thoothukudi': 'South', 'Kanyakumari': 'South', 'Tenkasi': 'South',
  'Tiruchirappalli': 'South', 'Trichy': 'South', 'Karur': 'South', 'Thanjavur': 'South',
  'Nagapattinam': 'South', 'Cuddalore': 'South', 'Villupuram': 'South', 'Pudukottai': 'South',
  'Sivaganga': 'South', 'Ramanathapuram': 'South',
  // Kerala
  'Thiruvananthapuram': 'South', 'Trivandrum': 'South', 'Kochi': 'South', 'Ernakulam': 'South',
  'Kozhikode': 'South', 'Calicut': 'South', 'Thrissur': 'South', 'Kannur': 'South',
  'Kollam': 'South', 'Palakkad': 'South', 'Malappuram': 'South',
  // Karnataka
  'Bengaluru': 'South', 'Bangalore': 'South', 'Mysuru': 'South', 'Mysore': 'South',
  'Hubli': 'South', 'Dharwad': 'South', 'Mangaluru': 'South', 'Belgaum': 'South',
  'Belagavi': 'South', 'Gulbarga': 'South', 'Kalaburagi': 'South',
  // Andhra Pradesh & Telangana
  'Hyderabad': 'South', 'Secunderabad': 'South', 'Warangal': 'South', 'Visakhapatnam': 'South',
  'Vijayawada': 'South', 'Guntur': 'South', 'Nellore': 'South', 'Tirupati': 'South',
  'Kurnool': 'South', 'Kakinada': 'South',

  // ── EAST ───────────────────────────────────────────────────
  // West Bengal
  'Kolkata': 'East', 'Calcutta': 'East', 'Howrah': 'East', 'Durgapur': 'East',
  'Asansol': 'East', 'Siliguri': 'East', 'Darjeeling': 'East',
  // Odisha
  'Bhubaneswar': 'East', 'Cuttack': 'East', 'Rourkela': 'East', 'Puri': 'East',
  // Bihar & Jharkhand
  'Patna': 'East', 'Gaya': 'East', 'Muzaffarpur': 'East', 'Bhagalpur': 'East',
  'Ranchi': 'East', 'Jamshedpur': 'East', 'Dhanbad': 'East',

  // ── WEST ───────────────────────────────────────────────────
  // Maharashtra
  'Mumbai': 'West', 'Pune': 'West', 'Nagpur': 'West', 'Nashik': 'West',
  'Aurangabad': 'West', 'Solapur': 'West', 'Thane': 'West', 'Navi Mumbai': 'West',
  // Gujarat
  'Ahmedabad': 'West', 'Surat': 'West', 'Vadodara': 'West', 'Rajkot': 'West',
  'Gandhinagar': 'West', 'Bhavnagar': 'West', 'Jamnagar': 'West',
  // Madhya Pradesh
  'Bhopal': 'West', 'Indore': 'West', 'Jabalpur': 'West', 'Gwalior': 'West', 'Ujjain': 'West',
  // Goa, Chhattisgarh
  'Panaji': 'West', 'Goa': 'West', 'Raipur': 'West', 'Bilaspur': 'West',

  // ── NORTH EAST ─────────────────────────────────────────────
  'Guwahati': 'Northeast', 'Dibrugarh': 'Northeast', 'Silchar': 'Northeast',
  'Shillong': 'Northeast', 'Imphal': 'Northeast', 'Agartala': 'Northeast',
  'Aizawl': 'Northeast', 'Kohima': 'Northeast', 'Dimapur': 'Northeast',
  'Itanagar': 'Northeast', 'Gangtok': 'Northeast',
};

export function getRegionFromDistrict(district: string): string {
  if (!district) return 'Other';
  const key = Object.keys(DISTRICT_REGION).find(
    k => k.toLowerCase() === district.trim().toLowerCase()
  );
  return key ? DISTRICT_REGION[key] : 'Other';
}

// Singleton — prevents multiple GoTrueClient instances across HMR reloads
const g = globalThis as typeof globalThis & { _supabase?: SupabaseClient };
if (!g._supabase) {
  g._supabase = createClient(supabaseUrl, supabaseAnonKey);
}
export const supabase = g._supabase;

// Students log in with just their name + password, but Supabase Auth still requires
// an email internally — generate a hidden, never-shown placeholder for it.
export function makePlaceholderEmail(fullName: string) {
  const slug = fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '') || 'student';
  const suffix = Math.random().toString(36).slice(2, 10);
  return `${slug}.${suffix}@students.thalirverse.internal`;
}

export const dataService = {
  // Looks up an existing school by case-insensitive name match, or creates
  // one on the fly. Lets registration keep a simple free-text field while
  // still building a real, de-duplicated school directory behind it.
  async findOrCreateSchoolId(name: string, district: string): Promise<string | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const { data: existing } = await supabase.from('schools').select('id').ilike('name', trimmed).limit(1).maybeSingle();
    if (existing) return existing.id;

    const { data: chapters } = await supabase.from('chapters').select('id, name');
    const matchedChapter = chapters?.find(c => c.name.toLowerCase() === district.trim().toLowerCase());

    const { data: created, error } = await supabase.from('schools').insert({
      name: trimmed,
      city: district.trim() || 'Unknown',
      district: district.trim() || 'Unknown',
      chapter_id: matchedChapter?.id ?? null,
    }).select('id').single();

    if (error) {
      // Unique-constraint race: someone else created the same school between our lookup and insert.
      const { data: retry } = await supabase.from('schools').select('id').ilike('name', trimmed).limit(1).maybeSingle();
      if (retry) return retry.id;
      throw error;
    }
    return created.id;
  },

  async signUp(fullName: string, school: string, standard: string, sec: string, district: string, password: string) {
    const region = getRegionFromDistrict(district);
    const schoolId = await this.findOrCreateSchoolId(school, district);
    const email = makePlaceholderEmail(fullName);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { fullName, school, standard, section: sec, district, region } },
    });
    if (error) throw error;

    const profilePayload = { id: '', full_name: fullName, role: 'STUDENT', school, school_id: schoolId, standard, district, region };

    if (!data.session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (!signInError && signInData.session) {
        await supabase.from('profiles').upsert(
          { ...profilePayload, id: signInData.user.id },
          { onConflict: 'id' }
        );
        return signInData;
      }
      throw new Error('Registration could not be completed. Please try again or contact your coordinator.');
    }

    if (data.user) {
      await supabase.from('profiles').upsert(
        { ...profilePayload, id: data.user.id },
        { onConflict: 'id' }
      );
    }
    return data;
  },

  async login(fullName: string, password: string) {
    const { data: email, error: lookupError } = await supabase.rpc('resolve_login_email', { p_full_name: fullName });
    if (lookupError || !email) {
      throw new Error("We couldn't find a single account with that exact name. Double-check the spelling, or ask your coordinator if another student shares your name.");
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // ── Security-question password reset (no reachable email/phone) ──
  async setSecurityAnswer(question: string, answer: string) {
    const { error } = await supabase.rpc('set_security_answer', { p_question: question, p_answer: answer });
    if (error) throw error;
  },

  async getSecurityQuestion(fullName: string) {
    const { data, error } = await supabase.rpc('get_security_question', { p_full_name: fullName });
    if (error) throw error;
    return data as string | null;
  },

  async getActiveStudent() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, xp, security_question')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('Profile query error (check RLS policies):', profileError.message);
    }

    return {
      id: user.id,
      email: user.email,
      fullName: profile?.full_name || user.user_metadata.fullName || user.email,
      school: user.user_metadata.school || '',
      standard: user.user_metadata.standard || '',
      section: user.user_metadata.section || '',
      district: user.user_metadata.district || '',
      region: user.user_metadata.region || getRegionFromDistrict(user.user_metadata.district || ''),
      role: profile?.role || 'STUDENT',
      xp: profile?.xp ?? 0,
      securityQuestion: profile?.security_question || '',
    };
  },

  async getModules() {
    const { data: modules, error } = await supabase
      .from('modules')
      .select('*')
      .order('order_index');
    if (error) throw error;
    if (!modules?.length) return [];

    const { data: lessons } = await supabase
      .from('lessons')
      .select('*')
      .order('order_index');

    return modules.map(m => ({
      ...m,
      lessons: (lessons ?? []).filter(l => l.module_id === m.id),
    }));
  },

  async getModule(id: string) {
    const { data: module, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;

    const { data: lessons } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', id)
      .order('order_index');

    const { data: quiz } = await supabase
      .from('quizzes')
      .select('*, questions(*, answers(*))')
      .eq('module_id', id)
      .single();

    return { ...module, lessons: lessons ?? [], quiz };
  },

  async getProgress(userId: string) {
    const { data } = await supabase.from('progress').select('*').eq('student_id', userId);
    return data ?? [];
  },

  async updateLessonProgress(userId: string, moduleId: string, lessonId: string, status: string, watchPercentage: number) {
    const { error } = await supabase.from('progress').upsert({
      student_id: userId,
      module_id: moduleId,
      lesson_id: lessonId,
      status,
      watch_percentage: watchPercentage,
      completed_at: status === 'COMPLETED' ? new Date().toISOString() : null,
    }, { onConflict: 'student_id,lesson_id' });
    if (error) console.error('Progress update error:', error);
  },

  async attemptQuiz(userId: string, quizId: string, score: number, passed: boolean) {
    const { error } = await supabase.from('quiz_attempts').insert({
      student_id: userId,
      quiz_id: quizId,
      score,
      passed,
      attempted_at: new Date().toISOString(),
    });
    if (error) console.error('Quiz attempt error:', error);
  },

  async getQuizAttempts(userId: string) {
    const { data } = await supabase.from('quiz_attempts').select('*').eq('student_id', userId);
    return data ?? [];
  },

  async createModule(title: string, category: string, description: string) {
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { data: existing } = await supabase.from('modules').select('order_index').order('order_index', { ascending: false }).limit(1).single();
    const orderIndex = (existing?.order_index ?? -1) + 1;

    const { data, error } = await supabase.from('modules').insert({
      id, title, category, description,
      order_index: orderIndex,
      is_published: true,
      badge_id: `${id}-badge`,
      badge_title: `${title} Badge`,
    }).select().single();
    if (error) throw error;
    return data;
  },

  async updateModule(id: string, updates: Record<string, any>) {
    const { error } = await supabase.from('modules').update(updates).eq('id', id);
    if (error) throw error;
  },

  async updateLesson(id: string, updates: Record<string, any>) {
    const { error } = await supabase.from('lessons').update(updates).eq('id', id);
    if (error) throw error;
  },

  async addLesson(moduleId: string, title: string, contentUrl: string, orderIndex: number) {
    const rand = Math.random().toString(36).slice(2, 7);
    const id = `${moduleId}-${Date.now()}-${rand}`;
    const { data, error } = await supabase.from('lessons').insert({
      id, module_id: moduleId, title,
      lesson_type: 'VIDEO', content_url: contentUrl, order_index: orderIndex,
    }).select().single();
    if (error) throw error;
    if (!data) throw new Error('Lesson was not saved — check table permissions in Supabase.');
    return data;
  },

  async deleteLesson(id: string) {
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteModule(id: string) {
    const { error } = await supabase.from('modules').delete().eq('id', id);
    if (error) throw error;
  },

  async saveQuiz(
    moduleId: string, title: string, passPercentage: number, questions: any[],
    options?: { timeLimitSeconds?: number; shuffleQuestions?: boolean; isPublished?: boolean }
  ) {
    const quizId = `quiz-${moduleId}`;

    const { error: qzErr } = await supabase.from('quizzes').upsert({
      id: quizId, module_id: moduleId, title,
      pass_percentage: passPercentage, retry_limit: 3, is_published: options?.isPublished ?? true,
      time_limit_seconds: options?.timeLimitSeconds ?? 300,
      shuffle_questions: options?.shuffleQuestions ?? false,
    }, { onConflict: 'id' });
    if (qzErr) throw qzErr;

    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
      const qId = q.id || `q-${moduleId}-${qi + 1}-${Date.now()}`;
      const { error: qErr } = await supabase.from('questions').upsert(
        { id: qId, quiz_id: quizId, question_text: q.question_text, order_index: qi },
        { onConflict: 'id' }
      );
      if (qErr) throw qErr;

      for (let ai = 0; ai < q.answers.length; ai++) {
        const a = q.answers[ai];
        const aId = a.id || `a-${qId}-${ai + 1}`;
        const { error: aErr } = await supabase.from('answers').upsert(
          { id: aId, question_id: qId, answer_text: a.answer_text, is_correct: a.is_correct },
          { onConflict: 'id' }
        );
        if (aErr) throw aErr;
      }
    }
  },

  // Every module paired with its quiz (or null), for a standalone quiz
  // management view instead of only editing a quiz inside its module.
  async getQuizzesOverview() {
    const [{ data: modules, error: mErr }, { data: quizzes, error: qErr }] = await Promise.all([
      supabase.from('modules').select('id, title, category, order_index').order('order_index'),
      supabase.from('quizzes').select('id, module_id, title, pass_percentage, time_limit_seconds, shuffle_questions, is_published, questions(id)'),
    ]);
    if (mErr) throw mErr;
    if (qErr) throw qErr;
    const quizByModule: Record<string, any> = {};
    (quizzes ?? []).forEach(q => { quizByModule[q.module_id] = q; });
    return (modules ?? []).map(m => ({ ...m, quiz: quizByModule[m.id] ?? null }));
  },

  async deleteQuiz(quizId: string) {
    const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
    if (error) throw error;
  },

  async getStudents() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, school, school_id, standard, district, region, created_at')
      .eq('role', 'STUDENT')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getChapters() {
    const { data, error } = await supabase.from('chapters').select('id, name, city').order('name');
    if (error) throw error;
    return data ?? [];
  },

  // ── Super Admin: platform oversight ─────────────────────────────
  async getAdmins() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .in('role', ['YI_ADMIN', 'SUPER_ADMIN'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  // admin_id -> [{ id, name }] for every assigned school, in one query.
  async getAdminSchoolsMap() {
    const { data, error } = await supabase.from('admin_schools').select('admin_id, schools(id, name)');
    if (error) throw error;
    const map: Record<string, { id: string; name: string }[]> = {};
    (data ?? []).forEach((row: any) => {
      if (!row.schools) return;
      if (!map[row.admin_id]) map[row.admin_id] = [];
      map[row.admin_id].push(row.schools);
    });
    return map;
  },

  // Just this one admin's assigned school ids — used to scope a Yi
  // Admin's own view down to their schools/organizations.
  async getAdminSchoolIds(adminId: string): Promise<string[]> {
    const { data, error } = await supabase.from('admin_schools').select('school_id').eq('admin_id', adminId);
    if (error) throw error;
    return (data ?? []).map(r => r.school_id);
  },

  // Additive — adds one school to an admin's assignments without
  // touching their existing ones (unlike setAdminSchools, which replaces
  // the whole set). Used when a Yi Admin creates a new school, so it
  // doesn't immediately vanish from their own scoped view.
  async assignAdminToSchool(adminId: string, schoolId: string) {
    const { error } = await supabase.from('admin_schools').upsert(
      { admin_id: adminId, school_id: schoolId },
      { onConflict: 'admin_id,school_id' }
    );
    if (error) throw error;
  },

  async setAdminSchools(adminId: string, schoolIds: string[]) {
    const { error: delError } = await supabase.from('admin_schools').delete().eq('admin_id', adminId);
    if (delError) throw delError;
    if (schoolIds.length === 0) return;
    const { error: insError } = await supabase.from('admin_schools').insert(
      schoolIds.map(schoolId => ({ admin_id: adminId, school_id: schoolId }))
    );
    if (insError) throw insError;
  },

  async getContentStats() {
    const [{ count: totalQuestions }, { data: quizzes }] = await Promise.all([
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('quizzes').select('id, is_published'),
    ]);
    return {
      totalQuestions: totalQuestions ?? 0,
      totalQuizzes: quizzes?.length ?? 0,
      publishedQuizzes: quizzes?.filter(q => q.is_published).length ?? 0,
    };
  },

  // ── School directory (organizations = brands, schools = campuses) ──
  async getSchoolsDirectory() {
    const { data, error } = await supabase
      .from('schools')
      .select('id, name, city, district, chapter_id, organization_id, coordinator_name, coordinator_mobile, organizations(id, name)')
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  async getOrganizations() {
    const { data, error } = await supabase.from('organizations').select('*').order('name');
    if (error) throw error;
    return data ?? [];
  },

  async createOrganization(name: string) {
    const { data, error } = await supabase.from('organizations').insert({ name: name.trim() }).select().single();
    if (error) throw error;
    return data;
  },

  async updateOrganization(id: string, name: string) {
    const { error } = await supabase.from('organizations').update({ name: name.trim() }).eq('id', id);
    if (error) throw error;
  },

  async deleteOrganization(id: string) {
    const { error } = await supabase.from('organizations').delete().eq('id', id);
    if (error) throw error;
  },

  async createSchool(fields: { name: string; city: string; district: string; chapter_id?: string | null; organization_id?: string | null; coordinator_name?: string; coordinator_mobile?: string }) {
    const { data, error } = await supabase.from('schools').insert(fields).select().single();
    if (error) throw error;
    return data;
  },

  async updateSchool(id: string, updates: Record<string, any>) {
    const { error } = await supabase.from('schools').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deleteSchool(id: string) {
    const { error } = await supabase.from('schools').delete().eq('id', id);
    if (error) throw error;
  },

  async getAllProgress() {
    const { data } = await supabase.from('progress').select('student_id,module_id,lesson_id,status,completed_at');
    return data ?? [];
  },

  async getAllQuizAttempts() {
    const { data } = await supabase.from('quiz_attempts').select('student_id,quiz_id,score,passed,attempted_at');
    return data ?? [];
  },

  async deleteStudent(userId: string) {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
  },

  async signOut() {
    await supabase.auth.signOut();
  },
};
