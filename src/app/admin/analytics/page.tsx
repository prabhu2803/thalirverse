'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dataService } from '@/lib/supabaseClient';
import AdminSidebar from '../AdminSidebar';

const REGIONS = ['North', 'South', 'East', 'West', 'Northeast', 'Other'];

export default function SuperAdminAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState('');
  const [adminName, setAdminName] = useState('');

  const [students, setStudents] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [allQuizAttempts, setAllQuizAttempts] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const admin = await dataService.getActiveStudent();
      // Both YI_ADMIN and SUPER_ADMIN can view analytics
      if (!admin || !['YI_ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
        router.push('/login');
        return;
      }
      setAdminRole(admin.role);
      setAdminName(admin.fullName || 'Admin');
      const [s, m, p, q] = await Promise.all([
        dataService.getStudents(),
        dataService.getModules(),
        dataService.getAllProgress(),
        dataService.getAllQuizAttempts(),
      ]);
      setStudents(s);
      setModules(m);
      setAllProgress(p);
      setAllQuizAttempts(q);
      setLoading(false);
    }
    load();
  }, []);

  // ── Helpers ──────────────────────────────────────────────────
  function isModuleComplete(moduleId: string, lessons: any[], studentId: string): boolean {
    if (!lessons || lessons.length === 0) {
      return allQuizAttempts.some(a => a.student_id === studentId && a.quiz_id === `quiz-${moduleId}` && a.passed);
    }
    return lessons.every(l =>
      allProgress.some(p => p.student_id === studentId && p.lesson_id === l.id && p.status === 'COMPLETED')
    );
  }

  function isGraduate(studentId: string): boolean {
    return modules.length > 0 && modules.every(m => isModuleComplete(m.id, m.lessons ?? [], studentId));
  }

  function studentModuleCompletionCount(studentId: string): number {
    return modules.filter(m => isModuleComplete(m.id, m.lessons ?? [], studentId)).length;
  }

  // ── Summary stats ─────────────────────────────────────────────
  const totalStudents = students.length;
  const graduates = students.filter(s => isGraduate(s.id));
  const active = students.filter(s => !isGraduate(s.id) && studentModuleCompletionCount(s.id) > 0);
  const notStarted = students.filter(s => !isGraduate(s.id) && studentModuleCompletionCount(s.id) === 0);
  const avgCompletion = totalStudents > 0 && modules.length > 0
    ? Math.round(students.reduce((acc, s) => acc + studentModuleCompletionCount(s.id), 0) / (totalStudents * modules.length) * 100)
    : 0;

  // ── Student status distribution ─────────────────────────────────
  const statusSegments = [
    { label: 'Active',      count: graduates.length,  color: 'bg-green-500' },
    { label: 'In Progress', count: active.length,     color: 'bg-orange-500' },
    { label: 'Not Started', count: notStarted.length, color: 'bg-neutral-300' },
  ];

  // ── Recent activity feed ──────────────────────────────────────
  const studentNameById: Record<string, string> = {};
  students.forEach(s => { studentNameById[s.id] = s.full_name; });
  const lessonInfoById: Record<string, { lessonTitle: string; moduleTitle: string }> = {};
  const moduleTitleById: Record<string, string> = {};
  modules.forEach(m => {
    moduleTitleById[m.id] = m.title;
    (m.lessons ?? []).forEach((l: any) => {
      lessonInfoById[l.id] = { lessonTitle: l.title, moduleTitle: m.title };
    });
  });

  const recentActivity = [
    ...allProgress
      .filter(p => p.status === 'COMPLETED' && p.completed_at)
      .map(p => ({
        studentName: studentNameById[p.student_id] ?? 'Unknown Student',
        text: `Completed "${lessonInfoById[p.lesson_id]?.lessonTitle ?? 'a lesson'}"`,
        module: lessonInfoById[p.lesson_id]?.moduleTitle ?? '—',
        status: 'completed' as 'completed' | 'passed' | 'failed',
        at: p.completed_at as string,
      })),
    ...allQuizAttempts
      .filter(a => a.attempted_at)
      .map(a => ({
        studentName: studentNameById[a.student_id] ?? 'Unknown Student',
        text: `${a.passed ? 'Passed' : 'Failed'} "${moduleTitleById[a.quiz_id?.replace('quiz-', '')] ?? 'a quiz'}" (${a.score}%)`,
        module: moduleTitleById[a.quiz_id?.replace('quiz-', '')] ?? '—',
        status: (a.passed ? 'passed' : 'failed') as 'completed' | 'passed' | 'failed',
        at: a.attempted_at as string,
      })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 20);

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // ── Module breakdown ──────────────────────────────────────────
  const moduleStats = modules.map(m => {
    const completed = students.filter(s => isModuleComplete(m.id, m.lessons ?? [], s.id)).length;
    return { ...m, completed, rate: totalStudents > 0 ? Math.round((completed / totalStudents) * 100) : 0 };
  }).sort((a, b) => b.rate - a.rate);

  // ── Region breakdown ──────────────────────────────────────────
  const regionStats = REGIONS.map(region => {
    const group = students.filter(s => (s.region || 'Other') === region);
    const grads = group.filter(s => isGraduate(s.id)).length;
    const rate = group.length > 0 ? Math.round((grads / group.length) * 100) : 0;
    return { region, count: group.length, graduates: grads, rate };
  }).filter(r => r.count > 0).sort((a, b) => b.count - a.count);

  // ── School breakdown ──────────────────────────────────────────
  const schoolMap: Record<string, { students: number; graduates: number }> = {};
  students.forEach(s => {
    const name = s.school || 'Unknown School';
    if (!schoolMap[name]) schoolMap[name] = { students: 0, graduates: 0 };
    schoolMap[name].students++;
    if (isGraduate(s.id)) schoolMap[name].graduates++;
  });
  const schoolStats = Object.entries(schoolMap)
    .map(([name, v]) => ({ name, ...v, rate: Math.round((v.graduates / v.students) * 100) }))
    .sort((a, b) => b.students - a.students)
    .slice(0, 10);

  // ── District breakdown ────────────────────────────────────────
  const districtMap: Record<string, { region: string; students: number; graduates: number }> = {};
  students.forEach(s => {
    const d = s.district || 'Unknown';
    if (!districtMap[d]) districtMap[d] = { region: s.region || 'Other', students: 0, graduates: 0 };
    districtMap[d].students++;
    if (isGraduate(s.id)) districtMap[d].graduates++;
  });
  const districtStats = Object.entries(districtMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.students - a.students);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="text-orange-500 font-bold flex flex-col items-center gap-2">
        <span className="animate-spin text-4xl">⏳</span>
        <span>Loading Analytics...</span>
      </div>
    </div>
  );

  return (
    <div className="flex overflow-hidden h-screen bg-neutral-50 font-body text-neutral-900">
      <AdminSidebar role={adminRole} adminName={adminName} />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100 h-16 flex items-center px-8 shadow-sm">
          <h2 className="text-base font-headline font-bold text-neutral-700">Performance Analytics</h2>
        </header>

      <main className="px-8 pt-8 pb-12 space-y-10 max-w-7xl">

        {/* ── Summary cards ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: 'Total Students', value: totalStudents, sub: 'Registered',
              iconBg: 'bg-blue-50', iconColor: 'text-blue-600', icon: 'groups',
              trendClass: 'text-green-500 bg-green-50',
              bars: ['h-4','h-6','h-8','h-10'],
              barColor: 'bg-blue-600', barFade: ['bg-blue-100','bg-blue-100','bg-blue-200'],
            },
            {
              label: 'Graduates', value: graduates.length, sub: 'All modules done',
              iconBg: 'bg-orange-50', iconColor: 'text-orange-600', icon: 'bolt',
              trendClass: 'text-green-500 bg-green-50',
              bars: ['h-10','h-8','h-9','h-7'],
              barColor: 'bg-orange-600', barFade: ['bg-orange-100','bg-orange-100','bg-orange-200'],
            },
            {
              label: 'Completion Rate', value: `${avgCompletion}%`, sub: 'Across all modules',
              iconBg: 'bg-purple-50', iconColor: 'text-purple-600', icon: 'verified',
              trendClass: 'text-green-500 bg-green-50',
              bars: ['h-5','h-4','h-6','h-5'],
              barColor: 'bg-purple-600', barFade: ['bg-purple-100','bg-purple-100','bg-purple-200'],
            },
            {
              label: 'Active Learners', value: active.length, sub: 'In progress',
              iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', icon: 'trending_up',
              trendClass: 'text-green-500 bg-green-50',
              bars: ['h-4','h-7','h-9','h-10'],
              barColor: 'bg-emerald-600', barFade: ['bg-emerald-100','bg-emerald-100','bg-emerald-200'],
            },
          ].map(card => (
            <div key={card.label}
              className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 group hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 ${card.iconBg} rounded-2xl flex items-center justify-center ${card.iconColor} group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
                </div>
                <span className={`font-bold text-xs flex items-center gap-1 px-2 py-1 rounded-full ${card.trendClass}`}>
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                </span>
              </div>
              <p className="text-gray-500 font-medium text-sm">{card.label}</p>
              <h4 className="text-2xl font-black text-slate-900 mt-1">{card.value}</h4>
              <div className="h-10 mt-4 flex items-end gap-1">
                {[...card.barFade, card.barColor].map((c, i) => (
                  <div key={i} className={`flex-1 rounded-t-sm ${c} ${card.bars[i]}`} />
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ── Student status distribution ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-headline font-black">Student Status Distribution</h2>
          <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6">
            {totalStudents === 0 ? (
              <p className="text-sm text-neutral-400">No students yet.</p>
            ) : (
              <>
                <div className="flex w-full h-3 rounded-full overflow-hidden gap-0.5">
                  {statusSegments.filter(s => s.count > 0).map(s => (
                    <div key={s.label} className={`${s.color} h-full`}
                      style={{ width: `${(s.count / totalStudents) * 100}%` }} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-2 mt-5">
                  {statusSegments.map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                      <span className="text-xs font-bold text-neutral-700">{s.label}</span>
                      <span className="text-xs text-neutral-400">
                        {s.count} ({totalStudents > 0 ? Math.round((s.count / totalStudents) * 100) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── Module completion rates ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-headline font-black">Module Completion Rates</h2>
          {moduleStats.length === 0 ? (
            <p className="text-sm text-neutral-400">No modules yet.</p>
          ) : (
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 space-y-5">
              {moduleStats.map(m => (
                <div key={m.id}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-sm font-bold text-neutral-800">{m.title}</span>
                      <span className="text-xs text-neutral-400 ml-2">{m.completed}/{totalStudents} students</span>
                    </div>
                    <span className={`text-sm font-black ${m.rate >= 75 ? 'text-green-600' : m.rate >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
                      {m.rate}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${
                      m.rate >= 75 ? 'bg-green-500' : m.rate >= 40 ? 'bg-orange-500' : 'bg-red-400'
                    }`} style={{ width: `${m.rate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Region + District breakdown ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Region */}
          <section className="space-y-4">
            <h2 className="text-lg font-headline font-black">Region Breakdown</h2>
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
              {regionStats.length === 0 ? (
                <p className="p-6 text-sm text-neutral-400">No region data yet — students need to fill in their district on registration.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-400 font-bold font-label uppercase text-[10px] tracking-wider border-b border-neutral-100">
                      <th className="px-5 py-3">Region</th>
                      <th className="px-5 py-3 text-center">Students</th>
                      <th className="px-5 py-3 text-center">Graduates</th>
                      <th className="px-5 py-3 text-center">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {regionStats.map(r => (
                      <tr key={r.region} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-5 py-3 font-bold">{r.region}</td>
                        <td className="px-5 py-3 text-center">{r.count}</td>
                        <td className="px-5 py-3 text-center text-green-600 font-bold">{r.graduates}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-xs font-black px-2 py-0.5 rounded ${
                            r.rate >= 75 ? 'bg-green-50 text-green-600' : r.rate >= 40 ? 'bg-orange-50 text-orange-500' : 'bg-neutral-100 text-neutral-500'
                          }`}>{r.rate}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* District */}
          <section className="space-y-4">
            <h2 className="text-lg font-headline font-black">District Breakdown</h2>
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden max-h-80 overflow-y-auto">
              {districtStats.length === 0 ? (
                <p className="p-6 text-sm text-neutral-400">No district data yet.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-neutral-50 border-b border-neutral-100">
                    <tr className="text-neutral-400 font-bold font-label uppercase text-[10px] tracking-wider">
                      <th className="px-5 py-3">District</th>
                      <th className="px-5 py-3">Region</th>
                      <th className="px-5 py-3 text-center">Students</th>
                      <th className="px-5 py-3 text-center">Grads</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {districtStats.map(d => (
                      <tr key={d.name} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-5 py-3 font-bold">{d.name}</td>
                        <td className="px-5 py-3 text-xs text-neutral-400">{d.region}</td>
                        <td className="px-5 py-3 text-center">{d.students}</td>
                        <td className="px-5 py-3 text-center text-green-600 font-bold">{d.graduates}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

        {/* ── Recent activity ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-headline font-black">Recent Activity</h2>
          <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
            {recentActivity.length === 0 ? (
              <p className="p-6 text-sm text-neutral-400">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-100 max-h-96 overflow-y-auto">
                {recentActivity.map((item, i) => (
                  <li key={i} className="flex items-center gap-4 px-6 py-3.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      item.status === 'failed' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
                    }`}>
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {item.status === 'failed' ? 'close' : item.status === 'passed' ? 'workspace_premium' : 'check'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-800 truncate">{item.studentName}</p>
                      <p className="text-xs text-neutral-500 truncate">{item.text} · {item.module}</p>
                    </div>
                    <span className="text-xs text-neutral-400 shrink-0">{relativeTime(item.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── School stats ── */}
        <section className="space-y-4 pb-4">
          <h2 className="text-lg font-headline font-black">School-wise Breakdown</h2>
          <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
            {schoolStats.length === 0 ? (
              <p className="p-6 text-sm text-neutral-400">No school data yet — students need to fill in their school on registration.</p>
            ) : (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-400 font-bold font-label uppercase text-[10px] tracking-wider border-b border-neutral-100">
                    <th className="px-6 py-3">School</th>
                    <th className="px-6 py-3 text-center">Students</th>
                    <th className="px-6 py-3 text-center">Graduates</th>
                    <th className="px-6 py-3 text-center">Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {schoolStats.map(s => (
                    <tr key={s.name} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-3 font-bold">{s.name}</td>
                      <td className="px-6 py-3 text-center">{s.students}</td>
                      <td className="px-6 py-3 text-center text-green-600 font-bold">{s.graduates}</td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${s.rate}%` }} />
                          </div>
                          <span className="text-xs font-bold text-neutral-600">{s.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </main>
      </div>
    </div>
  );
}
