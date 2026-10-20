import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, X, FileText, Search } from 'lucide-react';

export const TutorialCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
        <div className="text-sm font-bold text-slate-900 mb-1">Tutorial</div>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          Learn how to master the AI Verification Engine and optimize your procurement compliance step-by-step.
        </p>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C6BC4] hover:text-[#6957B7] transition-colors group cursor-pointer"
        >
          <span>Open Tutorials</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Tutorial Walkthrough Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F4F2FB] flex items-center justify-center text-[#7C6BC4]">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">3-Minute Hackathon Demo Script</h3>
                  <p className="text-xs text-slate-500">TenderLens: "Verify the vendor's claims. Don't just read them."</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#7C6BC4] text-white flex items-center justify-center font-bold text-[11px] shrink-0">1</div>
                <div>
                  <div className="font-semibold text-slate-900">Upload NIT & Review Checklist (Officer)</div>
                  <p className="text-slate-500 mt-0.5">Click <b>"+ Create Tender"</b> or <b>Upload NIT</b>. The Document Extractor parses parameters with confidence scores. Review, edit, and confirm.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#7C6BC4] text-white flex items-center justify-center font-bold text-[11px] shrink-0">2</div>
                <div>
                  <div className="font-semibold text-slate-900">Review Submitted Bids (Tender C-409)</div>
                  <p className="text-slate-500 mt-0.5">Open Tender <b>CPWD/ND-II/2026/C-409</b> (Cement). 4 vendor bids are submitted with varying quotes and claimed specs.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#7C6BC4] text-white flex items-center justify-center font-bold text-[11px] shrink-0">3</div>
                <div>
                  <div className="font-semibold text-purple-900">Run Live Evaluation Pipeline</div>
                  <p className="text-purple-700 mt-0.5">Click <b>"Run Evaluation"</b>. Watch parallel agents verify BIS licences, GSTIN, and GeM pricing. <b>Vendor A (₹340) is disqualified</b> because BIS licence expired, and <b>Vendor D (₹290) is red-flagged</b> for collusion & ALT!</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#7C6BC4] text-white flex items-center justify-center font-bold text-[11px] shrink-0">4</div>
                <div>
                  <div className="font-semibold text-slate-900">Inspect Evidence & Download Report</div>
                  <p className="text-slate-500 mt-0.5">Click <b>"View Evidence"</b> to inspect the authentic BIS Manakonline search screenshot. Then click <b>"Download Report (PDF)"</b> to get the file noting report.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#7C6BC4] text-white flex items-center justify-center font-bold text-[11px] shrink-0">5</div>
                <div>
                  <div className="font-semibold text-slate-900">Switch to Vendor View</div>
                  <p className="text-slate-500 mt-0.5">Toggle role to <b>Vendor</b> at the top. See pre-submission checklist warnings, tender matching with transparent criteria, and notifications in real-time!</p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-[#7C6BC4] text-white text-xs font-semibold rounded-xl hover:bg-[#6957B7] transition-colors"
              >
                Got it, Start Demo!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
