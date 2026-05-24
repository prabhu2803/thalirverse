export default function Register() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-neutral-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
      <div className="max-w-2xl w-full bg-white dark:bg-neutral-900 rounded-3xl shadow-xl overflow-hidden border border-neutral-100 dark:border-neutral-800">
        <div className="p-8 sm:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-headline font-black text-neutral-900 dark:text-white">Join ThalirVerse</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2">Create your account to start learning and leading.</p>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">First Name</label>
                <input type="text" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white" />
              </div>
              <div className="flex flex-col">
                <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Last Name</label>
                <input type="text" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Email Address</label>
              <input type="email" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Date of Birth</label>
                <input type="date" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white" />
              </div>
              <div className="flex flex-col">
                <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Phone Number</label>
                <input type="tel" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white" />
              </div>
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-800 my-8 pt-8">
              <h3 className="text-lg font-headline font-bold text-neutral-900 dark:text-white mb-6">School Details</h3>
              
              <div className="flex flex-col mb-6">
                <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">School Name</label>
                <input type="text" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Yi Chapter</label>
                  <select className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white appearance-none">
                    <option value="madurai">Madurai</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Standard / Class</label>
                  <select className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white appearance-none">
                    <option value="">Select your class</option>
                    <option value="6">6th Standard</option>
                    <option value="7">7th Standard</option>
                    <option value="8">8th Standard</option>
                    <option value="9">9th Standard</option>
                    <option value="10">10th Standard</option>
                    <option value="11">11th Standard</option>
                    <option value="12">12th Standard</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="font-label font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-2">Password</label>
              <input type="password" placeholder="Create a strong password" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white" />
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-headline font-bold py-4 px-4 rounded-xl shadow-[0_8px_15px_-3px_rgba(255,153,51,0.3)] hover:shadow-[0_12px_20px_-3px_rgba(255,153,51,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all mt-8"
            >
              Create Account
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Already have an account?{" "}
              <a href="/" className="font-semibold text-orange-600 hover:text-orange-500 dark:text-orange-400">
                Log in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
