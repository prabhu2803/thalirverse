'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dataService, supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [learnerCount, setLearnerCount] = useState<number | null>(null);

  useEffect(() => {
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'STUDENT')
      .then(({ count }) => setLearnerCount(count ?? 0));
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError('');
    try {
      await dataService.login(email, password);
      let role = 'STUDENT';
      try {
        const profile = await dataService.getActiveStudent();
        role = profile?.role ?? 'STUDENT';
      } catch { /* profile fetch failed — stays STUDENT */ }
      router.push(role === 'STUDENT' ? '/dashboard' : '/admin/analytics');
    } catch (err: any) {
      if (err?.code === 'email_not_confirmed' || err?.message?.includes('Email not confirmed')) {
        setError('Email not confirmed. Check your inbox or ask your coordinator to disable email confirmation for testing.');
      } else {
        setError(err?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row font-body">

      {/* ── Left Panel ─────────────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 bg-orange-50 flex-col justify-between p-12 overflow-hidden min-h-screen">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-orange-200/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -left-10 w-48 h-48 rounded-full bg-orange-300/20 blur-2xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/30">
              <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <span className="text-lg font-headline font-black text-orange-500 tracking-tight">ThalirVerse</span>
          </div>

          {/* Illustration thumbnail */}
          <div className="rounded-2xl overflow-hidden shadow-lg mb-10 max-w-xs">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ9Ew6FJ1h88hvpP4SFDJ-qjXVg68_xE3u0FE_IXLAclxxz6eQxjyYhBR8wOfcf-RgAIf4bMYa9srKSAuupReOYdEGeJBKIVcwnHUw6bEkkUnPPb3yIXoQRWHEotLv8kywgDpdi_wTng2PTnT0VWZO3s4Qhkaojnjjer4POIW792XGfO8AzP6mfL-HRpMmYUQVlhmiGtGdjADrm9xjKCpawJuP7rVG6Ew0ePJhumM1VKTGq7x9JEKiBNAZIgAyRNZ-V1zgo9Q-U7A"
              alt="Students learning"
              className="w-full h-36 object-cover"
            />
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2">
              <p className="text-xs text-neutral-500 leading-snug">
                Diverse students learning together with digital tools in a clean, youthful, and engaging educational environment.
              </p>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl lg:text-4xl font-headline font-black text-neutral-900 leading-tight mb-4">
            Empower Your<br />Learning Journey
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed max-w-sm">
            Join thousands of students at ThalirVerse and unlock a world of personalised education, interactive assessments, and a vibrant community.
          </p>

          {learnerCount !== null && learnerCount > 0 && (
            <div className="mt-6 inline-flex items-center gap-2.5 bg-white rounded-2xl shadow-md border border-orange-100 px-4 py-3">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-orange-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              </div>
              <p className="text-sm font-bold text-neutral-800">
                {learnerCount.toLocaleString()}+ active learners today
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ── Right Panel ────────────────────────────────────────────── */}
      <div className="flex-1 bg-white flex flex-col justify-center px-8 py-14 lg:px-20">
        <div className="w-full max-w-sm mx-auto">

          <h2 className="text-3xl font-headline font-black text-neutral-900 mb-1.5">Welcome back</h2>
          <p className="text-sm text-neutral-500 mb-8">Please enter your details to sign in.</p>

          {/* Login / Register tab switcher */}
          <div className="flex bg-neutral-100 rounded-2xl p-1.5 mb-8">
            <span className="flex-1 text-center py-2.5 px-4 text-sm font-semibold rounded-xl bg-white text-orange-600 shadow-sm">
              Login
            </span>
            <Link href="/register"
              className="flex-1 text-center py-2.5 px-4 text-sm font-semibold rounded-xl text-neutral-500 hover:text-neutral-700 transition-colors">
              Register
            </Link>
          </div>

          {error && (
            <div className="p-3.5 mb-5 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-label font-semibold text-neutral-700 mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutral-400 text-[18px]">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="student@thalirverse.edu"
                  className="w-full pl-10 pr-4 py-4 bg-neutral-50 border-none rounded-2xl ring-1 ring-neutral-200 focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-label font-semibold text-neutral-700">Password</label>
                <a href="#" className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutral-400 text-[18px]">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-4 bg-neutral-50 border-none rounded-2xl ring-1 ring-neutral-200 focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-orange-500 rounded"
              />
              <span className="text-sm text-neutral-600">Keep me logged in</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? 'Signing in...' : (
                <>Sign In <span className="material-symbols-outlined text-xl">arrow_forward</span></>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
