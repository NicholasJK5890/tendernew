import React, { useState } from 'react';
import { X, Send, Sparkles, MessageSquare } from 'lucide-react';
import { api } from '../services/api';

interface ClarificationModalProps {
  tenderId: number;
  bidId: number;
  vendorId: number;
  vendorName: string;
  defaultTopic?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  tenderId,
  bidId,
  vendorId,
  vendorName,
  defaultTopic = "BIS Licence Clarification",
  onClose,
  onSuccess
}) => {
  const [queryText, setQueryText] = useState(
    `Dear ${vendorName},\n\nDuring statutory verification of your submitted bid for Tender #${tenderId}, automated verification queries against the BIS Manakonline registry indicated that your licence record requires clarification. Please submit an official renewal endorsement or current test report within 48 hours to prevent disqualification under GFR Rule 173.\n\nRegards,\nProcurement Officer, Central Works Department`
  );
  const [submitting, setSubmitting] = useState(false);

  const handleAutoDraft = () => {
    setQueryText(
      `Dear ${vendorName},\n\nWith reference to your bid submission for Tender #${tenderId}, the Technical Evaluation Committee requests clarification regarding technical specifications and mandatory certification compliance. Please provide documentary evidence for the cited parameters.\n\nSincerely,\nEvaluation Committee`
    );
  };

  const handleSend = async () => {
    if (!queryText.trim()) return;
    setSubmitting(true);
    try {
      await api.createClarification({
        tender_id: tenderId,
        bid_id: bidId,
        vendor_id: vendorId,
        query_text: queryText
      });
      onSuccess();
      onClose();
    } catch (e) {
      console.error("Failed to send clarification:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F4F2FB] flex items-center justify-center text-[#7C6BC4]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Issue Official Clarification Query</h3>
              <p className="text-xs text-slate-500">Recipient: <b>{vendorName}</b> (Bid #{bidId})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700">Official Query Text (Editable):</label>
          <button
            type="button"
            onClick={handleAutoDraft}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7C6BC4] hover:text-[#6957B7]"
          >
            <Sparkles className="w-3 h-3" />
            AI Auto-Draft Query
          </button>
        </div>

        <textarea
          rows={7}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#7C6BC4]/20 focus:border-[#7C6BC4] text-slate-800 leading-relaxed font-sans"
        />

        <p className="text-[11px] text-slate-400 mt-2">
          Notice: This query is officially logged in the public procurement audit trail and appears in the vendor's Clarification Inbox.
        </p>

        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7C6BC4] hover:bg-[#6957B7] text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Sending...' : 'Send Clarification'}
          </button>
        </div>
      </div>
    </div>
  );
};
