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
    { label: 'Active',      count: graduates.length,  color: 'bg-green-500',  text: 'text-green-500' },
    { label: 'In Progress', count: active.length,     color: 'bg-orange-500', text: 'text-orange-500' },
    { label: 'Not Started', count: notStarted.length, color: 'bg-neutral-300', text: 'text-neutral-300' },
  ];
  const donutCircumference = 100; // path below is normalized to a 100-unit perimeter
  let donutCursor = 0;
  const donutArcs = statusSegments.map(s => {
    const pct = totalStudents > 0 ? (s.count / totalStudents) * donutCircumference : 0;
    const arc = { ...s, pct, offset: -donutCursor };
    donutCursor += pct;
    return arc;
  });

  // ── Recent activity feed ──────────────────────────────────────
  const studentNameById: Record<string, string> = {};
  students.forEach(s => { studentNameById[s.id] = s.full_name; });
  const lessonInfoById: Record<string, { lessonTitle: string; moduleTitle: string; moduleId: string }> = {};
  const moduleTitleById: Record<string, string> = {};
  modules.forEach(m => {
    moduleTitleById[m.id] = m.title;
    (m.lessons ?? []).forEach((l: any) => {
      lessonInfoById[l.id] = { lessonTitle: l.title, moduleTitle: m.title, moduleId: m.id };
    });
  });

  function moduleProgressPct(moduleId: string, studentId: string): number {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return 0;
    const lessons = mod.lessons ?? [];
    if (!lessons.length) {
      return allQuizAttempts.some(a => a.student_id === studentId && a.quiz_id === `quiz-${moduleId}` && a.passed) ? 100 : 0;
    }
    const done = lessons.filter((l: any) =>
      allProgress.some(p => p.student_id === studentId && p.lesson_id === l.id && p.status === 'COMPLETED')
    ).length;
    return Math.round((done / lessons.length) * 100);
  }

  const recentActivity = [
    ...allProgress
      .filter(p => p.status === 'COMPLETED' && p.completed_at)
      .map(p => ({
        studentId: p.student_id as string,
        studentName: studentNameById[p.student_id] ?? 'Unknown Student',
        text: `Completed "${lessonInfoById[p.lesson_id]?.lessonTitle ?? 'a lesson'}"`,
        module: lessonInfoById[p.lesson_id]?.moduleTitle ?? '—',
        moduleId: lessonInfoById[p.lesson_id]?.moduleId as string | undefined,
        kind: 'completed' as 'completed' | 'passed' | 'failed',
        at: p.completed_at as string,
      })),
    ...allQuizAttempts
      .filter(a => a.attempted_at)
      .map(a => ({
        studentId: a.student_id as string,
        studentName: studentNameById[a.student_id] ?? 'Unknown Student',
        text: `${a.passed ? 'Passed' : 'Failed'} "${moduleTitleById[a.quiz_id?.replace('quiz-', '')] ?? 'a quiz'}" (${a.score}%)`,
        module: moduleTitleById[a.quiz_id?.replace('quiz-', '')] ?? '—',
        moduleId: a.quiz_id?.replace('quiz-', '') as string | undefined,
        kind: (a.passed ? 'passed' : 'failed') as 'completed' | 'passed' | 'failed',
        at: a.attempted_at as string,
      })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 20);

  function activityStatus(item: typeof recentActivity[number]): { label: string; cls: string } {
    if (item.kind === 'failed') return { label: 'At Risk', cls: 'bg-red-100 text-red-700' };
    const pct = item.moduleId ? moduleProgressPct(item.moduleId, item.studentId) : (item.kind === 'passed' ? 100 : 0);
    if (pct >= 100) return { label: 'Completed', cls: 'bg-green-100 text-green-700' };
    if (pct > 0) return { label: 'In Progress', cls: 'bg-blue-100 text-blue-700' };
    return { label: 'Just Started', cls: 'bg-yellow-100 text-yellow-700' };
  }

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

  const handleExportReport = () => {
    const lines: string[] = [
      'ThalirVerse Performance Analytics Report', '',
      'Summary',
      `Total Students,${totalStudents}`,
      `Graduates,${graduates.length}`,
      `Completion Rate,${avgCompletion}%`,
      `Active Learners,${active.length}`, '',
      'Module Completion Rates',
      'Module,Completed,Rate',
      ...moduleStats.map(m => `${m.title},${m.completed}/${totalStudents},${m.rate}%`), '',
      'Region Breakdown',
      'Region,Students,Graduates,Rate',
      ...regionStats.map(r => `${r.region},${r.count},${r.graduates},${r.rate}%`), '',
      'School Breakdown',
      'School,Students,Graduates,Completion',
      ...schoolStats.map(s => `${s.name},${s.students},${s.graduates},${s.rate}%`),
    ];
    const csv = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'thalirverse_analytics_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100 h-16 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-base font-headline font-bold text-neutral-700">Organizer Analytics Dashboard</h2>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-neutral-800 leading-tight">{adminName}</p>
              <p className="text-[10px] text-neutral-400 font-medium">{adminRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Course Admin'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-black ring-2 ring-orange-100">
              {adminName.trim().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
            </div>
          </div>
        </header>

      <main className="px-8 pt-8 pb-12 space-y-10 max-w-7xl">

        {/* ── Page header ── */}
        <section className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <p className="text-orange-600 font-bold text-sm mb-1">OVERVIEW</p>
            <h3 className="text-3xl font-black text-neutral-900 tracking-tight">Performance Analytics</h3>
          </div>
          <div className="flex gap-3">
            <span className="flex items-center gap-2 bg-white border border-neutral-200 text-neutral-500 px-4 py-2 rounded-xl font-bold text-sm">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              All Time
            </span>
            <button onClick={handleExportReport}
              className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95">
              <span className="material-symbols-outlined text-lg">file_download</span>
              Export Report
            </button>
          </div>
        </section>

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

        {/* ── Module completion chart + Student status donut ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Module Completion Rates — animated bar chart */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-neutral-100">
            <div className="mb-8">
              <h5 className="text-xl font-bold text-neutral-900">Module Completion Rates</h5>
              <p className="text-sm text-neutral-500">Progress by curriculum module</p>
            </div>
            {moduleStats.length === 0 ? (
              <p className="text-sm text-neutral-400">No modules yet.</p>
            ) : (
              <div className="flex items-end justify-between h-64 gap-4 px-2">
                {moduleStats.map(m => (
                  <div key={m.id} className="flex-1 h-full flex flex-col items-center justify-end gap-2 group cursor-pointer">
                    <div className="w-full h-full bg-orange-50 rounded-xl relative overflow-hidden">
                      <div className={`absolute bottom-0 left-0 w-full rounded-xl transition-all duration-700 ${
                        m.rate >= 75 ? 'bg-green-500' : m.rate >= 40 ? 'bg-orange-500' : 'bg-red-400'
                      }`} style={{ height: `${m.rate}%` }} />
                      <div className="absolute inset-x-0 top-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-black text-neutral-700 bg-white/90 px-1.5 py-0.5 rounded shadow-sm">{m.rate}%</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400 text-center leading-tight">{m.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student Status — donut chart */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-neutral-100 flex flex-col items-center">
            <div className="w-full mb-6">
              <h5 className="text-xl font-bold text-neutral-900">Student Status</h5>
              <p className="text-sm text-neutral-500">Distribution of all learners</p>
            </div>
            {totalStudents === 0 ? (
              <p className="text-sm text-neutral-400 py-10">No students yet.</p>
            ) : (
              <>
                <div className="relative w-48 h-48 mb-8">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-neutral-100" stroke="currentColor" strokeWidth="4" fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    {donutArcs.filter(a => a.pct > 0).map(a => (
                      <path key={a.label} className={a.text} stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"
                        strokeDasharray={`${a.pct}, 100`} strokeDashoffset={a.offset}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-neutral-900">{totalStudents}</span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">Total Students</span>
                  </div>
                </div>
                <div className="w-full space-y-3">
                  {statusSegments.map(s => (
                    <div key={s.label} className="flex justify-between items-center bg-neutral-50 p-3 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${s.color}`} />
                        <span className="text-sm font-bold text-neutral-600">{s.label}</span>
                      </div>
                      <span className="text-sm font-black text-neutral-900">
                        {totalStudents > 0 ? Math.round((s.count / totalStudents) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-headline font-black">Recent Activity</h2>
              <p className="text-sm text-neutral-500">Monitor student engagement in real-time</p>
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm p-8">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-neutral-400">No activity yet.</p>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100 text-left sticky top-0 bg-white">
                      <th className="pb-4 font-bold text-neutral-400 text-xs uppercase tracking-widest">Student</th>
                      <th className="pb-4 font-bold text-neutral-400 text-xs uppercase tracking-widest">Module</th>
                      <th className="pb-4 font-bold text-neutral-400 text-xs uppercase tracking-widest">Progress</th>
                      <th className="pb-4 font-bold text-neutral-400 text-xs uppercase tracking-widest">Status</th>
                      <th className="pb-4 font-bold text-neutral-400 text-xs uppercase tracking-widest text-right">Last Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {recentActivity.map((item, i) => {
                      const status = activityStatus(item);
                      const pct = item.moduleId ? moduleProgressPct(item.moduleId, item.studentId) : (item.kind === 'passed' ? 100 : 0);
                      const initials = item.studentName.trim().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
                      return (
                        <tr key={i} className="hover:bg-orange-50/30 transition-colors">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-black shrink-0">
                                {initials}
                              </div>
                              <span className="font-bold text-neutral-800 text-sm truncate">{item.studentName}</span>
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            <span className="text-sm text-neutral-600 font-medium">{item.module}</span>
                          </td>
                          <td className="py-4 pr-4">
                            <div className="w-24 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="bg-orange-500 h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-neutral-400 mt-1 block">{pct}% Complete</span>
                          </td>
                          <td className="py-4 pr-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${status.cls}`}>{status.label}</span>
                          </td>
                          <td className="py-4 text-right">
                            <span className="text-sm text-neutral-500">{relativeTime(item.at)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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

      {adminRole === 'SUPER_ADMIN' && (
        <Link href="/admin/modules"
          className="fixed bottom-8 right-8 w-14 h-14 bg-orange-600 text-white rounded-full shadow-2xl shadow-orange-300 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          <div className="absolute right-16 bg-neutral-900 text-white text-xs font-bold py-2 px-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Create New Course
          </div>
        </Link>
      )}
    </div>
  );
}
