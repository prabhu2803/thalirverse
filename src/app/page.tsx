export default function Home() {
  return (
    <main className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] pb-24 md:pb-0">
      {/* Hero Section with Motivational Illustration */}
      <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto md:min-h-full overflow-hidden flex flex-col items-center justify-center p-8 bg-orange-50 dark:bg-neutral-900/30">
        <div className="hidden md:block text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-headline font-black text-neutral-900 dark:text-white mb-4">
            Learn. Lead. <span className="text-orange-500">Grow.</span>
          </h2>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            Join the movement of young innovators and empower your future today.
          </p>
        </div>
        <img
          alt="ThalirVerse Educational Illustration"
          className="w-full max-w-md h-auto object-contain md:animate-[float_6s_ease-in-out_infinite]"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ9Ew6FJ1h88hvpP4SFDJ-qjXVg68_xE3u0FE_IXLAclxxz6eQxjyYhBR8wOfcf-RgAIf4bMYa9srKSAuupReOYdEGeJBKIVcwnHUw6bEkkUnPPb3yIXoQRWHEotLv8kywgDpdi_wTng2PTnT0VWZO3s4Qhkaojnjjer4POIW792XGfO8AzP6mfL-HRpMmYUQVlhmiGtGdjADrm9xjKCpawJuP7rVG6Ew0ePJhumM1VKTGq7x9JEKiBNAZIgAyRNZ-V1zgo9Q-U7A"
        />
      </div>

      {/* Auth Card Area */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-6 md:p-12 lg:p-16 bg-white dark:bg-neutral-950 -mt-8 md:mt-0 relative z-10 rounded-t-3xl md:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:shadow-none min-h-[60vh]">
        <div className="w-full max-w-md mx-auto py-8">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-headline font-bold text-neutral-900 dark:text-white">Welcome back</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2">Log in to continue your learning journey.</p>
          </div>

          <form className="space-y-5">
            <div className="flex flex-col">
              <label htmlFor="username" className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                Username or Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="student@school.edu"
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="password" className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 text-orange-500 border-neutral-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-neutral-600 dark:text-neutral-400">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm font-semibold text-orange-600 hover:text-orange-500 dark:text-orange-400">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-headline font-bold py-3 px-4 rounded-xl shadow-[0_8px_15px_-3px_rgba(255,153,51,0.3)] hover:shadow-[0_12px_20px_-3px_rgba(255,153,51,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all"
            >
              Log in
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Don't have an account?{" "}
              <a href="/register" className="font-semibold text-orange-600 hover:text-orange-500 dark:text-orange-400">
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
