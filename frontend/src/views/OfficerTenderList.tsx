import React, { useState } from 'react';
import { Plus, Filter, LayoutGrid, List, ArrowRight, Clock, ShieldCheck, FileText } from 'lucide-react';
import { Tender } from '../types';

interface OfficerTenderListProps {
  tenders: Tender[];
  onSelectTender: (id: number) => void;
  onCreateTender: () => void;
  selectedCategory: string;
}

export const OfficerTenderList: React.FC<OfficerTenderListProps> = ({
  tenders,
  onSelectTender,
  onCreateTender,
  selectedCategory
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = tenders.filter(t => {
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesCat && matchesStatus;
  });

  const kanbanColumns = [
    { title: 'Draft', status: 'Draft' },
    { title: 'Published / Bids Open', status: 'Published' },
    { title: 'Under Evaluation', status: 'Under Evaluation' },
    { title: 'Awarded', status: 'Awarded' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tender Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active tenders in category: <span className="font-semibold text-slate-800">{selectedCategory}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${
                viewMode === 'list' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
              }`}
              title="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${
                viewMode === 'kanban' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
              }`}
              title="Kanban view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onCreateTender}
            className="px-4 py-2 bg-[#1E1B4B] hover:bg-[#2D2A5E] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Tender
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => {
            const colTenders = tenders.filter(t => {
              if (col.status === 'Published') {
                return t.status === 'Published' || t.status === 'Bids Open';
              }
              return t.status === col.status;
            });

            return (
              <div key={col.status} className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">{col.title}</span>
                  <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {colTenders.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colTenders.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTender(t.id)}
                      className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-[#7C6BC4] transition-all cursor-pointer group space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">{t.tender_no}</span>
                        <span className="text-[10px] bg-purple-50 text-[#7C6BC4] font-bold px-1.5 py-0.2 rounded">
                          {t.category}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#7C6BC4] transition-colors line-clamp-2">
                        {t.title}
                      </h4>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Budget: ₹{(t.budget / 10000000).toFixed(2)} Cr
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Tender Ref & Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTender(t.id)}
                    className="hover:bg-purple-50/20 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-[#7C6BC4] transition-colors">{t.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{t.tender_no}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{t.department}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{(t.budget / 10000000).toFixed(2)} Cr
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'Awarded'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : t.status === 'Under Evaluation'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-xs font-semibold text-[#7C6BC4] hover:underline flex items-center gap-1 ml-auto">
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
