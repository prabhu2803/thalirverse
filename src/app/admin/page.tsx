'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dataService, supabase } from '@/lib/supabaseClient';
import AdminSidebar from './AdminSidebar';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // View Progress modal
  const [progressStudent, setProgressStudent] = useState<any>(null);
  const [studentProgress, setStudentProgress] = useState<any[]>([]);
  const [studentQuizAttempts, setStudentQuizAttempts] = useState<any[]>([]);
  const [allModules, setAllModules] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Delete student modal
  const [deleteStudentTarget, setDeleteStudentTarget] = useState<any>(null);
  const [deletingStudent, setDeletingStudent] = useState(false);

  // Toast for reset password
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function loadAdminData() {
      try {
        const activeAdmin = await dataService.getActiveStudent();
        if (!activeAdmin) { router.push('/login'); return; }
        setAdminProfile(activeAdmin);

        const [students, modules] = await Promise.all([
          dataService.getStudents(),
          dataService.getModules(),
        ]);
        setStudentsList(students);
        setAllModules(modules);

        // Fetch completed lesson counts per student
        const counts: Record<string, number> = {};
        await Promise.all(
          students.map(async (s: any) => {
            const prog = await dataService.getProgress(s.id);
            counts[s.id] = prog.filter((p: any) => p.status === 'COMPLETED').length;
          })
        );
        setProgressMap(counts);
      } catch (e) {
        console.error('Error loading admin data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  useEffect(() => {
    if (!searchQuery) { setFilteredStudents(studentsList); return; }
    const q = searchQuery.toLowerCase();
    setFilteredStudents(studentsList.filter(s =>
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.school?.toLowerCase().includes(q)
    ));
  }, [searchQuery, studentsList]);

  const handleViewProgress = async (student: any) => {
    setProgressStudent(student);
    setLoadingProgress(true);
    try {
      const [modules, progress, quizAttempts] = await Promise.all([
        dataService.getModules(),
        dataService.getProgress(student.id),
        dataService.getQuizAttempts(student.id),
      ]);
      setAllModules(modules);
      setStudentProgress(progress);
      setStudentQuizAttempts(quizAttempts);
    } catch (e) {
      console.error('Error loading progress:', e);
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setToast(`Reset email sent to ${email}`);
    } catch (err: any) {
      setToast(`Failed: ${err.message}`);
    } finally {
      setTimeout(() => setToast(''), 4000);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudentTarget) return;
    setDeletingStudent(true);
    try {
      await dataService.deleteStudent(deleteStudentTarget.id);
      setStudentsList(prev => prev.filter(s => s.id !== deleteStudentTarget.id));
      setDeleteStudentTarget(null);
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      setDeletingStudent(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;
    const headers = ['Full Name', 'Email', 'School', 'Standard', 'Lessons Completed'];
    const rows = filteredStudents.map(s => [
      s.full_name, s.email, s.school || '', s.standard || '',
      progressMap[s.id] ?? 0,
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `thalirverse_roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !adminProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-orange-500 font-bold flex flex-col items-center gap-2">
          <span className="animate-spin text-4xl">⏳</span>
          <span>Loading Admin Console...</span>
        </div>
      </div>
    );
  }

  const isSuperAdmin = adminProfile.role === 'SUPER_ADMIN';
  const totalLessons = allModules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const totalStudents = filteredStudents.length;
  const graduateCount = filteredStudents.filter(s => totalLessons > 0 && (progressMap[s.id] ?? 0) >= totalLessons).length;
  const activeLearnersCount = filteredStudents.filter(s => (progressMap[s.id] ?? 0) > 0 && (progressMap[s.id] ?? 0) < totalLessons).length;

  return (
    <div className="flex overflow-hidden h-screen bg-neutral-50 font-body text-neutral-900">
      <AdminSidebar role={adminProfile.role} adminName={adminProfile.fullName} />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100 h-16 flex items-center px-8 shadow-sm">
          <h2 className="text-base font-headline font-bold text-neutral-700">Student Roster</h2>
        </header>

      <main className="px-8 pt-8 pb-10 space-y-8 max-w-7xl">
        {/* Page Title */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded tracking-wider ${
              isSuperAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {isSuperAdmin ? 'Super Admin' : 'Yi Admin'}
            </span>
            <h1 className="text-3xl font-black font-headline tracking-tight mt-2">Platform Analytics</h1>
            <p className="text-neutral-500 text-sm mt-1">Managing students, modules, and graduation metrics.</p>
          </div>
          {totalStudents > 0 && (
            <button
              onClick={handleExportCSV}
              className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center gap-2 text-sm hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
          )}
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-label font-bold text-neutral-400 uppercase tracking-widest mb-1 block">Total Students</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-headline text-neutral-900">{totalStudents}</span>
              <span className="text-xs text-green-500 font-bold">Registered</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-label font-bold text-neutral-400 uppercase tracking-widest mb-1 block">Graduates</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-headline text-neutral-900">{graduateCount}</span>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded font-black uppercase text-[10px]">Certified</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-label font-bold text-neutral-400 uppercase tracking-widest mb-1 block">Active Learners</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-headline text-neutral-900">{activeLearnersCount}</span>
              <span className="text-xs text-orange-500 font-bold">In Progress</span>
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-neutral-400 text-sm">search</span>
            <input
              type="text"
              placeholder="Search by name, school, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all"
            />
          </div>
        </section>

        {/* Roster Table */}
        <section className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100">
            <h3 className="font-bold font-headline text-base">Active Roster ({filteredStudents.length})</h3>
          </div>

          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-400 font-bold font-label uppercase text-[10px] tracking-wider border-b border-neutral-100">
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">School & Standard</th>
                    <th className="px-6 py-4">Lessons Completed</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredStudents.map((student) => {
                    const completed = progressMap[student.id] ?? 0;
                    const isGraduate = totalLessons > 0 && completed >= totalLessons;
                    return (
                      <tr key={student.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold">{student.full_name}</div>
                          <div className="text-xs text-neutral-400 mt-0.5">{student.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-neutral-700">{student.school || '—'}</div>
                          <div className="text-xs text-neutral-400 mt-0.5">{student.standard || '—'}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-neutral-700">
                          {completed} / {totalLessons}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider ${
                            isGraduate ? 'text-green-600 bg-green-50' : 'text-orange-500 bg-orange-50'
                          }`}>
                            {isGraduate ? 'Graduate' : 'Learning'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleViewProgress(student)}
                              title="View Progress"
                              className="p-2 rounded-xl text-neutral-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                            >
                              <span className="material-symbols-outlined text-lg">bar_chart</span>
                            </button>
                            <button
                              onClick={() => handleResetPassword(student.email)}
                              title="Reset Password"
                              className="p-2 rounded-xl text-neutral-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                            >
                              <span className="material-symbols-outlined text-lg">lock_reset</span>
                            </button>
                            <button
                              onClick={() => setDeleteStudentTarget(student)}
                              title="Delete Student"
                              className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 px-6">
              <div className="w-20 h-20 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl">group_off</span>
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-lg font-bold">No Students Registered Yet</h4>
                <p className="text-sm text-neutral-400">
                  No students on the platform yet.
                </p>
              </div>
              <Link href="/register" className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl transition-all">
                Go to Student Registration
              </Link>
            </div>
          )}
        </section>
      </main>

      {/* ── Toast notification ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xl animate-[fade-in_0.2s_ease-out]">
          {toast}
        </div>
      )}

      {/* ── View Progress Modal ── */}
      {progressStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-[fade-in_0.2s_ease-out]">
            <div className="flex justify-between items-start p-6 border-b border-neutral-100 shrink-0">
              <div>
                <h3 className="font-headline font-black text-lg">{progressStudent.full_name}</h3>
                <p className="text-xs text-neutral-400 mt-0.5">{progressStudent.email}</p>
              </div>
              <button onClick={() => setProgressStudent(null)}
                className="material-symbols-outlined text-neutral-400 hover:text-neutral-600 p-1 rounded-full transition-all">
                close
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {loadingProgress ? (
                <div className="flex justify-center py-10">
                  <span className="text-orange-500 font-bold animate-pulse">Loading progress...</span>
                </div>
              ) : (
                <>
                  {allModules.map(m => {
                    const moduleLessonIds = m.lessons?.map((l: any) => l.id) ?? [];
                    const completed = studentProgress.filter(p =>
                      moduleLessonIds.includes(p.lesson_id) && p.status === 'COMPLETED'
                    ).length;
                    const total = moduleLessonIds.length;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                    const quizAttempt = studentQuizAttempts
                      .filter(a => a.quiz_id === `quiz-${m.id}`)
                      .sort((a, b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime())[0];

                    return (
                      <div key={m.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-neutral-800">{m.title}</span>
                          <span className="text-xs font-bold text-neutral-500">{completed}/{total} lessons</span>
                        </div>
                        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-orange-400'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        {quizAttempt && (
                          <div className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit ${
                            quizAttempt.passed ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'
                          }`}>
                            Quiz: {quizAttempt.score}% — {quizAttempt.passed ? 'Passed' : 'Failed'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {allModules.length === 0 && (
                    <p className="text-sm text-neutral-400 text-center py-6">No modules found.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Student Modal ── */}
      {deleteStudentTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-[fade-in_0.2s_ease-out]">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-red-500">person_off</span>
              </div>
              <div>
                <h3 className="font-headline font-black text-lg">Remove Student?</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  <span className="font-bold text-neutral-700">{deleteStudentTarget.full_name}</span> will be removed from the platform roster.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button onClick={() => setDeleteStudentTarget(null)}
                  className="w-1/2 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-sm transition-all">
                  Cancel
                </button>
                <button onClick={handleDeleteStudent} disabled={deletingStudent}
                  className="w-1/2 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50">
                  {deletingStudent ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
      </div>
    </div>
  );
}
