import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Download,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Award,
  Layers,
  Send
} from 'lucide-react';
import { Tender, Bid, VerificationCheck } from '../types';
import { api } from '../services/api';
import { EvidenceModal } from '../components/EvidenceModal';
import { ClarificationModal } from '../components/ClarificationModal';

interface OfficerTenderDetailProps {
  tenderId: number;
  onBack: () => void;
  onOpenRulebook: (cat: string) => void;
}

export const OfficerTenderDetail: React.FC<OfficerTenderDetailProps> = ({
  tenderId,
  onBack,
  onOpenRulebook
}) => {
  const [tender, setTender] = useState<Tender | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [evalProgress, setEvalProgress] = useState<number>(0);
  const [agentStep, setAgentStep] = useState<string>('');

  // Expandable bidder cards
  const [expandedBidId, setExpandedBidId] = useState<number | null>(null);

  // Modals
  const [activeCheckForEvidence, setActiveCheckForEvidence] = useState<VerificationCheck | null>(null);
  const [clarificationData, setClarificationData] = useState<{ bidId: number; vendorId: number; vendorName: string } | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('Approved based on AI verification compliance and L1 pricing.');

  const loadData = async () => {
    try {
      const [tData, bData] = await Promise.all([
        api.getTender(tenderId),
        api.getTenderBids(tenderId)
      ]);
      setTender(tData);
      setBids(bData);
    } catch (e) {
      console.error("Failed to load tender:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenderId]);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    setEvalProgress(10);
    setAgentStep('Ingesting claimed specs & initializing agents...');

    setTimeout(() => {
      setEvalProgress(35);
      setAgentStep('Licence Agent: Verifying BIS Manakonline & IS standards...');
    }, 600);

    setTimeout(() => {
      setEvalProgress(65);
      setAgentStep('Company Agent: Verifying GSTIN active status & MCA21...');
    }, 1200);

    setTimeout(() => {
      setEvalProgress(85);
      setAgentStep('Price & Fraud Agent: Checking GeM benchmark & inter-bid collusion graph...');
    }, 1800);

    setTimeout(async () => {
      try {
        await api.runEvaluation(tenderId);
        setEvalProgress(100);
        setAgentStep('Deterministic Compliance Engine: Finalizing L1 / QCBS ranking!');
        await loadData();
      } catch (e) {
        console.error("Evaluation error:", e);
      } finally {
        setTimeout(() => setEvaluating(false), 500);
      }
    }, 2400);
  };

  const handleApproveTender = async () => {
    try {
      await api.approveTender(tenderId, { notes: approvalNotes });
      setApprovalModalOpen(false);
      await loadData();
    } catch (e) {
      console.error("Failed to approve tender:", e);
    }
  };

  const handleDownloadReport = () => {
    window.open(`/api/tenders/${tenderId}/report`, '_blank');
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading tender evaluation details...</div>;
  }

  if (!tender) {
    return <div className="py-20 text-center text-xs text-rose-500">Tender not found.</div>;
  }

  const qualifiedBids = bids.filter(b => b.status === 'Qualified');
  const disqualifiedBids = bids.filter(b => b.status === 'Disqualified');
  const redFlaggedBids = bids.filter(b => b.status === 'Red Flagged');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">{tender.tender_no}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#7C6BC4] border border-purple-100">
                {tender.category}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                tender.status === 'Awarded'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {tender.status}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{tender.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenRulebook(tender.category)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#7C6BC4]" />
            Rulebook
          </button>
          <button
            onClick={handleDownloadReport}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Download PDF Report
          </button>
          {tender.status !== 'Awarded' && (
            <button
              onClick={() => setApprovalModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              Approve & Award
            </button>
          )}
        </div>
      </div>

      {/* Tender Metadata Strip */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 font-medium block">Department</span>
          <span className="font-semibold text-slate-800">{tender.department}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block">Quantity & Unit</span>
          <span className="font-semibold text-slate-800">{tender.quantity.toLocaleString()} {tender.unit}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block">Total Estimate Budget</span>
          <span className="font-bold text-slate-900 text-sm">₹{(tender.budget / 10000000).toFixed(2)} Cr</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block">Evaluation Method</span>
          <span className="font-bold text-[#7C6BC4]">{tender.evaluation_method} ({tender.evaluation_method === 'QCBS' ? '70% Tech / 30% Fin' : 'Lowest Compliant'})</span>
        </div>
      </div>

      {/* EVALUATION RUNNER HERO */}
      <div className="bg-gradient-to-r from-[#1E1B4B] to-[#2E286E] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-purple-200 text-[11px] font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
              AI Multi-Agent Verification Pipeline
            </div>
            <h2 className="text-lg font-bold text-white">Autonomous Verification & Compliance Engine</h2>
            <p className="text-xs text-purple-200 max-w-xl mt-1 leading-relaxed">
              "Verify the vendor's claims. Don't just read them." Automatically runs parallel checks against
              BIS Manakonline, GST Common Portal, MCA21, and GeM Price Graph.
            </p>
          </div>

          <button
            onClick={handleRunEvaluation}
            disabled={evaluating}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C6BC4] to-[#9987E8] hover:from-[#6957B7] hover:to-[#8674D8] text-white text-xs font-bold shadow-md shadow-purple-950/40 flex items-center gap-2 transition-all shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            {evaluating ? 'Running Live Agents...' : 'Run Live Evaluation Pipeline'}
          </button>
        </div>

        {/* Live Pipeline Progress Indicator */}
        {evaluating && (
          <div className="mt-5 pt-4 border-t border-white/10 space-y-2 relative z-10">
            <div className="flex justify-between items-center text-xs font-medium text-purple-200">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                {agentStep}
              </span>
              <span className="font-mono text-cyan-300 font-bold">{evalProgress}%</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-[#7C6BC4] h-full transition-all duration-300 rounded-full"
                style={{ width: `${evalProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* EVALUATION RESULTS & RANKING CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Bid Submissions & Compliance Standings ({bids.length} Bidders)
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {qualifiedBids.length} Qualified
            </span>
            <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
              {disqualifiedBids.length} Disqualified
            </span>
            <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              {redFlaggedBids.length} Red Flagged
            </span>
          </div>
        </div>

        {/* Bidder Cards */}
        <div className="space-y-3">
          {bids.map((bid) => {
            const isQualified = bid.status === 'Qualified';
            const isDisqualified = bid.status === 'Disqualified';
            const isRedFlag = bid.status === 'Red Flagged';
            const isExpanded = expandedBidId === bid.id;

            return (
              <div
                key={bid.id}
                className={`bg-white rounded-2xl border transition-all ${
                  isQualified
                    ? 'border-emerald-200/80 shadow-[0_2px_12px_-4px_rgba(16,185,129,0.08)]'
                    : isDisqualified
                    ? 'border-rose-200/80 shadow-[0_2px_12px_-4px_rgba(244,63,94,0.08)]'
                    : 'border-amber-200/80 shadow-[0_2px_12px_-4px_rgba(245,158,11,0.08)]'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Rank or Status Icon Badge */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                        bid.rank === 'L1'
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                          : isQualified
                          ? 'bg-emerald-100 text-emerald-800'
                          : isDisqualified
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {bid.rank || (isDisqualified ? 'DISQ' : 'FLAG')}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{bid.vendor_name}</h4>
                        <span className="text-[11px] font-mono text-slate-400">({bid.vendor_gstin})</span>
                        {bid.rank === 'L1' && (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            RECOMMENDED L1 WINNER
                          </span>
                        )}
                      </div>

                      {/* Disqualification / Red Flag Reasons inline preview */}
                      {isDisqualified && bid.disqualification_reasons?.length > 0 && (
                        <div className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{bid.disqualification_reasons[0]}</span>
                        </div>
                      )}

                      {isRedFlag && bid.red_flag_reasons?.length > 0 && (
                        <div className="mt-1 text-xs text-amber-700 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{bid.red_flag_reasons[0]}</span>
                        </div>
                      )}

                      {isQualified && (
                        <div className="mt-1 text-xs text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>All IS 269 mandatory standards & commercial criteria verified.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial & Delivery Details */}
                  <div className="flex items-center gap-6 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div>
                      <div className="text-slate-400 text-[10px] font-medium">Quoted Unit Rate</div>
                      <div className="text-base font-extrabold text-slate-900">
                        ₹{bid.price_per_unit.toFixed(2)}
                        <span className="text-[11px] text-slate-400 font-normal"> / bag</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 text-[10px] font-medium">Total Amount</div>
                      <div className="text-xs font-bold text-slate-800">
                        ₹{(bid.total_amount / 10000000).toFixed(2)} Cr
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 text-[10px] font-medium">Delivery</div>
                      <div className="text-xs font-bold text-slate-800">{bid.delivery_days} days</div>
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() => setExpandedBidId(isExpanded ? null : bid.id)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="Toggle verification breakdown"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* EXPANDED REQUIREMENT-BY-REQUIREMENT & EVIDENCE BREAKDOWN */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/50 rounded-b-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Autonomous Verification Findings & Evidence Citations
                      </span>
                      <button
                        onClick={() => setClarificationData({
                          bidId: bid.id,
                          vendorId: bid.vendor_id,
                          vendorName: bid.vendor_name
                        })}
                        className="text-xs font-semibold text-[#7C6BC4] hover:text-[#6957B7] flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Draft Clarification Query
                      </button>
                    </div>

                    {/* Checks Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">Verification Check</th>
                            <th className="py-2.5 px-3">Source Registry</th>
                            <th className="py-2.5 px-3">Verdict</th>
                            <th className="py-2.5 px-3">Detailed Reason / Finding</th>
                            <th className="py-2.5 px-3 text-right">Proof Evidence</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bid.checks?.map((chk) => (
                            <tr key={chk.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-semibold text-slate-900">
                                {chk.check_name}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                <span className="font-mono text-[11px]">{chk.source_name}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    chk.verdict === 'Pass'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : chk.verdict === 'Fail'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {chk.verdict}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate" title={chk.reason}>
                                {chk.reason}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => setActiveCheckForEvidence(chk)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7C6BC4] hover:text-[#6957B7] hover:underline"
                                >
                                  <span>View Screenshot</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Claimed specs vs Tender Checklist */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        Technical Specifications Claimed vs Tender Requirement Checklist
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {Object.entries(bid.technical_specs || {}).map(([param, val]) => (
                          <div key={param} className="p-2 rounded-lg bg-white border border-slate-200">
                            <span className="text-[10px] text-slate-400 capitalize block truncate">
                              {param.replace(/_/g, ' ')}
                            </span>
                            <span className="font-bold text-slate-800">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* OFFICER APPROVAL MODAL */}
      {approvalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Confirm Officer Approval & Contract Award</h3>
            <p className="text-xs text-slate-500 mb-4">
              Approving Tender <b>{tender.tender_no}</b> awards the contract to the compliant L1 bidder ({qualifiedBids[0]?.vendor_name || 'L1 Bidder'}) and triggers automated vendor notifications.
            </p>

            <label className="text-xs font-semibold text-slate-700 mb-1 block">Officer File Noting / Override Justification:</label>
            <textarea
              rows={4}
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#7C6BC4]/20 text-slate-800"
            />

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setApprovalModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveTender}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
              >
                Confirm Approval & File Noting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Screenshot Modal */}
      {activeCheckForEvidence && (
        <EvidenceModal
          check={activeCheckForEvidence}
          onClose={() => setActiveCheckForEvidence(null)}
        />
      )}

      {/* Clarification Drafter Modal */}
      {clarificationData && (
        <ClarificationModal
          tenderId={tender.id}
          bidId={clarificationData.bidId}
          vendorId={clarificationData.vendorId}
          vendorName={clarificationData.vendorName}
          onClose={() => setClarificationData(null)}
          onSuccess={() => alert("Clarification query successfully dispatched to vendor's inbox!")}
        />
      )}
    </div>
  );
};
