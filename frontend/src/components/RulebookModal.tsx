import React, { useEffect, useState } from 'react';
import { X, BookOpen, CheckCircle, ShieldAlert, FileCode2, ExternalLink, Sliders } from 'lucide-react';
import { Rulebook } from '../types';
import { api } from '../services/api';

interface RulebookModalProps {
  category: string;
  onClose: () => void;
}

export const RulebookModal: React.FC<RulebookModalProps> = ({ category, onClose }) => {
  const [rulebook, setRulebook] = useState<Rulebook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getRulebook(category)
      .then((data) => setRulebook(data))
      .catch((err) => console.error("Failed to fetch rulebook:", err))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#F4F2FB] flex items-center justify-center text-[#7C6BC4]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#7C6BC4] uppercase tracking-wider">
                  Category Rulebook (JSON Config)
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  Autonomous Engine v1.0
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{rulebook?.title || category}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading rulebook configuration...</div>
        ) : !rulebook ? (
          <div className="py-12 text-center text-xs text-rose-500">Failed to load rulebook for {category}</div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* 1. Mandatory IS Standards */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Statutory Standards & Mandated Codes
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rulebook.applicable_is_standards?.map((s, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{s.code}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                        s.mandatory ? 'bg-purple-100 text-[#7C6BC4]' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {s.mandatory ? 'MANDATORY' : 'RECOMMENDED'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1 line-clamp-2">{s.title}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Regulator: {s.authority}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Verification Sources */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4 text-blue-600" />
                Registries Scraped & Verified by Agents
              </h4>
              <div className="space-y-1.5">
                {rulebook.verification_sources?.map((src, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-800">{src.name}</span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Checks: {src.checks.join(', ')}
                      </div>
                    </div>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#7C6BC4] hover:text-[#6957B7] p-1.5 hover:bg-white rounded-lg transition-colors"
                      title={src.url}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Standard Parameters & Operators */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#7C6BC4]" />
                Deterministic Verification Parameters
              </h4>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Parameter</th>
                      <th className="py-2 px-3">Operator</th>
                      <th className="py-2 px-3">Target</th>
                      <th className="py-2 px-3">Mandatory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {rulebook.standard_parameters?.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-medium text-slate-900">{p.parameter}</td>
                        <td className="py-2 px-3 font-mono text-[10px] uppercase font-bold text-slate-500">{p.operator}</td>
                        <td className="py-2 px-3 font-semibold">{p.target_value} {p.unit}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            p.mandatory ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {p.mandatory ? 'YES' : 'OPT'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Benchmark Price Range / Framework */}
            {rulebook.benchmark_price_range && (
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-900">
                  <span className="font-bold">GeM Pricing Floor Benchmark:</span> Active range ₹{rulebook.benchmark_price_range.min} - ₹{rulebook.benchmark_price_range.max} ({rulebook.benchmark_price_range.unit}).
                  Quotes below ₹{rulebook.benchmark_price_range.suspect_low_threshold} trigger an immediate <b>Abnormally Low Tender (ALT)</b> red flag!
                </div>
              </div>
            )}

            {rulebook.evaluation_framework && (
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/60">
                <div className="font-bold text-indigo-900 mb-1">QCBS Evaluation Framework (Services)</div>
                <div className="text-[11px] text-indigo-800 font-mono">
                  {rulebook.evaluation_framework.formula}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#7C6BC4] hover:bg-[#6957B7] text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Close Rulebook
          </button>
        </div>
      </div>
    </div>
  );
};
