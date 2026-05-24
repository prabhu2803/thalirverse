export default function Dashboard() {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 font-body text-neutral-900 dark:text-neutral-100 min-h-screen pb-24">
      {/* TopAppBar */}
      <header className="sticky top-0 w-full z-50 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 shadow-sm">
        <div className="flex justify-between items-center px-4 h-16 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-500 dark:text-orange-400" style={{ fontSize: '24px' }}>school</span>
            <span className="text-xl font-headline font-black text-orange-500 tracking-tight">ThalirVerse</span>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-8">
        {/* Welcome Header */}
        <section className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                alt="Arjun" 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-100 shadow-sm" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDls_DYtLE4N2oCAZT2DHVa6eOoI1_7_tFs6J6JSjTuyMRNGX9k1QHPDfJ_Mqrb7E5V2AdBxcRPEfoeXt13j_yXYvIR6kUZQagwgderaErAuK8ovuvjkYcEt8TM6D-_WFkI9q7_XQXm36jz1CwqrrPbwjhjaH-wvn-AgSLn-1HIEp0i5XN5r1AXAS31Nqbb-MIOnDgajuSglnlFXwrFMtC1lFFmbn1hiRYkIVu8d2g4f9rZKIQWel-9-us2qC4lwKSOGQWKlMXp_tI"
              />
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-2xl font-black font-headline tracking-tight">Welcome back, Arjun!</h1>
              <p className="text-neutral-500 text-sm">You're doing great this week.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-2 rounded-2xl shadow-sm border border-orange-200/50">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>control_point</span>
            <span className="font-bold font-label">7-day learning streak</span>
          </div>
        </section>
        
        {/* Progress and Recently Accessed Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Progress */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col items-center justify-center text-center">
            <h3 className="font-bold font-headline mb-4 self-start">Overall Progress</h3>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle className="text-neutral-100 dark:text-neutral-800" cx="64" cy="64" fill="transparent" r="50" stroke="currentColor" strokeWidth="10"></circle>
                <circle className="text-orange-500 transition-[stroke-dashoffset] duration-300" cx="64" cy="64" fill="transparent" r="50" stroke="currentColor" strokeDasharray="314.159" strokeDashoffset="87.96" strokeLinecap="round" strokeWidth="10"></circle>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black font-headline">72%</span>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Done</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-neutral-500">12 of 18 modules completed</p>
          </div>
          
          {/* Recently Accessed */}
          <div className="lg:col-span-2 relative group overflow-hidden rounded-2xl shadow-lg min-h-[300px]">
            <img 
              alt="Entrepreneurship 101" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCk1qzddSI_yJZBWN3g1oU-kTgeTv_LKaVpMQ7sEaGD2S7CNpamldQj9G0GixCmkk0v50Go3asWiRmOycmSxujQL5oeinuHltAFN2bZAnEUpujN_BDuZfgo9tna1pVub-R1Nn5n4c5nBpEBDWlyHrs3PwffGmGFATqD6t_HJ7auWfOb5COL3r96Vb-ruPJPX2OdXE9Pu0AGOa6bq-aVUPtbDVQfycmsDoGrF2wQ7KvlrUMWtvkKd8xT6ij1Lusech97xvmJCG7KHeA"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <div className="relative h-full flex flex-col justify-end p-8 text-white">
              <span className="bg-orange-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md w-max mb-3 tracking-widest">Active Now</span>
              <h2 className="text-3xl font-black font-headline mb-2">Entrepreneurship 101</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full w-[45%]"></div>
                </div>
                <span className="text-sm font-bold">45%</span>
              </div>
              <a href="/courses/entrepreneurship" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-all active:scale-95 flex items-center gap-2 w-max">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                Resume Learning
              </a>
            </div>
          </div>
        </div>
        
        {/* Course Overview Grid */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black font-headline tracking-tight">My Courses</h3>
            <button className="text-orange-500 font-bold text-sm flex items-center gap-1">View All <span className="material-symbols-outlined">chevron_right</span></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Course Card 1: Completed */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm flex gap-4 items-center">
              <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600">
                <span className="material-symbols-outlined" style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold font-headline">Road Safety</h4>
                <p className="text-xs text-neutral-500 mb-2">Essential safety rules for students</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-green-600 bg-green-50 dark:bg-green-900/40 px-2 py-0.5 rounded uppercase">Completed</span>
                </div>
              </div>
              <button className="text-neutral-400"><span className="material-symbols-outlined">more_vert</span></button>
            </div>
            
            {/* Course Card 2: Pending */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm flex gap-4 items-center">
              <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-500">
                <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>auto_stories</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold font-headline">Masoom</h4>
                <p className="text-xs text-neutral-500 mb-2">Personal safety and awareness</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-orange-500 bg-orange-50 dark:bg-orange-900/40 px-2 py-0.5 rounded uppercase">Pending</span>
                </div>
              </div>
              <button className="text-neutral-400"><span className="material-symbols-outlined">more_vert</span></button>
            </div>
          </div>
        </section>
        
        {/* Bottom Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Latest Badges */}
          <div className="bg-neutral-100 dark:bg-neutral-900/50 p-6 rounded-2xl">
            <h3 className="font-bold font-headline mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500">military_tech</span>
              Latest Badges
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>rewarded_ads</span>
                </div>
                <span className="text-[10px] font-bold text-center">Fast Learner</span>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-500" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                </div>
                <span className="text-[10px] font-bold text-center">Top Scorer</span>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-500" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                </div>
                <span className="text-[10px] font-bold text-center">Helper</span>
              </div>
            </div>
          </div>
          
          {/* Upcoming Deadlines */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
            <h3 className="font-bold font-headline mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500">calendar_today</span>
              Upcoming Deadlines
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-500">assignment_late</span>
                  <div>
                    <h5 className="text-sm font-bold">Leadership Assignment</h5>
                    <p className="text-[10px] text-red-600 dark:text-red-400 font-medium">Due in 2 days</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-neutral-400">chevron_right</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* BottomNavBar (Mobile only usually, but kept for design parity) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-t-xl border-t border-neutral-100 dark:border-neutral-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-6 md:pb-2">
        <a href="/dashboard" className="flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-400 px-3 py-1 hover:text-orange-500 active:scale-90 transition-all duration-200">
          <span className="material-symbols-outlined">home</span>
          <span className="font-label text-xs">Home</span>
        </a>
        <a href="/explore" className="flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-400 px-3 py-1 hover:text-orange-500 active:scale-90 transition-all duration-200">
          <span className="material-symbols-outlined">search</span>
          <span className="font-label text-xs">Explore</span>
        </a>
        <a href="/courses" className="flex flex-col items-center justify-center bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg px-3 py-1 active:scale-90 transition-all duration-200">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
          <span className="font-label text-xs font-bold">Learning</span>
        </a>
        <a href="/profile" className="flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-400 px-3 py-1 hover:text-orange-500 active:scale-90 transition-all duration-200">
          <span className="material-symbols-outlined">person</span>
          <span className="font-label text-xs">Profile</span>
        </a>
      </nav>
    </div>
  );
}
