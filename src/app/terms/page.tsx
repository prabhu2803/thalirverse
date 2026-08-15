import Link from 'next/link';

export const metadata = { title: 'Terms & Conditions — ThalirVerse' };

export default function TermsAndConditions() {
  return (
    <div className="bg-white font-body text-neutral-900 min-h-screen">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-500" style={{ fontSize: 26 }}>school</span>
            <span className="text-lg font-headline font-black text-orange-500 tracking-tight">ThalirVerse</span>
          </Link>
          <Link href="/" className="text-sm font-bold text-neutral-500 hover:text-orange-500 transition-colors">Back to Home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-headline font-black text-neutral-900 mb-1">Terms &amp; Conditions</h1>
        <p className="text-sm text-neutral-400 font-label mb-10">Last updated: 2026 · Effective for all ThalirVerse users</p>

        <div className="prose-sm space-y-8 text-sm leading-relaxed text-neutral-700">
          <p>
            These terms govern your use of ThalirVerse, the learning platform of the Young Indians (Yi)
            Thalir programme, built and operated by StrawLabs. By creating an account or using the
            platform, you agree to these terms.
          </p>

          <section>
            <h2 className="font-headline font-bold text-lg text-neutral-900 mb-2">1. Eligibility &amp; Accounts</h2>
            <p>
              ThalirVerse is available to students, educators, and administrators participating in the Yi
              Thalir programme through a registered school. Accounts are identified by full name and
              school rather than email, and you are responsible for keeping your password and security
              question answer confidential.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-neutral-900 mb-2">2. Acceptable Use</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Use the platform only for its intended purpose: learning, assessments, and tracking your own progress.</li>
              <li>Do not share your login credentials or attempt to access another student's account.</li>
              <li>Do not attempt to circumvent quiz timers, shuffling, or scoring mechanisms.</li>
              <li>Do not upload or share content that is offensive, unlawful, or unrelated to the programme.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-neutral-900 mb-2">3. Course Content &amp; Certificates</h2>
            <p>
              Course modules, quizzes, badges, and certificates are provided as part of the Yi Thalir
              programme. Passing grades, badge eligibility, and certificate issuance are determined by the
              scoring rules configured for each module and quiz, and may be updated by programme
              administrators from time to time.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-neutral-900 mb-2">4. Administrator Responsibilities</h2>
            <p>
              School and Teacher Admin accounts are granted to individuals authorised by their school or Yi
              chapter. Administrators may view and manage student data only for schools explicitly
              assigned to them, and must use bulk-onboarding and account-management tools solely for
              legitimate programme administration.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-neutral-900 mb-2">5. Account Suspension</h2>
            <p>
              We may suspend or remove accounts that violate these terms, including misuse of login
              credentials, attempts to access data outside an administrator's assigned schools, or abuse
              of the platform's systems.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-neutral-900 mb-2">6. Disclaimer</h2>
            <p>
              ThalirVerse is provided "as is" as an educational tool for the Yi Thalir programme. While we
              work to keep the platform accurate and available, we do not guarantee uninterrupted access
              and are not liable for outcomes arising from platform downtime or content errors.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-neutral-900 mb-2">7. Changes to These Terms</h2>
            <p>
              We may update these terms as the platform evolves. Continued use of ThalirVerse after an
              update constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-neutral-900 mb-2">8. Contact</h2>
            <p>
              For questions about these terms, please contact your school or Yi chapter administrator, or
              reach the platform team via{' '}
              <a href="https://www.strawlabs.in" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                www.strawlabs.in
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
