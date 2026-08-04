'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { dataService, supabase, getRegionFromDistrict } from '@/lib/supabaseClient';

const NAV_LINKS = [
  { label: 'My Learning',  href: '/dashboard', icon: 'auto_stories' },
  { label: 'Explore',      href: '/explore',   icon: 'search' },
  { label: 'Achievements', href: '/profile',   icon: 'military_tech' },
];

const BADGE_ICONS: Record<string, string> = {
  'road-safety':     'local_police',
  'masoom':          'shield',
  'entrepreneurship':'rocket_launch',
  'leadership':      'stars',
};

export default function Profile() {
  const router   = useRouter();
  const pathname = usePathname();
  const [student,      setStudent]      = useState<any>(null);
  const [modules,      setModules]      = useState<any[]>([]);
  const [progress,     setProgress]     = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [isModalOpen,      setIsModalOpen]      = useState(false);
  const [showAllActivity,  setShowAllActivity]  = useState(false);
  const [lessonMap,        setLessonMap]        = useState<Record<string, { title: string; moduleId: string }>>({});
  const [moduleLessons,    setModuleLessons]    = useState<Record<string, string[]>>({});

  // Edit form state
  const [fullName,         setFullName]         = useState('');
  const [school,           setSchool]           = useState('');
  const [standard,         setStandard]         = useState('');
  const [section,          setSection]          = useState('');
  const [district,         setDistrict]         = useState('');
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [showNewPw,        setShowNewPw]        = useState(false);
  const [showConfirmPw,    setShowConfirmPw]    = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [successMsg,       setSuccessMsg]       = useState('');
  const [errorMsg,         setErrorMsg]         = useState('');

  const loadData = async () => {
    try {
      const s = await dataService.getActiveStudent();
      if (!s) { router.push('/login'); return; }
      setStudent(s);
      setFullName(s.fullName || '');
      setSchool(s.school || '');
      setStandard(s.standard || '');
      setSection(s.section || '');
      setDistrict(s.district || '');
      const [prog, attempts, mods, lessonsData] = await Promise.all([
        dataService.getProgress(s.id),
        dataService.getQuizAttempts(s.id),
        dataService.getModules(),
        supabase.from('lessons').select('id, title, module_id'),
      ]);
      setProgress(prog);
      setQuizAttempts(attempts);
      setModules(mods);
      // Build flat lesson lookup: lesson_id → {title, moduleId}
      const map: Record<string, { title: string; moduleId: string }> = {};
      // Build module → [lesson_ids] map for completion checks
      const byMod: Record<string, string[]> = {};
      for (const l of lessonsData.data ?? []) {
        map[l.id] = { title: l.title, moduleId: l.module_id };
        if (!byMod[l.module_id]) byMod[l.module_id] = [];
        byMod[l.module_id].push(l.id);
      }
      setLessonMap(map);
      setModuleLessons(byMod);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const isModuleComplete = (m: any) => {
    // Use directly-fetched lesson data (bypasses silent getModules() lessons failure)
    const lessonIds = moduleLessons[m.id] ?? m.lessons?.map((l: any) => l.id) ?? [];
    if (!lessonIds.length) return quizAttempts.some(a => a.quiz_id === `quiz-${m.id}` && a.passed);
    return lessonIds.every((lid: string) => progress.some(p => p.lesson_id === lid && p.status === 'COMPLETED'));
  };

  const completedModules = useMemo(() => modules.filter(m => isModuleComplete(m)), [modules, moduleLessons, progress, quizAttempts]);
  const isGraduate       = modules.length > 0 && completedModules.length === modules.length;
  const xp               = useMemo(() => (
    progress.filter(p => p.status === 'COMPLETED').length * 10 +
    quizAttempts.filter(a => a.passed).length * 100
  ), [progress, quizAttempts]);

  // Activity feed from progress records
  const allActivity = useMemo(() =>
    progress
      .filter(p => p.completed_at)
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()),
  [progress]);

  const activityFeed = useMemo(
    () => showAllActivity ? allActivity : allActivity.slice(0, 5),
    [allActivity, showAllActivity]
  );

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 14) return '1 week ago';
    return `${Math.floor(days / 7)} weeks ago`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg('');
    if (newPassword && newPassword !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }
    if (newPassword && newPassword.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      const updates: Record<string, any> = {
        data: { fullName, school, standard, section, district, region: getRegionFromDistrict(district) },
      };
      if (newPassword) updates.password = newPassword;
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      await supabase.from('profiles').update({
        full_name: fullName, school, standard, district,
        region: getRegionFromDistrict(district),
      }).eq('id', student.id);
      setSuccessMsg('Profile updated successfully!');
      setNewPassword(''); setConfirmPassword('');
      setTimeout(() => { setIsModalOpen(false); loadData(); }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  if (loading || !student) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-orange-500 font-bold flex flex-col items-center gap-2">
          <span className="animate-spin text-4xl">⏳</span>
          <span>Loading Profile...</span>
        </div>
      </div>
    );
  }

  const initials = student.fullName.trim().split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex overflow-hidden h-screen bg-neutral-50 font-body text-neutral-900">

      {/* ── Left sidebar ── identical structure to dashboard ───── */}
      <aside className="w-64 bg-white border-r border-neutral-100 flex-col h-screen hidden lg:flex shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-10">
            <span className="material-symbols-outlined text-orange-500" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>school</span>
            <span className="text-2xl font-headline font-black text-orange-500 tracking-tight">ThalirVerse</span>
          </div>
          <nav className="space-y-1">
            {NAV_LINKS.map(link => {
              const isActive =
                link.label === 'My Learning'  ? pathname === '/dashboard' :
                link.label === 'Explore'      ? pathname.startsWith('/explore') :
                link.label === 'Achievements' ? pathname.startsWith('/profile') :
                false;
              if ((link as any).disabled) {
                return (
                  <span key={link.label}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-label font-semibold text-neutral-300 cursor-not-allowed select-none">
                    <span className="material-symbols-outlined">{link.icon}</span>
                    {link.label}
                    <span className="ml-auto text-[9px] font-black uppercase tracking-wider">Soon</span>
                  </span>
                );
              }
              return (
                <Link key={link.label} href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-label font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-bold'
                      : 'text-neutral-500 hover:bg-orange-50 hover:text-orange-500'
                  }`}>
                  <span className="material-symbols-outlined"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-neutral-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-black shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{student.fullName}</p>
              <p className="text-[10px] text-neutral-500 truncate">{student.standard || 'Student'}</p>
            </div>
          </div>
          <button
            onClick={async () => { await dataService.signOut(); router.push('/login'); }}
            className="flex items-center gap-3 px-4 py-2 text-neutral-500 hover:text-red-500 transition-colors w-full">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label text-sm font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-8 space-y-8 min-h-full">

          {/* Profile hero — matches Stitch: large avatar, stats row, edit button */}
          <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative shrink-0">
              <div className="w-32 h-32 rounded-3xl bg-orange-500 flex items-center justify-center text-white text-5xl font-black shadow-xl shadow-orange-500/20">
                {initials}
              </div>
              <div className="absolute -bottom-3 -right-3 bg-orange-500 text-white p-2 rounded-2xl shadow-lg ring-4 ring-white">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-3xl font-headline font-black text-neutral-900">{student.fullName}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {student.standard && (
                    <span className="bg-orange-50 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full">{student.standard}</span>
                  )}
                  {student.district && (
                    <span className="bg-neutral-100 text-neutral-600 text-xs font-bold px-3 py-1.5 rounded-full">{student.district}</span>
                  )}
                </div>
              </div>
              {student.school && (
                <p className="text-base text-neutral-500 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                  <span className="material-symbols-outlined text-orange-400">school</span>
                  {student.school}{student.section ? ` • Section ${student.section}` : ''}
                </p>
              )}
              <div className="mt-6 grid grid-cols-3 gap-6 max-w-xs mx-auto md:mx-0">
                {[
                  { label: 'XP Points', value: xp.toLocaleString() },
                  { label: 'Courses',   value: completedModules.length },
                  { label: 'Badges',    value: completedModules.length },
                ].map((s, i) => (
                  <div key={s.label} className={`text-center md:text-left ${i > 0 ? 'border-l border-neutral-200 pl-4' : ''}`}>
                    <div className="text-2xl font-black text-orange-500">{s.value}</div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => { setIsModalOpen(true); setSuccessMsg(''); setErrorMsg(''); }}
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 shrink-0">
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit Profile
            </button>
          </div>

          {/* Main grid — matches Stitch: lg:grid-cols-3, left=2, right=1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column (2 cols) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Badges Showcase */}
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline font-black text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500 text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                  Badges Showcase
                </h3>
                <span className="text-xs text-neutral-400 font-label font-bold">
                  {completedModules.length}/{modules.length} earned
                </span>
              </div>

              {modules.length === 0 ? (
                <p className="text-sm text-neutral-400">No modules available yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  {modules.map(m => {
                    const earned = isModuleComplete(m);
                    const icon   = BADGE_ICONS[m.id] ?? 'workspace_premium';
                    const COLORS: Record<string, { grad: string; ring: string }> = {
                      'road-safety':      { grad: 'from-amber-400 to-amber-600',  ring: 'ring-amber-200' },
                      'masoom':           { grad: 'from-blue-400 to-blue-600',    ring: 'ring-blue-200' },
                      'entrepreneurship': { grad: 'from-purple-400 to-purple-600',ring: 'ring-purple-200' },
                      'leadership':       { grad: 'from-green-400 to-green-600',  ring: 'ring-green-200' },
                    };
                    const c = COLORS[m.id] ?? { grad: 'from-orange-400 to-orange-600', ring: 'ring-orange-200' };
                    return (
                      <div key={m.id}
                        className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 text-center transition-all ${
                          earned
                            ? 'bg-white border-neutral-100 shadow-sm hover:shadow-md hover:-translate-y-1'
                            : 'bg-neutral-50 border-dashed border-neutral-200 opacity-50 grayscale'
                        }`}>
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                          earned ? `bg-gradient-to-br ${c.grad} ring-4 ${c.ring}` : 'bg-neutral-200'
                        }`}>
                          <span className="material-symbols-outlined text-white text-3xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}>{earned ? icon : 'lock'}</span>
                        </div>
                        <div>
                          <p className="text-xs font-black text-neutral-800 leading-tight">
                            {m.badge_title || m.title}
                          </p>
                          <p className={`text-[10px] font-bold mt-1 ${earned ? 'text-orange-500' : 'text-neutral-400'}`}>
                            {earned ? '✓ Earned' : 'Locked'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Certificates */}
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6">
              <h3 className="font-headline font-black text-lg mb-5">Certificates</h3>

              {completedModules.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {completedModules.map(m => {
                    const attempt = quizAttempts
                      .filter(a => a.quiz_id === `quiz-${m.id}` && a.passed)
                      .sort((a: any, b: any) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime())[0];
                    const date = attempt
                      ? new Date(attempt.attempted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '';
                    return (
                      <div key={m.id} className="p-4 border border-orange-100 rounded-2xl bg-orange-50/40 flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-orange-500 text-xl"
                              style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-neutral-800 truncate">{m.title}</h4>
                            {date && <p className="text-xs text-neutral-400 font-label mt-0.5">Issued: {date}</p>}
                          </div>
                        </div>
                        <button className="w-full flex items-center justify-center gap-1.5 py-2 bg-white border border-neutral-200 hover:border-orange-400 hover:text-orange-500 text-neutral-500 text-xs font-bold rounded-xl transition-all">
                          <span className="material-symbols-outlined text-sm">download</span>
                          Download PDF
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-neutral-300 mb-2 block">workspace_premium</span>
                  <p className="text-sm text-neutral-400">Complete modules to earn certificates.</p>
                  <Link href="/dashboard" className="mt-3 inline-block text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors">
                    Go to Dashboard →
                  </Link>
                </div>
              )}

              {/* Graduation certificate */}
              <div className={`mt-5 p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                isGraduate ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50' : 'border-dashed border-neutral-200 bg-neutral-50 opacity-60'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    isGraduate ? 'bg-orange-100 text-orange-600' : 'bg-neutral-200 text-neutral-400'
                  }`}>
                    <span className="material-symbols-outlined text-2xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}>grade</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-neutral-800">Thalir Graduate Certificate</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {isGraduate ? '🎉 All modules complete — unlocked!' : `Complete all ${modules.length} modules to unlock`}
                    </p>
                  </div>
                </div>
                {isGraduate ? (
                  <Link href={`/certificate/${student.id}`}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0">
                    View & Verify
                  </Link>
                ) : (
                  <span className="px-4 py-2 bg-neutral-200 text-neutral-400 text-xs font-bold rounded-xl cursor-not-allowed shrink-0">
                    Locked
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right column (1 col) */}
          <div className="lg:col-span-1 space-y-8">

            {/* Module Progress */}
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6">
              <h2 className="text-xl font-headline font-black flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-orange-500"
                  style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
                Module Progress
              </h2>
              <div className="space-y-4">
                {modules.map(m => {
                  const lessons = m.lessons ?? [];
                  const done = lessons.length > 0
                    ? lessons.filter((l: any) => progress.some(p => p.lesson_id === l.id && p.status === 'COMPLETED')).length
                    : (quizAttempts.some(a => a.quiz_id === `quiz-${m.id}` && a.passed) ? 1 : 0);
                  const total  = lessons.length || 1;
                  const pct    = Math.round((done / total) * 100);
                  const icon   = BADGE_ICONS[m.id] ?? 'auto_stories';
                  return (
                    <div key={m.id}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="material-symbols-outlined text-sm text-orange-400"
                          style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                        <span className="text-xs font-bold text-neutral-700 flex-1 truncate">{m.title}</span>
                        <span className={`text-xs font-black ${pct === 100 ? 'text-green-500' : 'text-orange-500'}`}>{pct}%</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {modules.length === 0 && <p className="text-xs text-neutral-400 text-center py-2">No modules yet.</p>}
              </div>
            </div>

            {/* Learning History — vertical timeline matching Stitch */}
            <div className="space-y-4">
              <h2 className="text-xl font-headline font-black flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">history</span>
                Learning History
              </h2>
              <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-8 relative overflow-hidden">
                {activityFeed.length > 0 ? (
                  <>
                    <div className="absolute left-[2.75rem] top-12 bottom-12 w-0.5 bg-neutral-100" />
                    <ul className="space-y-8 relative">
                      {activityFeed.map((item, i) => {
                        const lessonInfo = lessonMap[item.lesson_id];
                        const mod        = modules.find(m => m.id === (item.module_id ?? lessonInfo?.moduleId));
                        return (
                          <li key={i} className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center z-10 ring-8 ring-white shadow-md shrink-0">
                              <span className="material-symbols-outlined text-sm text-white"
                                style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                            </div>
                            <div className="pt-2 min-w-0">
                              <h3 className="text-sm font-bold text-neutral-800 leading-tight truncate">
                                {lessonInfo?.title ?? 'Lesson'}
                              </h3>
                              {mod && <p className="text-xs text-neutral-500 mt-0.5 truncate">{mod.title}</p>}
                              <p className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
                                <span className="material-symbols-outlined text-xs">calendar_today</span>
                                {relativeTime(item.completed_at)}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {allActivity.length > 5 && (
                      <button
                        onClick={() => setShowAllActivity(v => !v)}
                        className="w-full mt-8 text-neutral-400 font-bold text-xs uppercase tracking-widest hover:text-orange-500 transition-colors">
                        {showAllActivity ? 'Show Less' : `View Full Timeline (${allActivity.length})`}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-neutral-400">No activity yet.</p>
                    <Link href="/dashboard" className="mt-2 inline-block text-sm font-bold text-orange-500">Start a lesson →</Link>
                  </div>
                )}
              </div>
            </div>

            {/* Current Goal */}
            <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 relative overflow-hidden">
              <h3 className="font-headline font-black text-lg text-neutral-800 mb-4">Current Goal</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1.5">
                    <span>Thalir Elite Level</span>
                    <span className="text-orange-500">{modules.length > 0 ? Math.round((completedModules.length / modules.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all duration-700"
                      style={{ width: `${modules.length > 0 ? (completedModules.length / modules.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {completedModules.length < modules.length
                    ? `Complete ${modules.length - completedModules.length} more module${modules.length - completedModules.length !== 1 ? 's' : ''} to unlock the Thalir Elite badge and graduate!`
                    : '🎉 All modules complete — Thalir Elite reached!'}
                </p>
              </div>
              <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl text-orange-200/60 rotate-12"
                style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            </div>
          </div>
          </div>{/* close grid */}
        </div>
      </main>

      {/* ── Edit Profile Modal ────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4 mb-6">
              <h3 className="font-headline font-black text-xl text-neutral-800">Edit Profile</h3>
              <button onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-orange-500 hover:bg-neutral-50 p-1.5 rounded-full transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {successMsg && <div className="p-3 mb-4 text-xs text-green-600 bg-green-50 rounded-xl border border-green-100 font-bold">{successMsg}</div>}
            {errorMsg   && <div className="p-3 mb-4 text-xs text-red-600 bg-red-50 rounded-xl border border-red-100 font-bold">{errorMsg}</div>}

            <form onSubmit={handleSave} className="space-y-4">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Profile Details</p>

              {[
                { label: 'Full Name',    val: fullName, set: setFullName, type: 'text', placeholder: 'Your full name' },
                { label: 'School Name', val: school,   set: setSchool,   type: 'text', placeholder: 'Your school name' },
              ].map(f => (
                <div key={f.label} className="flex flex-col">
                  <label className="font-label font-semibold text-xs text-neutral-500 mb-2">{f.label}</label>
                  <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Standard</label>
                  <select value={standard} onChange={e => setStandard(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm appearance-none transition-all">
                    <option value="">Select class</option>
                    {['6th','7th','8th','9th','10th','11th','12th'].map(s => (
                      <option key={s} value={`${s} Standard`}>{s} Standard</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Section</label>
                  <input type="text" value={section} onChange={e => setSection(e.target.value)} placeholder="A"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="font-label font-semibold text-xs text-neutral-500 mb-2">District / City</label>
                <input type="text" value={district} onChange={e => setDistrict(e.target.value)} placeholder="Madurai"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
              </div>

              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pt-2">
                Change Password <span className="normal-case font-normal">(leave blank to keep current)</span>
              </p>

              {[
                { label: 'New Password', val: newPassword, set: setNewPassword, show: showNewPw, toggle: () => setShowNewPw(s => !s), ph: 'Min 6 characters' },
                { label: 'Confirm New Password', val: confirmPassword, set: setConfirmPassword, show: showConfirmPw, toggle: () => setShowConfirmPw(s => !s), ph: 'Re-enter password' },
              ].map(f => (
                <div key={f.label} className="flex flex-col">
                  <label className="font-label font-semibold text-xs text-neutral-500 mb-2">{f.label}</label>
                  <div className="relative">
                    <input type={f.show ? 'text' : 'password'} value={f.val}
                      onChange={e => f.set(e.target.value)} placeholder={f.ph}
                      className="w-full pl-4 pr-12 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                    <button type="button" onClick={f.toggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                      <span className="material-symbols-outlined text-[20px]">{f.show ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="w-1/3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3.5 rounded-xl text-sm transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="w-2/3 bg-orange-500 hover:bg-orange-600 text-white font-headline font-bold py-3.5 rounded-xl text-sm shadow-md disabled:opacity-50 transition-all">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
