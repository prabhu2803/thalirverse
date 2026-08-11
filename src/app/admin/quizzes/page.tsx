'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dataService } from '@/lib/supabaseClient';
import AdminSidebar from '../AdminSidebar';

export default function AdminQuizzes() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState('');
  const [adminName, setAdminName] = useState('');
  const [overview, setOverview] = useState<any[]>([]);
  const [loadError, setLoadError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const admin = await dataService.getActiveStudent();
        if (!admin || !['SUPER_ADMIN', 'YI_ADMIN'].includes(admin.role)) { router.push('/login'); return; }
        setAdminRole(admin.role);
        setAdminName(admin.fullName || 'Admin');
        await refresh();
      } catch (e: any) {
        setLoadError(e?.message || 'Failed to load quizzes.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function refresh() {
    try {
      setOverview(await dataService.getQuizzesOverview());
      setLoadError('');
    } catch (e: any) {
      setLoadError(e?.message || 'Failed to load quizzes.');
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget?.quiz) return;
    setDeleting(true);
    try {
      await dataService.deleteQuiz(deleteTarget.quiz.id);
      setDeleteTarget(null);
      await refresh();
    } catch (e: any) {
      setLoadError(e?.message || 'Failed to delete quiz.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="text-orange-500 font-bold flex flex-col items-center gap-2">
        <span className="animate-spin text-4xl">⏳</span>
        <span>Loading Quizzes...</span>
      </div>
    </div>
  );

  const withQuiz = overview.filter(m => m.quiz).length;

  return (
    <div className="flex overflow-hidden h-screen bg-neutral-50 font-body text-neutral-900">
      <AdminSidebar role={adminRole} adminName={adminName} />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <main className="px-8 pt-8 pb-12 space-y-8 max-w-5xl">
          <section>
            <h1 className="text-3xl font-black font-headline tracking-tight">Quiz Builder</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Every module and its quiz — edit any quiz directly, without opening its module first.
              {overview.length > 0 && ` ${withQuiz}/${overview.length} modules have a quiz.`}
            </p>
          </section>

          {loadError && (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-2xl border border-red-100 font-bold">{loadError}</div>
          )}

          <section className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
            {overview.length === 0 ? (
              <p className="p-10 text-center text-sm text-neutral-400">No modules yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-400 font-bold font-label uppercase text-[10px] tracking-wider border-b border-neutral-100">
                      <th className="px-6 py-4">Module</th>
                      <th className="px-6 py-4">Quiz</th>
                      <th className="px-6 py-4 text-center">Questions</th>
                      <th className="px-6 py-4 text-center">Pass %</th>
                      <th className="px-6 py-4 text-center">Time Limit</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {overview.map(m => (
                      <tr key={m.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold">{m.title}</div>
                          <div className="text-xs text-neutral-400 mt-0.5">{m.category}</div>
                        </td>
                        <td className="px-6 py-4 text-neutral-600">
                          {m.quiz ? m.quiz.title : <span className="text-neutral-300">— none —</span>}
                        </td>
                        <td className="px-6 py-4 text-center font-bold">
                          {m.quiz ? m.quiz.questions?.length ?? 0 : '—'}
                        </td>
                        <td className="px-6 py-4 text-center">{m.quiz ? `${m.quiz.pass_percentage}%` : '—'}</td>
                        <td className="px-6 py-4 text-center">
                          {m.quiz ? `${Math.round((m.quiz.time_limit_seconds ?? 300) / 60)} min` : '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {m.quiz ? (
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider ${
                              m.quiz.is_published ? 'text-green-600 bg-green-50' : 'text-neutral-400 bg-neutral-50'
                            }`}>{m.quiz.is_published ? 'Published' : 'Draft'}</span>
                          ) : (
                            <span className="text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider text-neutral-300 bg-neutral-50">No Quiz</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <Link href={`/admin/quizzes/${m.id}`} title={m.quiz ? 'Edit Quiz' : 'Create Quiz'}
                              className="p-2 rounded-xl text-neutral-400 hover:text-orange-500 hover:bg-orange-50 transition-all">
                              <span className="material-symbols-outlined text-lg">{m.quiz ? 'edit' : 'add_circle'}</span>
                            </Link>
                            {m.quiz && (
                              <button onClick={() => setDeleteTarget(m)} title="Delete Quiz"
                                className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ── Delete confirm ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-red-500">delete_forever</span>
              </div>
              <div>
                <h3 className="font-headline font-black text-lg">Delete Quiz?</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  The quiz for <span className="font-bold text-neutral-700">{deleteTarget.title}</span> and all its questions will be permanently removed. Students will earn a badge on lesson completion only.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button onClick={() => setDeleteTarget(null)} className="w-1/2 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-sm transition-all">Cancel</button>
                <button onClick={handleDelete} disabled={deleting}
                  className="w-1/2 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all">
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
