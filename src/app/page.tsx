import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const CATEGORY_META: Record<string, { tag: string; tagClass: string; icon: string; gradient: string }> = {
  default:        { tag: 'Foundation', tagClass: 'bg-orange-100 text-orange-700', icon: 'auto_stories',    gradient: 'from-orange-400 to-orange-600' },
  Safety:         { tag: 'Foundation', tagClass: 'bg-rose-100 text-rose-700',     icon: 'traffic',         gradient: 'from-rose-400 to-rose-600' },
  'Personal Safety': { tag: 'Social', tagClass: 'bg-sky-100 text-sky-700',        icon: 'shield',          gradient: 'from-sky-400 to-sky-600' },
  Business:       { tag: 'Business',  tagClass: 'bg-amber-100 text-amber-700',    icon: 'rocket_launch',   gradient: 'from-amber-400 to-orange-500' },
  Leadership:     { tag: 'Leadership',tagClass: 'bg-purple-100 text-purple-700',  icon: 'stars',           gradient: 'from-purple-400 to-purple-600' },
  Social:         { tag: 'Social',    tagClass: 'bg-sky-100 text-sky-700',        icon: 'shield',          gradient: 'from-sky-400 to-sky-600' },
};

async function getPublishedModules() {
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, description, category')
    .eq('is_published', true)
    .order('order_index');

  if (!modules?.length) return [];

  const { data: lessons } = await supabase
    .from('lessons')
    .select('module_id');

  return modules.map(m => ({
    ...m,
    lessonCount: lessons?.filter((l: any) => l.module_id === m.id).length ?? 0,
  }));
}


