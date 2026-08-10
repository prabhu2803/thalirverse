'use client';

import { useState } from 'react';
import Link from 'next/link';
import { dataService } from '@/lib/supabaseClient';

export default function ForgotPassword() {
  const [step, setStep] = useState<'name' | 'answer' | 'done'>('name');
  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFindQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    setLoading(true);
    setError('');
    try {
      const q = await dataService.getSecurityQuestion(name.trim());
      if (!q) {
        setError("We couldn't find a security question for that name. Double-check the spelling, or ask your coordinator to reset your account.");
        return;
      }
      setQuestion(q);
      setStep('answer');
    } catch (err: any) {
      setError(err?.code === 'PGRST202'
        ? 'Password reset isn\'t set up yet — please contact your coordinator.'
        : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!answer.trim()) { setError('Please answer the security question.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name.trim(), answer: answer.trim(), newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Reset failed.');
      setStep('done');
    } catch (err: any) {
      setError(err?.message || 'That answer doesn\'t match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-white flex justify-center items-center px-4 py-12">
      <Link href="/login" className="absolute top-6 left-6 flex items-center gap-2 text-neutral-500 hover:text-orange-500 transition-colors font-bold text-sm z-50">
        <span className="material-symbols-outlined">arrow_back</span>
        Back to Login
      </Link>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10">
        {step !== 'done' && (
          <>
            <h1 className="text-2xl font-headline font-black text-neutral-900 mb-1.5">Reset your password</h1>
            <p className="text-sm text-neutral-500 mb-8">
              {step === 'name'
                ? "No email needed — we'll use your security question instead."
                : 'Answer your security question to set a new password.'}
            </p>
          </>
        )}

        {error && (
          <div className="p-3.5 mb-5 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">{error}</div>
        )}

        {step === 'name' && (
          <form onSubmit={handleFindQuestion} className="space-y-5">
            <div>
              <label className="block text-sm font-label font-semibold text-neutral-700 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Arjun Kumar"
                className="w-full px-4 py-3.5 bg-neutral-50 border-none rounded-2xl ring-1 ring-neutral-200 focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm outline-none transition-all"
              />
              <p className="text-xs text-neutral-400 mt-1.5">Enter the exact name you registered with.</p>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-200 active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'answer' && (
          <form onSubmit={handleReset} className="space-y-5">
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Your Security Question</p>
              <p className="text-sm font-bold text-neutral-800">{question}</p>
            </div>
            <div>
              <label className="block text-sm font-label font-semibold text-neutral-700 mb-2">Your Answer</label>
              <input
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Your answer"
                className="w-full px-4 py-3.5 bg-neutral-50 border-none rounded-2xl ring-1 ring-neutral-200 focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-label font-semibold text-neutral-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-4 pr-12 py-3.5 bg-neutral-50 border-none rounded-2xl ring-1 ring-neutral-200 focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-label font-semibold text-neutral-700 mb-2">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-3.5 bg-neutral-50 border-none rounded-2xl ring-1 ring-neutral-200 focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm outline-none transition-all"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-200 active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button type="button" onClick={() => { setStep('name'); setError(''); }}
              className="w-full text-center text-sm font-bold text-neutral-500 hover:text-neutral-700 transition-colors">
              ← Use a different name
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div>
              <h2 className="text-xl font-headline font-black text-neutral-900">Password reset!</h2>
              <p className="text-sm text-neutral-500 mt-1">You can now log in with your new password.</p>
            </div>
            <Link href="/login"
              className="inline-block w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-200 transition-all">
              Go to Login
            </Link>
          </div>
        )}

        {step !== 'done' && (
          <p className="mt-8 text-center text-xs text-neutral-400">
            Don&apos;t have a security question set, or forgot the answer too? Ask your Yi coordinator for help.
          </p>
        )}
      </div>
    </main>
  );
}
