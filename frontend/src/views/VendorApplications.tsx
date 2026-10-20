import React, { useState, useEffect } from 'react';
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  FileText,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Bid, VerificationCheck } from '../types';
import { api } from '../services/api';
import { EvidenceModal } from '../components/EvidenceModal';

export const VendorApplications: React.FC = () => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCheck, setActiveCheck] = useState<VerificationCheck | null>(null);

  useEffect(() => {
    api.getVendorApplications()
      .then(res => setBids(res))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading your submitted applications...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">My Tender Applications & Bid Status</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time compliance tracking from Submission &rarr; Technical Verification &rarr; L1 Ranking & Contract Award.
        </p>
      </div>

      {bids.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400">
          No applications submitted yet. Browse open tenders in the Discovery section!
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((b) => {
            const isQualified = b.status === 'Qualified';
            const isDisqualified = b.status === 'Disqualified';
            const isAwarded = b.status === 'Awarded';
            const isRedFlag = b.status === 'Red Flagged';

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-slate-400">Application #{b.id}</span>
                      <span className="text-xs font-semibold text-slate-600">
                        Tender ID: #{b.tender_id}
                      </span>
                      {b.rank && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          RANKED {b.rank}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Bulk Ordinary Portland Cement (OPC 43) Supply
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                        isAwarded
                          ? 'bg-purple-100 text-[#7C6BC4] border border-purple-200'
                          : isQualified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isDisqualified
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isRedFlag
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isAwarded && <Award className="w-3.5 h-3.5" />}
                      {isQualified && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isDisqualified && <XCircle className="w-3.5 h-3.5" />}
                      {isRedFlag && <AlertTriangle className="w-3.5 h-3.5" />}
                      {b.status}
                    </span>
                  </div>
                </div>

                {/* Progress Tracker Bar */}
                <div className="py-2">
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-semibold">
                    <div className="text-slate-800">1. Submitted</div>
                    <div className="text-slate-800">2. Technical Evaluation</div>
                    <div className={isDisqualified ? 'text-rose-600' : 'text-slate-800'}>
                      3. {isDisqualified ? 'Disqualified' : 'Qualified / L1'}
                    </div>
                    <div className={isAwarded ? 'text-[#7C6BC4]' : 'text-slate-400'}>4. Awarded</div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 h-2">
                    <div className="flex-1 h-full rounded-full bg-emerald-500" />
                    <div className="flex-1 h-full rounded-full bg-emerald-500" />
                    <div className={`flex-1 h-full rounded-full ${
                      isDisqualified ? 'bg-rose-500' : isRedFlag ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <div className={`flex-1 h-full rounded-full ${isAwarded ? 'bg-[#7C6BC4]' : 'bg-slate-100'}`} />
                  </div>
                </div>

                {/* Disqualification / Red Flag Notification Box */}
                {isDisqualified && b.disqualification_reasons?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-900 space-y-1">
                    <span className="font-bold flex items-center gap-1 text-rose-700">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Disqualification Ground:
                    </span>
                    <p className="leading-relaxed pl-5 font-medium">{b.disqualification_reasons[0]}</p>
                    {b.checks?.length > 0 && (
                      <div className="pt-2 pl-5">
                        <button
                          onClick={() => setActiveCheck(b.checks[0])}
                          className="text-[#7C6BC4] hover:underline font-bold text-[11px] flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Statutory Verification Proof Screenshot &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Financial Summary */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Your Quoted Rate</span>
                      <span className="font-bold text-slate-900">₹{b.price_per_unit.toFixed(2)} / unit</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Total Bid Value</span>
                      <span className="font-bold text-slate-900">₹{(b.total_amount / 10000000).toFixed(2)} Cr</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Delivery</span>
                      <span className="font-semibold text-slate-700">{b.delivery_days} days</span>
                    </div>
                  </div>

                  <span className="text-slate-400 text-[11px]">
                    Submitted: {new Date(b.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evidence Modal */}
      {activeCheck && (
        <EvidenceModal
          check={activeCheck}
          onClose={() => setActiveCheck(null)}
        />
      )}
    </div>
  );
};
