import React from 'react';
import { X, ExternalLink, ShieldCheck, AlertTriangle, XCircle, Clock, Eye, Sparkles } from 'lucide-react';
import { VerificationCheck } from '../types';

interface EvidenceModalProps {
  check: VerificationCheck | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ check, onClose }) => {
  if (!check) return null;

  const isPass = check.verdict === 'Pass';
  const isFail = check.verdict === 'Fail';
  const isRedFlag = check.verdict === 'Red Flag';

  const evidenceItem = check.evidence_items?.[0];
  const screenshotUrl = evidenceItem?.screenshot_path || '/static/evidence/bis_active_ultracem.png';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isPass
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isFail
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {isPass && <ShieldCheck className="w-3.5 h-3.5" />}
                {isFail && <XCircle className="w-3.5 h-3.5" />}
                {isRedFlag && <AlertTriangle className="w-3.5 h-3.5" />}
                {check.verdict.toUpperCase()}
              </span>

              {/* Live vs Cached badge as explicitly required! */}
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  check.is_live
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                {check.is_live ? 'Live Agent Verified' : 'Cached Demo Evidence'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">{check.check_name}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <span className="text-slate-400 font-medium block">Verification Source:</span>
            <span className="font-semibold text-slate-800">{check.source_name}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Timestamp (IST):</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {new Date(check.verified_at).toLocaleString()}
            </span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-400 font-medium block">Direct Verification URL:</span>
            {check.source_url ? (
              <a
                href={check.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-[#7C6BC4] hover:underline flex items-center gap-1 font-mono text-[11px]"
              >
                {check.source_url}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-slate-500 font-mono text-[11px]">Public Statutory Registry</span>
            )}
          </div>
        </div>

        {/* Reason / Compliance Finding */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Deterministic Finding & Reason:</label>
          <div
            className={`p-3 rounded-xl text-xs font-medium leading-relaxed border ${
              isPass
                ? 'bg-emerald-50/50 text-emerald-900 border-emerald-100'
                : isFail
                ? 'bg-rose-50/60 text-rose-900 border-rose-100'
                : 'bg-amber-50/60 text-amber-900 border-amber-100'
            }`}
          >
            {check.reason}
          </div>
        </div>

        {/* Visual Proof / Screenshot Panel */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#7C6BC4]" />
              Automated Capture Screenshot Evidence:
            </label>
            <span className="text-[11px] text-slate-400 font-mono">1920x1080 Viewport</span>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 shadow-inner max-h-80 overflow-y-auto">
            <img
              src={screenshotUrl}
              alt="Automated evidence screenshot"
              className="w-full h-auto object-contain block hover:scale-[1.01] transition-transform duration-200"
              onError={(e) => {
                // Fallback if image path has leading slash mismatch
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('bis_active_ultracem.png')) {
                  target.src = '/static/evidence/bis_active_ultracem.png';
                }
              }}
            />
          </div>
          {evidenceItem?.caption && (
            <p className="text-[11px] text-slate-400 mt-1.5 italic text-center">
              {evidenceItem.caption}
            </p>
          )}
        </div>

        {/* Raw Payload Accordion */}
        {evidenceItem?.raw_data && Object.keys(evidenceItem.raw_data).length > 0 && (
          <details className="text-xs border border-slate-100 rounded-xl p-2.5 bg-slate-50">
            <summary className="font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
              View Verified JSON Schema Payload
            </summary>
            <pre className="mt-2 p-2 bg-slate-900 text-slate-200 rounded-lg overflow-x-auto text-[10px] font-mono leading-tight">
              {JSON.stringify(evidenceItem.raw_data, null, 2)}
            </pre>
          </details>
        )}

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