export default async function LandingPage() {
  const modules = await getPublishedModules();

  const features = [
    { icon: 'interactive_space', title: 'Interactive Learning', desc: 'Engage with hands-on video modules designed for active participation and real-world skill building.' },
    { icon: 'quiz',              title: 'Smart Quizzes',        desc: 'Reinforce knowledge with adaptive assessments that track mastery and highlight areas to improve.' },
    { icon: 'workspace_premium', title: 'Global Certificates', desc: 'Earn blockchain-verified certificates recognised by Young Indians chapters nationwide.' },
    { icon: 'military_tech',     title: 'Achievement Badges',  desc: 'Unlock badges and XP for every milestone — from first lesson to full graduation.' },
  ];

  return (
    <div className="bg-white font-body text-neutral-900 min-h-screen">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-100 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-orange-500" style={{ fontSize: 28 }}>school</span>
            <span className="text-xl font-headline font-black text-orange-500 tracking-tight">ThalirVerse</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: 'Home',     href: '/' },
              { label: 'Explore',  href: '#courses' },
              { label: 'Learning', href: '#how-it-works' },
              { label: 'Mentors',  href: '#features' },
            ].map(item => (
              <Link key={item.label} href={item.href}
                className="px-4 py-2 text-sm font-label font-semibold text-neutral-500 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="hidden sm:block px-4 py-2 text-sm font-label font-bold text-neutral-600 hover:text-orange-500 transition-colors">
              Sign In
            </Link>
            <Link href="/register"
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-[0_4px_10px_rgba(249,115,22,0.25)] hover:-translate-y-0.5 active:translate-y-0 transition-all">
              Join Now
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div className="space-y-7">
          <h1 className="text-6xl lg:text-7xl font-headline font-black leading-[1.05] tracking-tight text-neutral-900">
            Learn.<br />Lead.<br /><span className="text-orange-500">Grow.</span>
          </h1>

          <p className="text-lg text-neutral-500 max-w-md leading-relaxed">
            Empowering the next generation of young Indians with modern skills, leadership, and digital literacy through the Yi Thalir programme.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-[0_8px_20px_-4px_rgba(249,115,22,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all text-base">
              Register Now
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </Link>
            <Link href="#courses"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-neutral-200 hover:border-orange-500 hover:text-orange-500 text-neutral-700 font-bold rounded-2xl transition-all text-base">
              Explore Courses
              <span className="material-symbols-outlined text-xl">south</span>
            </Link>
          </div>

        </div>

        {/* Right — illustration + floating card */}
        <div className="relative flex justify-center items-center">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ9Ew6FJ1h88hvpP4SFDJ-qjXVg68_xE3u0FE_IXLAclxxz6eQxjyYhBR8wOfcf-RgAIf4bMYa9srKSAuupReOYdEGeJBKIVcwnHUw6bEkkUnPPb3yIXoQRWHEotLv8kywgDpdi_wTng2PTnT0VWZO3s4Qhkaojnjjer4POIW792XGfO8AzP6mfL-HRpMmYUQVlhmiGtGdjADrm9xjKCpawJuP7rVG6Ew0ePJhumM1VKTGq7x9JEKiBNAZIgAyRNZ-V1zgo9Q-U7A"
            alt="ThalirVerse students learning"
            className="w-full max-w-lg h-auto object-contain animate-[float_6s_ease-in-out_infinite] drop-shadow-xl"
          />

          {/* Floating stat card */}
          <div className="absolute bottom-4 left-0 sm:left-4 bg-white rounded-2xl shadow-xl border border-neutral-100 p-4 flex items-center gap-3 max-w-[200px]">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            </div>
            <div>
              <p className="text-xs font-label font-bold text-neutral-400 uppercase tracking-wider">Certified</p>
              <p className="text-sm font-bold text-neutral-900 leading-tight">Thalir Graduate</p>
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute top-4 right-0 sm:right-4 bg-green-500 text-white rounded-2xl px-3 py-2 flex items-center gap-1.5 shadow-lg shadow-green-500/30">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="text-xs font-bold font-label">Yi Certified</span>
          </div>
        </div>
      </section>

      {/* ── The Future of Education ────────────────────────────────────── */}
      <section id="features" className="bg-neutral-50 border-t border-b border-neutral-100 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-4xl font-headline font-black text-neutral-900">The Future of Education</h2>
            <p className="text-neutral-500 mt-3 text-base leading-relaxed">
              Empowering students with 21st-century skills through interactive, project-based digital learning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const isHighlighted = i === 3;
              return (
                <div key={f.icon}
                  className={`rounded-3xl p-7 flex flex-col gap-5 transition-all hover:-translate-y-1 ${
                    isHighlighted
                      ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20'
                      : 'bg-white border border-neutral-100 shadow-sm hover:shadow-md'
                  }`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isHighlighted ? 'bg-white/20' : 'bg-orange-50'
                  }`}>
                    <span className={`material-symbols-outlined text-2xl ${isHighlighted ? 'text-white' : 'text-orange-500'}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                      {f.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className={`font-headline font-bold text-lg mb-2 ${isHighlighted ? 'text-white' : 'text-neutral-900'}`}>
                      {f.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${isHighlighted ? 'text-orange-100' : 'text-neutral-500'}`}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Courses ───────────────────────────────────────────── */}
      <section id="courses" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-4xl font-headline font-black text-neutral-900">Featured Courses</h2>
            <p className="text-neutral-500 mt-1.5">Master essential life skills through guided video modules and quizzes.</p>
          </div>
          <Link href="/register"
            className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors">
            View All
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>

        {modules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((m) => {
              const meta = CATEGORY_META[m.category] ?? CATEGORY_META.default;
              return (
                <Link href="/register" key={m.id}
                  className="group bg-white rounded-3xl border border-neutral-100 shadow-sm hover:shadow-lg hover:border-orange-200 hover:-translate-y-1 transition-all overflow-hidden flex flex-col">
                  {/* Card image / gradient header */}
                  <div className={`bg-gradient-to-br ${meta.gradient} h-40 flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-20"
                      style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
                    <span className="material-symbols-outlined text-white text-5xl opacity-80"
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                      {meta.icon}
                    </span>
                  </div>

                  {/* Card content */}
                  <div className="p-5 flex flex-col flex-1">
                    <span className={`self-start text-[10px] font-label font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 ${meta.tagClass}`}>
                      {meta.tag}
                    </span>
                    <h3 className="font-headline font-bold text-base text-neutral-900 mb-2 leading-snug group-hover:text-orange-500 transition-colors">
                      {m.title}
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed flex-1 line-clamp-2">
                      {m.description}
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                      <span className="text-xs font-label font-bold text-neutral-400 uppercase tracking-wider">
                        {m.lessonCount} {m.lessonCount === 1 ? 'Lesson' : 'Lessons'}
                      </span>
                      <span className="material-symbols-outlined text-orange-500 text-lg group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Fallback skeleton cards when no published modules yet */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Road Safety',        desc: 'Learn essential traffic rules, pedestrian safety and road metrics.',           category: 'Safety' },
              { title: 'Masoom',             desc: 'Acquire critical personal body safety awareness and protective skills.',        category: 'Social' },
              { title: 'Entrepreneurship 101', desc: 'Harness business development, problem-solving, and startup tools.',          category: 'Business' },
              { title: 'Leadership Explorer', desc: 'Master public speaking, emotional intelligence, and teamwork dynamics.',      category: 'Leadership' },
            ].map((c, i) => {
              const meta = CATEGORY_META[c.category] ?? CATEGORY_META.default;
              return (
                <Link href="/register" key={i}
                  className="group bg-white rounded-3xl border border-neutral-100 shadow-sm hover:shadow-lg hover:border-orange-200 hover:-translate-y-1 transition-all overflow-hidden flex flex-col">
                  <div className={`bg-gradient-to-br ${meta.gradient} h-40 flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-20"
                      style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
                    <span className="material-symbols-outlined text-white text-5xl opacity-80"
                      style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className={`self-start text-[10px] font-label font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 ${meta.tagClass}`}>
                      {meta.tag}
                    </span>
                    <h3 className="font-headline font-bold text-base text-neutral-900 mb-2 leading-snug group-hover:text-orange-500 transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed flex-1 line-clamp-2">{c.desc}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                      <span className="text-xs font-label font-bold text-neutral-400 uppercase tracking-wider">Coming Soon</span>
                      <span className="material-symbols-outlined text-orange-500 text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-neutral-50 border-t border-neutral-100 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-4xl font-headline font-black text-neutral-900">Your Learning Journey</h2>
            <p className="text-neutral-500 mt-3">Get set up and earn verified graduate credentials in 4 easy steps.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              { step: '01', title: 'Register',       desc: 'Sign up with your school profile, standard, and Young Indians chapter.' },
              { step: '02', title: 'Watch Modules',  desc: 'Interact with guided video modules that track your playback progress.' },
              { step: '03', title: 'Pass Quizzes',   desc: 'Clear module assessments with an 80% pass grade to confirm mastery.' },
              { step: '04', title: 'Earn Credentials', desc: 'Unlock your graduate badge, XP points, and a digital certificate.' },
            ].map(item => (
              <div key={item.step} className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-orange-500 text-white font-headline font-black text-xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg text-neutral-900">{item.title}</h3>
                  <p className="text-sm text-neutral-500 mt-2 leading-relaxed max-w-[200px] mx-auto">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ───────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <img
              alt="Learning Benefits"
              className="w-full max-w-md mx-auto h-auto object-contain rounded-3xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHdN_azNeFWowhV_vEuBrWQKS1rQ8UT9v9K3obv8NWAvk2ZPhzSqrGvLbuxcovgb49t8ClmyhGTRgCwZGccqJTvn4T90OKlHK4MsIUVRBJ21J6e0mKvNTpDzGNCOKAAqCqFhxbdozbzzTA2bLr65rJ4ectJlWsfajGqISBLjFsEOkI8klC8FReRPQnTaN2r77whXpMa8fEP6ua6O1UJGNjswHEDcGccyMzReSyHhAL8tz_DqAy9dSeZuXkvozYxiYlOD442qZC2TQ"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-8">
            <h2 className="text-4xl font-headline font-black leading-tight text-neutral-900">
              Why Learn with ThalirVerse?
            </h2>
            <div className="space-y-6">
              {[
                { icon: 'bolt',              title: 'Interactive Practical Skills', desc: 'Acquire critical safety, social awareness, and startup execution skills through engaging video content.' },
                { icon: 'groups',            title: 'Leader Mindsets',              desc: 'Adopt constructive teamwork frameworks and emotional decision-making skills to lead your chapter.' },
                { icon: 'workspace_premium', title: 'Digital Credentials',          desc: 'Earn downloadable, verifiable certificates recognised by Young Indians nationwide.' },
              ].map(b => (
                <div key={b.title} className="flex gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{b.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-base text-neutral-900">{b.title}</h4>
                    <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────── */}
      <section className="bg-neutral-900 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-4xl lg:text-5xl font-headline font-black text-white leading-tight">
            Ready to start your journey?
          </h2>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto leading-relaxed">
            Join thousands of young leaders who are building skills, earning badges, and making an impact with Yi Thalir.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/register"
              className="w-full sm:w-auto px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-base shadow-[0_8px_20px_-4px_rgba(249,115,22,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all text-center">
              Create Account
            </Link>
            <Link href="#courses"
              className="w-full sm:w-auto px-10 py-4 bg-transparent border-2 border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white font-bold rounded-2xl text-base transition-all text-center">
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-neutral-100 py-14 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500" style={{ fontSize: 24 }}>school</span>
              <span className="text-lg font-headline font-black text-orange-500 tracking-tight">ThalirVerse</span>
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-xs">
              The official learning platform of the Young Indians (Yi) Thalir programme.
            </p>
            <div className="flex gap-3">
              {['public', 'business', 'photo_camera'].map(icon => (
                <div key={icon}
                  className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-orange-100 hover:text-orange-500 text-neutral-500 flex items-center justify-center transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-sm">{icon}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div className="space-y-4">
            <h4 className="font-label font-bold text-xs text-neutral-400 uppercase tracking-widest">Explore</h4>
            <ul className="space-y-2.5">
              {['Courses', 'Badges', 'Leaderboard', 'Mentors'].map(item => (
                <li key={item}>
                  <Link href="/register" className="text-sm text-neutral-600 hover:text-orange-500 transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-label font-bold text-xs text-neutral-400 uppercase tracking-widest">Support</h4>
            <ul className="space-y-2.5">
              {['Help Centre', 'Contact Us', 'Report Issue', 'Yi Community'].map(item => (
                <li key={item}>
                  <Link href="/login" className="text-sm text-neutral-600 hover:text-orange-500 transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-label font-bold text-xs text-neutral-400 uppercase tracking-widest">Legal</h4>
            <ul className="space-y-2.5">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Refund Policy'].map(item => (
                <li key={item}>
                  <Link href="/" className="text-sm text-neutral-600 hover:text-orange-500 transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-400 font-label">
            © 2026 Young Indians (Yi) Thalir. All rights reserved. Powered by Yi.
          </p>
          <p className="text-xs text-neutral-400 font-label">
            Built with ❤️ for the next generation of Indian leaders.
          </p>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      ` }} />
    </div>
  );
}
