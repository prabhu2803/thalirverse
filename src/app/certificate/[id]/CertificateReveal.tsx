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

// The printable certificate itself. On `window.print()` (triggered by
// DownloadCertificateButton below), every other element on the page gets
// `print:hidden` and this card expands to fill the printed page — that's
// the "download PDF" flow: the browser's own Save-as-PDF in the print
// dialog, rather than a client-side canvas-rendering library.
export function CertificatePreviewCard({ studentName, issueFormatted, grade, certificateNumber }: {
  studentName: string; issueFormatted: string; grade: string; certificateNumber: string;
}) {
  const corner = (pos: string) => (
    <div className={`absolute ${pos} w-4 h-4 border-orange-300 print:border-orange-300`}
      style={{
        borderTopWidth: pos.includes('top') ? 2 : 0,
        borderBottomWidth: pos.includes('bottom') ? 2 : 0,
        borderLeftWidth: pos.includes('left') ? 2 : 0,
        borderRightWidth: pos.includes('right') ? 2 : 0,
      }} />
  );

  return (
    <motion.div id="certificate-printable" initial="hidden" animate="visible" variants={fadeUp}
      className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 print:shadow-none print:border-0 print:rounded-none print:p-0 print:fixed print:inset-0 print:z-50 print:flex print:items-center print:justify-center">
      <p className="text-xs font-label font-bold text-neutral-400 uppercase tracking-wider mb-4 print:hidden">Certificate Preview</p>

      {/* Ornamental frame */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-200 print:w-full print:h-full print:rounded-none print:border-0"
        style={{
          background: 'radial-gradient(circle at 50% 0%, #fffaf0 0%, #fef3e2 45%, #fdecd3 100%)',
        }}>
        {/* Faint corner flourishes */}
        {corner('top-4 left-4')}
        {corner('top-4 right-4')}
        {corner('bottom-4 left-4')}
        {corner('bottom-4 right-4')}
        {/* Inner hairline border */}
        <div className="absolute inset-3 border border-orange-200/70 rounded-xl pointer-events-none" />

        <div className="relative px-8 sm:px-14 py-10 sm:py-14 text-center print:h-full print:flex print:flex-col print:justify-center">
          {/* Seal */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg ring-4 ring-orange-100 mb-5 mx-auto">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 30, fontVariationSettings: "'FILL' 1" }}>military_tech</span>
          </div>

          <p className="text-[11px] font-label font-black text-orange-500 uppercase tracking-[0.3em] mb-2">
            Young Indians Thalir Programme
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Certificate of Completion
          </h2>
          <div className="w-14 h-0.5 bg-orange-400 mx-auto mb-6" />

          <p className="text-xs text-neutral-500 italic mb-3">This certifies that</p>
          <p className="text-3xl sm:text-4xl text-neutral-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            {studentName}
          </p>
          <div className="w-40 h-px bg-neutral-300 mx-auto mb-4" />
          <p className="text-sm text-neutral-600 leading-relaxed max-w-sm mx-auto mb-8">
            has successfully completed all modules of the{' '}
            <span className="font-bold text-orange-600">Young Indians Thalir Programme</span>,
            demonstrating dedication to road safety, personal safety, entrepreneurship, and leadership.
          </p>

          {/* Issued / Signature / Grade row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 sm:gap-4 pt-6 border-t border-orange-200/70 text-center sm:text-left">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">Issued</p>
              <p className="text-sm font-bold text-neutral-800">{issueFormatted}</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-lg text-orange-500" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Yi Thalir</p>
              <div className="w-28 h-px bg-neutral-400 mt-1" />
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mt-1.5">Programme Director</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">Grade</p>
              <p className="text-sm font-bold text-neutral-800 flex items-center gap-1 justify-center sm:justify-end">
                <span className="material-symbols-outlined text-amber-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                {grade}
              </p>
            </div>
          </div>

          <p className="text-[10px] text-neutral-400 font-label tracking-wider mt-5">
            Certificate No. {certificateNumber}
          </p>

          {/* Partner logos */}
          <div className="flex items-center justify-center gap-6 pt-6 mt-6 border-t border-orange-100">
            <img src="/partners/thalir-logo.png" alt="Thalir" className="h-8 w-auto object-contain" />
            <img src="/partners/yi-logo.png" alt="Young Indians (Yi)" className="h-8 w-auto object-contain" />
            <img src="/partners/cii-logo.png" alt="Confederation of Indian Industry (CII)" className="h-8 w-auto object-contain" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Triggers the browser's print dialog scoped to just the certificate card
// (see the print: classes above) — "Save as PDF" there produces a real
// downloadable file without pulling in a canvas-rendering dependency.
export function DownloadCertificateButton() {
  return (
    <button onClick={() => window.print()}
      className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5">
      <span className="material-symbols-outlined text-sm">download</span>
      Download PDF Certificate
    </button>
  );
}
