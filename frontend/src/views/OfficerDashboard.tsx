import React from 'react';
import {
  Plus,
  ArrowRight,
  Filter,
  Download,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  FileCheck2
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { TrafficChart } from '../components/TrafficChart';
import { MilestoneWidget } from '../components/MilestoneWidget';
import { TutorialCard } from '../components/TutorialCard';
import { Tender, User } from '../types';

interface OfficerDashboardProps {
  currentUser: User | null;
  tenders: Tender[];
  onSelectTender: (id: number) => void;
  onCreateTender: () => void;
  onOpenRulebook: (cat: string) => void;
  selectedCategory: string;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({
  currentUser,
  tenders,
  onSelectTender,
  onCreateTender,
  onOpenRulebook,
  selectedCategory
}) => {
  // Filter by category if selected
  const filteredTenders = selectedCategory === 'All'
    ? tenders
    : tenders.filter(t => t.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Greeting Header & Top Action matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Hi, {currentUser?.name?.split(' ')[0] || 'Rajesh'} —
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Here's how your automated procurement verification pipeline is performing today.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenRulebook('Cement')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 shadow-2xs transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7C6BC4]" />
            IS 269 Rulebook
          </button>
          <button
            onClick={onCreateTender}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#1E1B4B] hover:bg-[#2D2A5E] shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Create Tender
          </button>
        </div>
      </div>

      {/* Row of KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Tenders"
          value="4"
          trend="+12%"
          trendType="positive"
          caption="from 3 (last month)"
        />
        <KpiCard
          label="Bids Evaluated"
          value="8"
          trend="+28%"
          trendType="positive"
          caption="from 6 (last week)"
        />
        <KpiCard
          label="Compliant / L1 Qualified"
          value="5"
          trend="+15%"
          trendType="positive"
          caption="100% verified against registries"
        />
        <KpiCard
          label="Disqualified / Red Flagged"
          value="3"
          trend="-18%"
          trendType="negative"
          caption="substandard supplies stopped"
        />
      </div>

      {/* Main Grid: Chart + Right Side Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Multi-Line Chart */}
        <div className="lg:col-span-2">
          <TrafficChart />
        </div>

        {/* Right 1 Col: Tutorial & Vertical Striped Milestone Widget */}
        <div className="space-y-6">
          <TutorialCard />
          <MilestoneWidget
            title="Procurement Integrity Milestone"
            metric="₹18.5 Cr"
            description="Verified 50,000 bags OPC cement against BIS IS 269 registry. Prevented ₹1.70 Cr contract with expired certification."
            milestoneLabel="Compliance to next milestone"
            startLabel="₹10 Cr"
            endLabel="₹25 Cr"
            percentage={74}
            secondaryTitle="Statutory Registry Clearance"
            secondaryPercentage={80}
          />
        </div>
      </div>

      {/* Bottom Data Table: List Tenders */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Table Header Controls matching screenshot */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Procurement Tenders by Category</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing active tenders in category: <span className="font-semibold text-slate-700">{selectedCategory}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenRulebook('Cement')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              Category Rules
            </button>
            <button
              onClick={onCreateTender}
              className="px-3.5 py-1.5 rounded-lg bg-[#1E1B4B] text-white hover:bg-[#2E2A68] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              + Create
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Tender Ref & Title</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Budget (INR)</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTenders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No tenders found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTenders.map((t) => {
                  const isCement = t.category === 'Cement';
                  return (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTender(t.id)}
                      className="hover:bg-purple-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-[#7C6BC4] transition-colors flex items-center gap-1.5">
                          {t.title}
                          {isCement && (
                            <span className="text-[10px] bg-purple-100 text-[#7C6BC4] px-1.5 py-0.2 rounded font-bold">
                              DEMO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{t.tender_no}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{t.department}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{(t.budget / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {t.quantity.toLocaleString()} {t.unit}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            t.status === 'Under Evaluation'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : t.status === 'Awarded'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {t.status === 'Under Evaluation' && <Clock className="w-3 h-3" />}
                          {t.status === 'Awarded' && <ShieldCheck className="w-3 h-3" />}
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTender(t.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C6BC4] hover:text-[#6957B7] hover:underline"
                        >
                          <span>{t.status === 'Under Evaluation' ? 'Run Evaluation' : 'View Bids'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
