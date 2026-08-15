'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService } from '@/lib/supabaseClient';
import { SECURITY_QUESTIONS } from '@/lib/securityQuestions';
import { fadeUp, stepSlide } from '@/lib/motion';

export default function Register() {
  const router = useRouter();
  
  // Multi-step form step tracking (1: Student Info, 2: School Details)
  const [step, setStep] = useState(1);
  
  // Fields state
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('male');
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [school, setSchool] = useState('');
  const [standard, setStandard] = useState('');
  const [section, setSection] = useState('A');
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [schoolOptions, setSchoolOptions] = useState<string[]>([]);

  useEffect(() => {
    dataService.getSchoolsDirectory()
      .then(schools => setSchoolOptions(schools.map((s: any) => s.name)))
      .catch(() => { /* directory is a nice-to-have; registration still works without it */ });
  }, []);

  const handleNext = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!password) {
      setError('Please create a password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!securityAnswer.trim()) {
      setError('Please answer the security question — it\'s how you\'ll reset your password if you forget it.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!school || !standard) {
      setError('Please provide your School Name and Standard/Class.');
      return;
    }
    setLoading(true);
    setError('');

    const fullName = name.trim();
    try {
      const result: any = await dataService.signUp(fullName, school, standard, section, district, password);
      if (result?.session) {
        try {
          await dataService.setSecurityAnswer(securityQuestion, securityAnswer.trim());
        } catch { /* account is created either way; they can set this later via Edit Profile */ }
        router.push('/dashboard');
      } else {
        setError('Registration could not be completed. Please try again or contact your coordinator.');
      }
    } catch (err: any) {
      if (err?.message?.includes('rate limit') || err?.status === 429) {
        setError('Too many sign-up attempts. Please wait a few minutes and try again.');
      } else {
        setError(err?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-white dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
      {/* Floating Back Button */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors font-bold text-sm z-50">
        <span className="material-symbols-outlined">arrow_back</span>
        Back to Home
      </Link>
      <motion.div initial="hidden" animate="visible" variants={fadeUp}
        className="max-w-2xl w-full bg-white dark:bg-neutral-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-neutral-800">
        <div className="p-8 sm:p-12">
          
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-headline font-black text-neutral-900 dark:text-white">Join ThalirVerse</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2">Create your account to start learning and leading.</p>
            
            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <span className={`h-2.5 w-12 rounded-full transition-all duration-300 ${step === 1 ? 'bg-orange-500' : 'bg-orange-200'}`}></span>
              <span className={`h-2.5 w-12 rounded-full transition-all duration-300 ${step === 2 ? 'bg-orange-500' : 'bg-orange-200'}`}></span>
            </div>
          </div>

          {error && (
            <div className="p-4 mb-6 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
          {step === 1 ? (
            /* STEP 1: Student Information */
            <motion.form key="step1" onSubmit={handleNext} className="space-y-6"
              initial="enter" animate="center" exit="exit" variants={stepSlide}>
              <div className="flex flex-col">
                <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arjun Kumar"
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white"
                />
                <p className="text-xs text-neutral-400 mt-1.5">
                  This is what you&apos;ll type to log in, so use your real name exactly as you&apos;d like it to appear on your certificate.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Password *</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-4 pr-12 py-3 bg-neutral-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Confirm Password *</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-4 pr-12 py-3 bg-neutral-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors focus:outline-none"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Security Question *</label>
                <select
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white appearance-none"
                >
                  {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
                <p className="text-xs text-neutral-400 mt-1.5">Used to reset your password if you forget it — no email needed.</p>
              </div>

              <div className="flex flex-col">
                <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Your Answer *</label>
                <input
                  type="text"
                  required
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Your answer"
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white appearance-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-headline font-bold py-4 px-4 rounded-xl shadow-[0_8px_15px_-3px_rgba(255,153,51,0.3)] hover:shadow-[0_12px_20px_-3px_rgba(255,153,51,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all mt-8"
              >
                Continue to School Details
              </button>
            </motion.form>
          ) : (
            /* STEP 2: School & Yi Details */
            <motion.form key="step2" onSubmit={handleSubmit} className="space-y-6"
              initial="enter" animate="center" exit="exit" variants={stepSlide}>
              <div className="flex flex-col">
                <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">School Name *</label>
                <input
                  type="text"
                  required
                  list="school-options"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="Greenwood High School"
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white"
                />
                <datalist id="school-options">
                  {schoolOptions.map(name => <option key={name} value={name} />)}
                </datalist>
                <p className="text-xs text-neutral-400 mt-1.5">Start typing to find your school, or enter a new one.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Standard / Class *</label>
                  <select 
                    required
                    value={standard}
                    onChange={(e) => setStandard(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white appearance-none"
                  >
                    <option value="">Select your class</option>
                    <option value="6th Standard">6th Standard</option>
                    <option value="7th Standard">7th Standard</option>
                    <option value="8th Standard">8th Standard</option>
                    <option value="9th Standard">9th Standard</option>
                    <option value="10th Standard">10th Standard</option>
                    <option value="11th Standard">11th Standard</option>
                    <option value="12th Standard">12th Standard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Section</label>
                  <input 
                    type="text" 
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="A"
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white" 
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">District/City</label>
                  <input 
                    type="text" 
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Madurai"
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white" 
                  />
                </div>
              </div>

              <div className="flex justify-between items-center gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-headline font-bold py-4 px-4 rounded-xl transition-all hover:bg-neutral-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 bg-orange-500 hover:bg-orange-600 text-white font-headline font-bold py-4 px-4 rounded-xl shadow-[0_8px_15px_-3px_rgba(255,153,51,0.3)] hover:shadow-[0_12px_20px_-3px_rgba(255,153,51,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </motion.form>
          )}
          </AnimatePresence>

          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-500 dark:text-orange-400">
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
