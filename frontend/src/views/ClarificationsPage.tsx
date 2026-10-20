import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Clarification } from '../types';
import { api } from '../services/api';

interface ClarificationsPageProps {
  isOfficer: boolean;
}

export const ClarificationsPage: React.FC<ClarificationsPageProps> = ({ isOfficer }) => {
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [id: number]: string }>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const loadData = () => {
    api.getClarifications()
      .then(res => setClarifications(res))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendReply = async (id: number) => {
    const text = replyText[id];
    if (!text || !text.trim()) return;
    setSubmittingId(id);
    try {
      await api.replyClarification(id, text);
      setReplyText({ ...replyText, [id]: '' });
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading clarifications inbox...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Clarification Communications Inbox</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Formal query-response thread between Procuring Officers and Bidders, audited under GFR Rule 173.
        </p>
      </div>

      {clarifications.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400">No active clarification queries.</div>
      ) : (
        <div className="space-y-4">
          {clarifications.map((c) => {
            const isReplied = c.status === 'Replied' || c.status === 'Closed';

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">Ref #CLR-{c.id}</span>
                    <span className="text-xs font-bold text-slate-800">Tender #{c.tender_id}</span>
                    <span className="text-xs text-slate-500 font-medium">| Bidder: <b>{c.vendor_name}</b></span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      isReplied
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isReplied ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {c.status.toUpperCase()}
                  </span>
                </div>

                {/* Officer Query */}
                <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#7C6BC4]" />
                    <span>Government Officer Query:</span>
                    <span className="text-[10px] text-slate-400 font-normal ml-auto">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-sans">{c.query_text}</p>
                </div>

                {/* Vendor Reply */}
                {c.response_text ? (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Vendor Submitted Reply:</span>
                      <span className="text-[10px] text-slate-400 font-normal ml-auto">
                        {c.replied_at ? new Date(c.replied_at).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-sans">{c.response_text}</p>
                  </div>
                ) : (
                  /* Reply Form for Vendor */
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-semibold text-slate-700">Submit Your Formal Reply & Evidence:</label>
                    <textarea
                      rows={3}
                      value={replyText[c.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [c.id]: e.target.value })}
                      placeholder="Type official explanation or reference attached documents..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#7C6BC4]/20"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSendReply(c.id)}
                        disabled={submittingId === c.id}
                        className="px-4 py-2 bg-[#7C6BC4] hover:bg-[#6957B7] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {submittingId === c.id ? 'Submitting...' : 'Submit Formal Reply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
