'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function QuizQuestion({ params }: { params: { id: string } }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-body antialiased min-h-screen">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 z-50 flex justify-between items-center w-full px-4 h-16 fixed top-0">
        <div className="flex items-center gap-3">
          <Link href={`/courses/${params.id}`} className="text-orange-600 dark:text-orange-400 active:scale-95 transition-transform duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 p-2 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">close</span>
          </Link>
          <h1 className="font-headline text-lg font-bold text-orange-600 dark:text-orange-400">ThalirVerse Quiz</h1>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-900/50">
          <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-sm">timer</span>
          <span className="font-mono font-bold text-orange-600 dark:text-orange-400">08:45</span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-24 pb-32 px-4 max-w-2xl mx-auto min-h-screen">
        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-3">
            <div>
              <span className="text-neutral-500 font-label text-xs uppercase tracking-wider">Quiz Module</span>
              <h2 className="text-xl font-black text-neutral-800 dark:text-neutral-100 tracking-tight leading-tight">Entrepreneurship Basics</h2>
            </div>
            <div className="text-right">
              <span className="text-orange-600 font-black text-2xl">02</span>
              <span className="text-neutral-400 font-bold text-lg">/10</span>
            </div>
          </div>
          <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-600 w-[20%] rounded-full shadow-[0_0_15px_rgba(234,88,12,0.3)] transition-all duration-500"></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 mb-8">
          <h3 className="text-lg md:text-xl font-bold text-neutral-800 dark:text-neutral-100 leading-snug">
            What is the first step in starting a business?
          </h3>
          <div className="mt-6 relative h-40 w-full rounded-xl overflow-hidden mb-2">
            <img 
              alt="Business Strategy Session" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHdN_azNeFWowhV_vEuBrWQKS1rQ8UT9v9K3obv8NWAvk2ZPhzSqrGvLbuxcovgb49t8ClmyhGTRgCwZGccqJTvn4T90OKlHK4MsIUVRBJ21J6e0mKvNTpDzGNCOKAAqCqFhxbdozbzzTA2bLr65rJ4ectJlWsfajGqISBLjFsEOkI8klC8FReRPQnTaN2r77whXpMa8fEP6ua6O1UJGNjswHEDcGccyMzReSyHhAL8tz_DqAy9dSeZuXkvozYxiYlOD442qZC2TQ"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 gap-4">
          {[
            { id: 'A', text: 'Market Research' },
            { id: 'B', text: 'Funding' },
            { id: 'C', text: 'Hiring' },
            { id: 'D', text: 'Product Design' },
          ].map((option) => {
            const isSelected = selectedOption === option.id;
            return (
              <button 
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`group relative flex items-center p-4 border-2 rounded-2xl transition-all duration-200 text-left active:scale-[0.98] ${
                  isSelected 
                    ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/10' 
                    : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-orange-200 dark:hover:border-orange-900/50'
                }`}
              >
                <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl font-black text-lg transition-colors ${
                  isSelected 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-500 group-hover:bg-orange-600 group-hover:text-white'
                }`}>
                  {option.id}
                </div>
                <div className="ml-4 flex-grow">
                  <span className="block text-neutral-700 dark:text-neutral-300 font-bold">{option.text}</span>
                </div>
                <div className={`transition-all duration-200 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                  <span className="material-symbols-outlined text-orange-600">check_circle</span>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Bottom Navigation Shell */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-white dark:bg-neutral-900 shadow-xl border-t border-neutral-100 dark:border-neutral-800 rounded-t-xl">
        {/* Previous Button */}
        <button className="flex flex-col items-center justify-center text-neutral-400 px-8 py-2 active:scale-90 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
          <span className="material-symbols-outlined">arrow_back_ios</span>
          <span className="font-label text-xs uppercase tracking-wider mt-1">Previous</span>
        </button>
        {/* Next Button (Active State) */}
        <Link href={`/quiz/${params.id}/results`} className="flex flex-col items-center justify-center bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-lg px-8 py-2 active:scale-90 transition-all hover:bg-orange-100 dark:hover:bg-orange-900/50">
          <span className="material-symbols-outlined">arrow_forward_ios</span>
          <span className="font-label text-xs uppercase tracking-wider font-bold mt-1">Next</span>
        </Link>
      </nav>
    </div>
  );
}
