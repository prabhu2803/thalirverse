import Link from 'next/link';

export const metadata = { title: 'Privacy Policy — ThalirVerse' };

export default function PrivacyPolicy() {
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
        <h1 className="text-3xl font-headline font-black text-neutral-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-neutral-400 font-label mb-10">Last updated: 2026 · Effective for all ThalirVerse users</p>

        <div className="prose-sm space-y-8 text-sm leading-relaxed text-neutral-700">
          <p>
            ThalirVerse is the learning platform of the Young Indians (Yi) Thalir programme, built and
            operated by StrawLabs. This policy explains what information we collect from students,
            educators, and administrators, how we use it, and how you can control it.
          </p>

          <section>
            <h2 className="font-headline font-bold text-lg text-neutral-900 mb-2">1. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Full name, gender, school, standard/grade, and Yi chapter/region provided at registration.</li>
              <li>A security question and answer, used solely to verify your identity for password resets.</li>
              <li>Course progress, quiz attempts and scores, XP, badges, and certificates earned on the platform.</li>
              <li>Basic technical data (device/browser type, IP address) collected automatically for security and reliability.</li>
            </ul>
            <p className="mt-2">
              We do not collect email addresses or dates of birth from students. Accounts are identified
              by full name and school, not by personal contact details.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-neutral-900 mb-2">2. How We Use Information</h2>
            <p>We use the information above only to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Authenticate you and secure your account.</li>
              <li>Track lesson and quiz progress so we can award XP, badges, and certificates.</li>
              <li>Let your school and Yi chapter administrators see aggregate and individual progress for students under their programme.</li>
              <li>Improve the platform's content and reliability.</li>
            </ul>
            <p className="mt-2">We do not sell student data, and we do not use it for advertising.</p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-neutral-900 mb-2">3. Who Can See Your Data</h2>
            <p>
              Teacher Admins can see data only for students at schools explicitly assigned to them. Super Admins
              can see platform-wide data for programme administration. We do not share individual student
              data with any party outside the Yi Thalir programme.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-neutral-900 mb-2">4. Children's Data</h2>
            <p>
              ThalirVerse is used by school students, including minors, through their school's participation
              in the Yi Thalir programme. Accounts are created either by the student with their school's
              involvement, or in bulk by a school/Yi administrator on the school's behalf. Parents or
              guardians with questions about a student's account should contact their school or Yi chapter
              administrator directly.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-neutral-900 mb-2">5. Data Security</h2>
            <p>
              Passwords and security answers are never stored in plain text — they are hashed before
              storage. Access to administrative tools is role-restricted, and Teacher Admins only see data for
              their assigned schools.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-neutral-900 mb-2">6. Your Choices</h2>
            <p>
              You can update your profile details, security question, and password at any time from your
              Profile page. To request deletion of your account, contact your school or Yi chapter
              administrator.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-neutral-900 mb-2">7. Changes to This Policy</h2>
            <p>
              We may update this policy as the platform evolves. Material changes will be reflected here
              with an updated "last updated" date.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
