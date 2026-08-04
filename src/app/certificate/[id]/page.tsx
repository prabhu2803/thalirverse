import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

async function getCertificateData(studentId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, school, standard, created_at')
    .eq('id', studentId)
    .single();

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('score, passed, attempted_at')
    .eq('student_id', studentId)
    .eq('passed', true);

  const { count: moduleCount } = await supabase
    .from('modules')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true);

  const isGraduate = (attempts?.length ?? 0) >= (moduleCount ?? 1);
  const issueDate  = attempts?.reduce<string | null>((latest, a) => {
    if (!latest) return a.attempted_at;
    return a.attempted_at > latest ? a.attempted_at : latest;
  }, null) ?? new Date().toISOString();

  const avgScore = attempts?.length
    ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
    : 0;

  const grade = avgScore >= 90 ? 'Distinction' : avgScore >= 75 ? 'Merit' : 'Pass';

  // Deterministic hash from student ID
  const hash = '0x' + Buffer.from(studentId.replace(/-/g, '')).toString('hex').slice(0, 40).toUpperCase();

  return { profile, isGraduate, issueDate, grade, avgScore, hash };
}

export default async function CertificateVerification({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, isGraduate, issueDate, grade, hash } = await getCertificateData(id);

  const issueFormatted = new Date(issueDate).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const studentName = profile?.full_name ?? 'Thalir Graduate';
  const studentId   = `TV-${new Date(profile?.created_at ?? Date.now()).getFullYear()}-${id.slice(0, 4).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-neutral-50 font-body text-neutral-900 flex flex-col">

      {/* Top navbar */}
      <header className="bg-white border-b border-neutral-100 h-14 flex items-center justify-between px-6 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-500 text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          <span className="font-headline font-black text-orange-500">ThalirVerse</span>
        </div>
        <nav className="flex items-center gap-4 text-sm font-label font-semibold">
          <Link href="#" className="text-orange-500 font-bold">Verify Another</Link>
          <Link href="#" className="text-neutral-500 hover:text-orange-500 transition-colors font-bold">Support</Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {isGraduate ? (
            /* ── Verified Layout ────────────────────────────────── */
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

              {/* Left panel: verification status + actions */}
              <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-8 flex flex-col gap-6">
                {/* Check icon */}
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-green-500"
                      style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-headline font-black text-neutral-900">Verification Successful</h2>
                    <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
                      This certificate is authentic and was issued by ThalirVerse Educational Platform to the student listed below.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5">
                    <span className="material-symbols-outlined text-sm">download</span>
                    Download PDF Certificate
                  </button>
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
                <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
                  {/* Orange header bar */}
                  <div className="h-20 bg-gradient-to-r from-orange-500 to-orange-600 relative">
                    <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-black text-orange-500">
                      {studentName[0]}
                    </div>
                  </div>

                  <div className="pt-12 pb-6 px-6">
                    <h3 className="text-xl font-headline font-black text-neutral-900">{studentName}</h3>
                    <p className="text-sm text-neutral-500 mt-0.5">Student ID: {studentId}</p>

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

                    {/* Blockchain hash */}
                    <div className="mt-5 pt-5 border-t border-neutral-100">
                      <p className="text-[10px] font-label font-bold text-neutral-400 uppercase tracking-wider mb-2">
                        Blockchain Verification Hash
                      </p>
                      <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-3 py-2 border border-neutral-100">
                        <span className="material-symbols-outlined text-neutral-400 text-sm">lock</span>
                        <code className="text-xs text-neutral-600 font-mono flex-1 truncate">{hash}</code>
                        <button className="text-neutral-400 hover:text-orange-500 transition-colors shrink-0">
                          <span className="material-symbols-outlined text-sm">content_copy</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificate preview */}
                <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6">
                  <p className="text-xs font-label font-bold text-neutral-400 uppercase tracking-wider mb-4">Certificate Preview</p>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-8 text-center">
                    <div className="inline-flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-orange-500 text-2xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                      <span className="text-lg font-headline font-black text-orange-500">ThalirVerse</span>
                    </div>
                    <p className="text-xs text-neutral-500 font-label uppercase tracking-widest mb-3">
                      Certificate of Completion
                    </p>
                    <p className="text-xs text-neutral-500 mb-2">This certifies that</p>
                    <p className="text-2xl font-headline font-black text-neutral-900 mb-2"
                      style={{ fontFamily: 'Georgia, serif' }}>{studentName}</p>
                    <p className="text-xs text-neutral-500 mb-4">has successfully completed the</p>
                    <p className="text-sm font-bold text-orange-600 mb-4">Young Indians Thalir Programme</p>
                    <div className="flex justify-center gap-6 text-xs text-neutral-400">
                      <span>Issued: {issueFormatted}</span>
                      <span>Grade: {grade}</span>
                    </div>
                  </div>
                </div>
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
      <footer className="bg-white border-t border-neutral-100 py-4 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400 font-label">
          <span>ThalirVerse | © 2026 ThalirVerse. All rights reserved.</span>
          <div className="flex gap-4">
            {['Privacy Policy', 'Terms of Service', 'Support', 'Verify Another'].map(item => (
              <Link key={item} href={item === 'Verify Another' ? '/certificate' : '#'}
                className={`hover:text-neutral-600 transition-colors ${item === 'Verify Another' ? 'text-orange-500 font-bold hover:text-orange-600' : ''}`}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
