import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isGraduate as isGraduateShared } from '@/lib/gamification';
import { CheckmarkReveal, CertificatePreviewCard, DownloadCertificateButton } from './CertificateReveal';

// This is a public verification-link page — visitors are never signed in,
// so the anon client (subject to RLS: `id = auth.uid()`) can never read the
// student's data here regardless of the query. Uses the service-role admin
// client instead, safe because this file is a plain Server Component
// (executes server-only, never bundled to the client).
async function getCertificateData(studentId: string) {
  const admin = getSupabaseAdmin();

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, school, standard, created_at')
    .eq('id', studentId)
    .single();

  const [{ data: modulesRaw }, { data: lessons }, { data: quizzes }, { data: progress }, { data: attempts }] = await Promise.all([
    admin.from('modules').select('id, title, order_index').eq('is_published', true),
    admin.from('lessons').select('id, module_id'),
    admin.from('quizzes').select('id, module_id'),
    admin.from('progress').select('lesson_id, status, completed_at').eq('student_id', studentId),
    admin.from('quiz_attempts').select('quiz_id, score, passed, attempted_at').eq('student_id', studentId),
  ]);
  const modules = (modulesRaw ?? []).map(m => ({
    ...m,
    lessons: (lessons ?? []).filter(l => l.module_id === m.id),
    quiz_id: quizzes?.find(q => q.module_id === m.id)?.id ?? null,
  }));

  const passedAttempts = (attempts ?? []).filter(a => a.passed);
  const isGraduate = isGraduateShared(modules, progress ?? [], attempts ?? []);
  const issueDate  = passedAttempts.reduce<string | null>((latest, a) => {
    if (!latest) return a.attempted_at;
    return a.attempted_at > latest ? a.attempted_at : latest;
  }, null) ?? new Date().toISOString();

  const avgScore = passedAttempts.length
    ? Math.round(passedAttempts.reduce((s, a) => s + a.score, 0) / passedAttempts.length)
    : 0;

  const grade = avgScore >= 90 ? 'Distinction' : avgScore >= 75 ? 'Merit' : 'Pass';

  return { profile, isGraduate, issueDate, grade, avgScore };
}

export default async function CertificateVerification({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, isGraduate, issueDate, grade } = await getCertificateData(id);

  const issueFormatted = new Date(issueDate).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const studentName = profile?.full_name ?? 'Thalir Graduate';
  const studentId   = `TV-${new Date(profile?.created_at ?? Date.now()).getFullYear()}-${id.slice(0, 4).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-neutral-50 font-body text-neutral-900 flex flex-col">

      {/* Top navbar */}
      <header className="bg-white border-b border-neutral-100 h-14 flex items-center justify-between px-6 shadow-sm sticky top-0 z-40 print:hidden">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-500 text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          <span className="font-headline font-black text-orange-500">ThalirVerse</span>
        </div>
        <nav className="flex items-center gap-4 text-sm font-label font-semibold">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-neutral-500 hover:text-orange-500 transition-colors font-bold">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Dashboard
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          {isGraduate ? (
            /* ── Verified Layout ────────────────────────────────── */
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

              {/* Left panel: verification status + actions */}
              <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-8 flex flex-col gap-6 print:hidden">
                {/* Check icon */}
                <CheckmarkReveal />

                {/* Actions */}
                <div className="space-y-3">
                  <DownloadCertificateButton />
                  <button className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-neutral-200 hover:border-orange-400 hover:text-orange-500 text-neutral-600 font-bold text-sm rounded-xl transition-all">
                    <span className="material-symbols-outlined text-sm">share</span>
                    Share Verification Link
                  </button>
                </div>

                {/* Issue date */}
                <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <span className="material-symbols-outlined text-orange-500 text-xl">calendar_today</span>
                  <div>
                    <p className="text-[10px] font-label font-bold text-neutral-400 uppercase tracking-wider">Issued Date</p>
                    <p className="text-sm font-bold text-neutral-800">{issueFormatted}</p>
                  </div>
                </div>
              </div>

              {/* Right panel: student card + certificate preview */}
              <div className="space-y-5">
                {/* Student info card */}
                <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden print:hidden">
                  {/* Orange header bar */}
                  <div className="h-20 bg-gradient-to-r from-orange-500 to-orange-600 relative">
                    <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-black text-orange-500">
                      {studentName[0]}
                    </div>
                  </div>

                  <div className="pt-12 pb-6 px-6">
                    <h3 className="text-xl font-headline font-black text-neutral-900">{studentName}</h3>
                    <p className="text-sm text-neutral-500 mt-0.5">Certificate Number: {studentId}</p>

                    <div className="grid grid-cols-2 gap-4 mt-5">
                      <div>
                        <p className="text-[10px] font-label font-bold text-neutral-400 uppercase tracking-wider mb-1">Course</p>
                        <p className="text-sm font-bold text-neutral-800">Thalir Graduate</p>
                        <p className="text-xs text-neutral-500">All Young Indians Courses</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-label font-bold text-neutral-400 uppercase tracking-wider mb-1">Grade</p>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-amber-400 text-sm"
                            style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <p className="text-sm font-bold text-neutral-800">{grade}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificate preview */}
                <CertificatePreviewCard studentName={studentName} issueFormatted={issueFormatted} grade={grade} certificateNumber={studentId} />
              </div>
            </div>
          ) : (
            /* ── Not Yet Graduated ──────────────────────────────── */
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-12 text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-orange-500">workspace_premium</span>
              </div>
              <h2 className="text-2xl font-headline font-black text-neutral-900 mb-3">Certificate Not Yet Earned</h2>
              <p className="text-sm text-neutral-500 leading-relaxed mb-8">
                Complete all course modules and pass every quiz to unlock your Thalir Graduate certificate.
              </p>
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/20 transition-all">
                Continue Learning
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-100 py-4 px-6 print:hidden">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400 font-label">
          <span>ThalirVerse | © 2026 ThalirVerse. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-neutral-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-neutral-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
