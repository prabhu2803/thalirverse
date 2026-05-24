import Link from 'next/link';

export default function CertificateVerification({ params }: { params: { id: string } }) {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-body min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* TopAppBar */}
      <header className="flex items-center justify-between px-4 w-full h-16 sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          <h1 className="font-display font-black text-orange-600 text-xl">ThalirVerse</h1>
        </div>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-6 items-center">
            <Link href="#" className="text-orange-600 font-bold font-label text-sm hover:opacity-80 transition-opacity">Verify</Link>
            <Link href="/dashboard" className="text-neutral-500 dark:text-neutral-400 font-label text-sm hover:opacity-80 transition-opacity">Courses</Link>
            <Link href="#" className="text-neutral-500 dark:text-neutral-400 font-label text-sm hover:opacity-80 transition-opacity">About</Link>
          </nav>
          <button className="md:hidden text-neutral-500 dark:text-neutral-400">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6 sm:p-8 relative z-10">
        <div className="max-w-md w-full animate-[fade-in_0.7s_ease-out]">
          {/* Verification Card */}
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-neutral-100 dark:border-neutral-800">
            {/* Status Header */}
            <div className="pt-10 pb-6 flex flex-col items-center text-center px-6">
              <div className="relative mb-4">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-[bounce_2s_infinite]">
                  <span className="material-symbols-outlined text-6xl text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
              </div>
              <h2 className="font-headline font-black text-2xl text-neutral-900 dark:text-white tracking-tight mb-2">
                Certificate Verified
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm">
                This is a valid and authentic ThalirVerse certificate.
              </p>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-700 to-transparent w-full"></div>

            {/* Certificate Details */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Recipient Info */}
              <div className="text-center">
                <span className="text-xs font-label font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1 block">Issued To</span>
                <p className="font-headline font-black text-xl text-neutral-900 dark:text-white">Alex Johnson</p>
              </div>

              {/* Course Info */}
              <div className="bg-neutral-50 dark:bg-neutral-950 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-orange-600" style={{ fontVariationSettings: "'FILL' 1" }}>code</span>
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-white leading-tight">Advanced React Patterns</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Completed with 95% Score</p>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-xs font-label font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1 block">Issue Date</span>
                  <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">Oct 24, 2023</p>
                </div>
                <div>
                  <span className="text-xs font-label font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1 block">Credential ID</span>
                  <p className="font-mono font-bold text-sm text-neutral-800 dark:text-neutral-200 break-all">{params.id}</p>
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="p-6 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-3">
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-orange-600/20">
                <span className="material-symbols-outlined text-lg">download</span>
                Download PDF
              </button>
              <button className="w-full bg-transparent hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold py-3.5 px-4 rounded-2xl transition-all active:scale-[0.98] flex justify-center items-center gap-2 border-2 border-neutral-200 dark:border-neutral-700">
                <span className="material-symbols-outlined text-lg">share</span>
                Share Link
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="text-neutral-500 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-500 font-medium text-sm transition-colors flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-sm">home</span>
              Return to Homepage
            </Link>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce {
          0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
          50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(1rem); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
