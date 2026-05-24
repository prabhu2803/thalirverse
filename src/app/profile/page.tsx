import Link from 'next/link';

export default function Profile() {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 font-body text-neutral-900 dark:text-neutral-100 min-h-screen pb-24 md:pb-0">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 shadow-sm">
        <div className="flex justify-between items-center h-16 px-4 max-w-full">
          <div className="flex items-center gap-3">
            <button className="material-symbols-outlined text-orange-500 active:scale-95 duration-150 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors rounded-full">
              menu
            </button>
            <span className="text-xl font-headline font-black text-orange-500">ThalirVerse</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-6 mr-6">
              <Link href="/dashboard" className="font-label text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors px-3 py-1 rounded-full cursor-pointer">Home</Link>
              <Link href="/courses" className="font-label text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors px-3 py-1 rounded-full cursor-pointer">Learning</Link>
              <span className="font-label text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors px-3 py-1 rounded-full cursor-pointer">Badges</span>
              <span className="font-label text-sm text-orange-500 font-bold hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors px-3 py-1 rounded-full cursor-pointer">Profile</span>
            </div>
            <img 
              alt="student profile picture" 
              className="w-10 h-10 rounded-full border-2 border-orange-500 object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZWvP66QmsEd6eAhlFmueSFaFK97Fs3GYGNTvD8Y_3v47P-6OttuPN5SLNAVjxx3T1uDYlpEk-OtJ3M3JezAeQFIjkZpXuFNeJlVXH4bCwsze-zAbOT6gUJ4_fyueY71yqzKvyvRNbVFz4ssUI6iLMZhxJXFfPbvi7Chvz7HZSjgvLCarBbv1St2Y3ax8atNRoXOevqyyCBEmWRV5V6djgjjzDQgLCOquy71G-rGu4QeBoPM-hLz4VFT9Sp9B14eB5vbcLtRhrqQ8"
            />
          </div>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-5xl mx-auto space-y-6 min-h-screen">
        {/* Hero Profile Section */}
        <section className="mt-4 p-6 rounded-3xl bg-white dark:bg-neutral-900 shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <img 
              alt="Arjun M." 
              className="w-24 h-24 md:w-32 md:h-32 rounded-3xl object-cover shadow-lg" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiXtNgIb8bYJM4qfb-8UKgbUbNf6uVazzavvEPn9AqlbprT3g4pE6lKc986MLqDafm9NDX1APwDxVo8W2BTkfe37Pco7C1qbwecTnSIgncNd7LzthujI8PL0zL14-uF_f3U-qz47AmgCywtT3JT0l-9Qh3k0w3H373u0FTDVETTtuz-O7Flk87wnhp3O-MoLAfAWmAuxngScx9387f8AEFfGFYUCPl3D3GzwwSFrNfXmcM7UyXkuqAiDB4OiHxjq9egIqANTNLTvo"
            />
            <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-1.5 rounded-xl shadow-md">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl md:text-3xl font-black font-headline">Arjun M.</h1>
            <p className="text-neutral-500 font-medium flex items-center justify-center md:justify-start gap-1 mt-1">
              <span className="material-symbols-outlined text-sm">school</span>
              Greenwood High School
            </p>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
              <span className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs font-bold px-3 py-1.5 rounded-full">Grade 11</span>
              <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-bold px-3 py-1.5 rounded-full">Student Leader</span>
              <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-bold px-3 py-1.5 rounded-full">STEM Track</span>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center border-l border-neutral-100 dark:border-neutral-800 pl-8">
            <div className="text-3xl font-black text-orange-500">1,240</div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">XP Points</div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Badges Showcase Grid */}
          <section className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black font-headline">Badges Showcase</h2>
              <button className="text-orange-500 text-sm font-bold hover:underline">View All</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {/* Earned Badge: Fast Learner */}
              <div className="aspect-square rounded-3xl bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-200 dark:border-orange-500/20 flex flex-col items-center justify-center p-4 text-center hover:scale-105 transition-transform cursor-pointer">
                <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/30 mb-3">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                </div>
                <span className="text-[10px] md:text-xs font-black uppercase text-orange-600 dark:text-orange-400 tracking-tight">Fast Learner</span>
              </div>
              
              {/* Earned Badge: Top Scorer */}
              <div className="aspect-square rounded-3xl bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-200 dark:border-orange-500/20 flex flex-col items-center justify-center p-4 text-center hover:scale-105 transition-transform cursor-pointer">
                <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/30 mb-3">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                </div>
                <span className="text-[10px] md:text-xs font-black uppercase text-orange-600 dark:text-orange-400 tracking-tight">Top Scorer</span>
              </div>
              
              {/* Earned Badge: Problem Solver */}
              <div className="aspect-square rounded-3xl bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-200 dark:border-orange-500/20 flex flex-col items-center justify-center p-4 text-center hover:scale-105 transition-transform cursor-pointer">
                <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/30 mb-3">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>extension</span>
                </div>
                <span className="text-[10px] md:text-xs font-black uppercase text-orange-600 dark:text-orange-400 tracking-tight">Problem Solver</span>
              </div>
              
              {/* Locked Badge: Team Leader */}
              <div className="aspect-square rounded-3xl bg-neutral-50 dark:bg-neutral-800/50 border-2 border-dashed border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center p-4 text-center opacity-60 grayscale relative">
                <div className="absolute top-2 right-2 text-neutral-400">
                  <span className="material-symbols-outlined text-lg">lock</span>
                </div>
                <div className="w-14 h-14 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center text-neutral-500 mb-3">
                  <span className="material-symbols-outlined text-3xl">groups</span>
                </div>
                <span className="text-[10px] md:text-xs font-black uppercase text-neutral-500 tracking-tight">Team Leader</span>
              </div>
              
              {/* Locked Badge: Innovator */}
              <div className="aspect-square rounded-3xl bg-neutral-50 dark:bg-neutral-800/50 border-2 border-dashed border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center p-4 text-center opacity-60 grayscale relative">
                <div className="absolute top-2 right-2 text-neutral-400">
                  <span className="material-symbols-outlined text-lg">lock</span>
                </div>
                <div className="w-14 h-14 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center text-neutral-500 mb-3">
                  <span className="material-symbols-outlined text-3xl">lightbulb</span>
                </div>
                <span className="text-[10px] md:text-xs font-black uppercase text-neutral-500 tracking-tight">Innovator</span>
              </div>
              
              {/* Locked Badge Slot */}
              <div className="aspect-square rounded-3xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center p-4 text-center opacity-30">
                <span className="material-symbols-outlined text-3xl mb-1">add_circle</span>
                <span className="text-[10px] font-black uppercase tracking-tight">Coming Soon</span>
              </div>
            </div>
          </section>

          {/* Learning History Timeline */}
          <section className="space-y-4">
            <h2 className="text-lg font-black font-headline">Learning History</h2>
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-100 dark:border-neutral-800 shadow-sm relative overflow-hidden">
              <div className="absolute left-9 top-10 bottom-10 w-0.5 bg-neutral-100 dark:bg-neutral-800"></div>
              <ul className="space-y-8 relative">
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white z-10 ring-4 ring-white dark:ring-neutral-900">
                    <span className="material-symbols-outlined text-xs">check</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Completed Entrepreneurship 101</h3>
                    <p className="text-xs text-neutral-500 mt-1">2 days ago</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-white dark:bg-neutral-900 border border-orange-500 flex items-center justify-center text-orange-500 z-10 ring-4 ring-white dark:ring-neutral-900">
                    <span className="material-symbols-outlined text-xs">school</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Joined Leadership Workshop</h3>
                    <p className="text-xs text-neutral-500 mt-1">1 week ago</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Certificates List */}
        <section className="space-y-4 pb-10">
          <h2 className="text-lg font-black font-headline">Certificates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cert 1 */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-between hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-700 dark:text-orange-400">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                </div>
                <div>
                  <h4 className="font-bold group-hover:text-orange-500 transition-colors">Entrepreneurship 101</h4>
                  <p className="text-xs text-neutral-500 mt-1">Issued: March 2024</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all text-neutral-500 active:scale-90" title="Share to LinkedIn">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path></svg>
                </button>
                <button className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold text-xs px-4 py-2 rounded-full hover:bg-orange-500 hover:text-white transition-all active:scale-95">
                  Download PDF
                </button>
              </div>
            </div>

            {/* Cert 2 */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-between hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-700 dark:text-orange-400">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                </div>
                <div>
                  <h4 className="font-bold group-hover:text-orange-500 transition-colors">Road Safety Basics</h4>
                  <p className="text-xs text-neutral-500 mt-1">Issued: February 2024</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all text-neutral-500 active:scale-90" title="Share to LinkedIn">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path></svg>
                </button>
                <button className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold text-xs px-4 py-2 rounded-full hover:bg-orange-500 hover:text-white transition-all active:scale-95">
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* BottomNavBar (Visible on mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-around items-center h-20 px-2 pb-safe border-t border-neutral-100 dark:border-neutral-800">
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-neutral-500 hover:text-orange-500 transition-all active:scale-90 duration-200">
          <span className="material-symbols-outlined">home</span>
          <span className="font-label text-xs">Home</span>
        </Link>
        <Link href="/courses" className="flex flex-col items-center justify-center text-neutral-500 hover:text-orange-500 transition-all active:scale-90 duration-200">
          <span className="material-symbols-outlined">school</span>
          <span className="font-label text-xs">Learning</span>
        </Link>
        <div className="flex flex-col items-center justify-center text-neutral-500 hover:text-orange-500 transition-all active:scale-90 duration-200 cursor-pointer">
          <span className="material-symbols-outlined">military_tech</span>
          <span className="font-label text-xs">Badges</span>
        </div>
        <Link href="/profile" className="flex flex-col items-center justify-center bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg px-4 py-2 active:scale-90 duration-200">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <span className="font-label text-xs font-bold">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
