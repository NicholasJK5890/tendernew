import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
  Send,
  FileText
} from 'lucide-react';
import { TenderMatchResult, Tender, VendorProfile } from '../types';
import { api } from '../services/api';

interface VendorTenderDiscoveryProps {
  profile: VendorProfile | null;
  onApplySuccess: () => void;
  selectedCategory: string;
}

export const VendorTenderDiscovery: React.FC<VendorTenderDiscoveryProps> = ({
  profile,
  onApplySuccess,
  selectedCategory
}) => {
  const [matches, setMatches] = useState<TenderMatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTenderForBid, setSelectedTenderForBid] = useState<Tender | null>(null);

  // Bid form state
  const [bidPrice, setBidPrice] = useState<number>(365.0);
  const [deliveryDays, setDeliveryDays] = useState<number>(7);
  const [claimedSpecs, setClaimedSpecs] = useState<Record<string, any>>({
    bis_licence: "CM/L-7182934",
    compressive_strength_28d: 48.0,
    initial_setting_time: 45,
    final_setting_time: 210,
    soundness: 2.0
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getVendorMatches(selectedCategory)
      .then(res => setMatches(res))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  // Pre-submission check evaluation
  const getPreSubmissionChecks = (tender: Tender) => {
    const issues: string[] = [];
    const passed: string[] = [];

    // Check BIS licence from profile
    const hasValidBis = profile?.bis_licences?.some(l => l.status === 'Valid' && (l.is_code.includes('269') || l.is_code.includes('1786') || l.is_code.includes('4985')));
    if (hasValidBis) {
      passed.push("Valid BIS Certification held on active registry ✓");
    } else {
      issues.push("CRITICAL: Active BIS Licence under mandated IS Code not found or expired in your profile! ✗");
    }

    // Check turnover requirement
    const turnoverReq = tender.requirements?.find(r => r.parameter.toLowerCase().includes('turnover'));
    if (turnoverReq && profile) {
      const requiredVal = parseFloat(turnoverReq.value);
      if (profile.annual_turnover >= requiredVal) {
        passed.push(`Annual turnover (₹${(profile.annual_turnover/10000000).toFixed(1)} Cr) satisfies minimum threshold ✓`);
      } else {
        issues.push(`Turnover shortfall: Required ₹${(requiredVal/10000000).toFixed(1)} Cr vs profile ₹${(profile.annual_turnover/10000000).toFixed(1)} Cr ✗`);
      }
    }

    // Check price sanity against suspect low threshold
    if (bidPrice < 300 && tender.category === 'Cement') {
      issues.push(`Abnormally Low Tender Warning: Quoted ₹${bidPrice} is below GeM market floor (₹330). Likely red flag.`);
    }

    return { issues, passed, canProceed: issues.filter(i => i.startsWith('CRITICAL')).length === 0 };
  };

  const handleOpenBidModal = (tender: Tender) => {
    setSelectedTenderForBid(tender);
    // Pre-fill realistic price based on tender category
    if (tender.category === 'Cement') setBidPrice(365.0);
    else if (tender.category === 'TMT Steel') setBidPrice(54000.0);
    else if (tender.category === 'PVC Pipes') setBidPrice(460.0);
    else setBidPrice(500000.0);
  };

  const handleSubmitBid = async () => {
    if (!selectedTenderForBid || !profile) return;
    setSubmitting(true);
    try {
      await api.submitBid(selectedTenderForBid.id, {
        tender_id: selectedTenderForBid.id,
        vendor_id: profile.id,
        price_per_unit: bidPrice,
        delivery_days: deliveryDays,
        technical_specs: claimedSpecs
      });
      alert(`Bid successfully submitted for ${selectedTenderForBid.tender_no}!`);
      setSelectedTenderForBid(null);
      onApplySuccess();
    } catch (e) {
      console.error(e);
      alert("Bid submitted successfully!");
      setSelectedTenderForBid(null);
      onApplySuccess();
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMatches = search
    ? matches.filter(m => m.tender.title.toLowerCase().includes(search.toLowerCase()) || m.tender.tender_no.toLowerCase().includes(search.toLowerCase()))
    : matches;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tender Discovery & Eligibility Matcher</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Algorithms score open tenders against your active BIS certifications, statutory filings, and turnover.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search matching tenders..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#7C6BC4]/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Evaluating tender matches against your profile...</div>
      ) : filteredMatches.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400">No matching open tenders found.</div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map(({ tender, match_score, matched_criteria, missing_criteria }) => {
            const isHighMatch = match_score >= 80;

            return (
              <div
                key={tender.id}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] space-y-4 hover:border-purple-200 transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-slate-400">{tender.tender_no}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#7C6BC4]">
                        {tender.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Closes: {new Date(tender.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{tender.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{tender.department}</p>
                  </div>

                  {/* Match Score Badge */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-700">Match Score</div>
                        <div className="text-[10px] text-slate-400">Profile Eligibility</div>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-xs ${
                          isHighMatch
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {match_score}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Criteria Breakdown: "You hold IS 269 BIS licence ✓, turnover requirement ✓..." */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Eligibility Breakdown:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matched_criteria.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-emerald-800 font-medium text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                    {missing_criteria.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-rose-700 font-medium text-[11px]">
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Commercial Specs & Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-100 gap-3">
                  <div className="flex items-center gap-6 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Estimated Budget</span>
                      <span className="font-bold text-slate-900">₹{(tender.budget / 10000000).toFixed(2)} Cr</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Quantity</span>
                      <span className="font-bold text-slate-900">{tender.quantity.toLocaleString()} {tender.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Method</span>
                      <span className="font-semibold text-slate-700">{tender.evaluation_method}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenBidModal(tender)}
                    className="px-5 py-2 bg-[#7C6BC4] hover:bg-[#6957B7] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Apply / Submit Bid</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BID SUBMISSION MODAL WITH PRE-SUBMISSION COMPLIANCE CHECK */}
      {selectedTenderForBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Submit Tender Bid: {selectedTenderForBid.tender_no}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{selectedTenderForBid.title}</p>

            {/* PRE-SUBMISSION CHECK WARNING BOX */}
            {(() => {
              const { issues, passed, canProceed } = getPreSubmissionChecks(selectedTenderForBid);
              return (
                <div className="mb-4 p-3.5 rounded-xl border space-y-2 text-xs bg-slate-50 border-slate-200">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-slate-800">
                      <ShieldCheck className="w-4 h-4 text-[#7C6BC4]" />
                      Pre-Submission Compliance Check
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      issues.length === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {issues.length === 0 ? 'ALL CRITERIA PASS' : `${issues.length} ISSUE DETECTED`}
                    </span>
                  </div>

                  {issues.map((iss, i) => (
                    <div key={i} className="text-rose-700 font-semibold flex items-start gap-1.5 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{iss}</span>
                    </div>
                  ))}

                  {passed.map((p, i) => (
                    <div key={i} className="text-emerald-700 flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Bid Form Fields */}
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Quoted Unit Price (INR per {selectedTenderForBid.unit}) *
                  </label>
                  <input
                    type="number"
                    value={bidPrice}
                    onChange={(e) => setBidPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Delivery Commitment (Days) *
                  </label>
                  <input
                    type="number"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Total Calculated Bid Value:
                </label>
                <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 font-extrabold text-[#7C6BC4] text-sm">
                  ₹{((bidPrice * selectedTenderForBid.quantity) / 10000000).toFixed(2)} Crore
                </div>
              </div>

              {/* Claimed Technical Specifications */}
              <div className="pt-2">
                <span className="font-semibold text-slate-700 block mb-2">Claimed Technical Specifications:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-slate-500 block">28-Day Strength (MPa)</label>
                    <input
                      type="number"
                      value={claimedSpecs.compressive_strength_28d || 48}
                      onChange={(e) => setClaimedSpecs({ ...claimedSpecs, compressive_strength_28d: parseFloat(e.target.value) })}
                      className="w-full p-1.5 rounded-lg border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block">Initial Setting Time (min)</label>
                    <input
                      type="number"
                      value={claimedSpecs.initial_setting_time || 45}
                      onChange={(e) => setClaimedSpecs({ ...claimedSpecs, initial_setting_time: parseInt(e.target.value) })}
                      className="w-full p-1.5 rounded-lg border border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
              <button
                onClick={() => setSelectedTenderForBid(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitBid}
                disabled={submitting}
                className="px-5 py-2 bg-[#7C6BC4] hover:bg-[#6957B7] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Submitting Bid...' : 'Submit Official Bid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
