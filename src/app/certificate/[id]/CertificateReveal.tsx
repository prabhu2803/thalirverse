'use client';

import { motion } from 'framer-motion';
import { fadeUp, popIn } from '@/lib/motion';

// Small client-only pieces of an otherwise static server-rendered
// verification page — kept tiny and isolated so the page itself (data
// fetching, SSR for external share-link visits) stays a plain async
// server component. See the plan's Phase 4 note on why this page wasn't
// converted wholesale to 'use client'.

export function CheckmarkReveal() {
  return (
    <motion.div initial="hidden" animate="visible" variants={popIn}
      className="flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-green-500"
          style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      </div>
      <div>
        <h2 className="text-xl font-headline font-black text-neutral-900">Verification Successful</h2>
        <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
          This certificate is authentic and was issued by ThalirVerse Educational Platform to the student listed below.
        </p>
      </div>
    </motion.div>
  );
}

export function CertificatePreviewCard({ studentName, issueFormatted, grade }: {
  studentName: string; issueFormatted: string; grade: string;
}) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp}
      className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6">
      <p className="text-xs font-label font-bold text-neutral-400 uppercase tracking-wider mb-4">Certificate Preview</p>
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-8 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-orange-500 text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          <span className="text-lg font-headline font-black text-orange-500">ThalirVerse</span>
        </div>
        <p className="text-xs text-neutral-500 font-label uppercase tracking-widest mb-3">
          Certificate of Completion
        </p>
        <p className="text-xs text-neutral-500 mb-2">This certifies that</p>
        <p className="text-2xl font-headline font-black text-neutral-900 mb-2"
          style={{ fontFamily: 'Georgia, serif' }}>{studentName}</p>
        <p className="text-xs text-neutral-500 mb-4">has successfully completed the</p>
        <p className="text-sm font-bold text-orange-600 mb-4">Young Indians Thalir Programme</p>
        <div className="flex justify-center gap-6 text-xs text-neutral-400">
          <span>Issued: {issueFormatted}</span>
          <span>Grade: {grade}</span>
        </div>
      </div>
    </motion.div>
  );
}
