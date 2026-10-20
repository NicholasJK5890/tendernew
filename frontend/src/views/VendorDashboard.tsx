import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  Award,
  AlertCircle
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { TrafficChart } from '../components/TrafficChart';
import { MilestoneWidget } from '../components/MilestoneWidget';
import { TutorialCard } from '../components/TutorialCard';
import { VendorProfile, Tender, Bid, Notification } from '../types';

interface VendorDashboardProps {
  profile: VendorProfile | null;
  tenders: Tender[];
  bids: Bid[];
  notifications: Notification[];
  onNavigateTab: (tab: string) => void;
  onApplyTender: (tenderId: number) => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({
  profile,
  tenders,
  bids,
  notifications,
  onNavigateTab,
  onApplyTender
}) => {
  const companyName = profile?.company_name || "Ultracem Infra Solutions Pvt Ltd";
  const completeness = profile?.completeness_pct || 95;

  const qualifiedBids = bids.filter(b => b.status === 'Qualified');
  const disqualifiedBids = bids.filter(b => b.status === 'Disqualified');
  const openTenders = tenders.filter(t => t.status === 'Published' || t.status === 'Bids Open');

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {companyName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            GSTIN: <span className="font-mono text-slate-700">{profile?.gstin || "07AABCU9603R1ZM"}</span> | Vendor Portal Active
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('tender-discovery')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#1E1B4B] hover:bg-[#2D2A5E] shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
            Discover Matching Tenders
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Tenders Matched"
          value="14"
          trend="+76%"
          trendType="positive"
          caption="from 8 (last weeks)"
        />
        <KpiCard
          label="Applications Submitted"
          value={bids.length || 4}
          trend="+32%"
          trendType="positive"
          caption="active bids"
        />
        <KpiCard
          label="Shortlisted / Ranked L1"
          value={qualifiedBids.length || 2}
          trend="+100%"
          trendType="positive"
          caption="statutory compliant"
        />
        <KpiCard
          label="Documents Verified %"
          value="100%"
          trend="5/5"
          trendType="positive"
          caption="BIS, GST & MCA clear"
        />
      </div>

      {/* Main Grid: Chart + Profile Completeness Milestone Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrafficChart />
        </div>

        <div className="space-y-6">
          {/* Milestone Widget displaying vendor profile completeness */}
          <MilestoneWidget
            title="Vendor Profile & Trust Score"
            metric={`${completeness}% Ready`}
            description="Your statutory BIS certification and GST filings are verified. You are eligible for 100% of open cement tenders."
            milestoneLabel="Profile Completeness Milestone"
            startLabel="Basic"
            endLabel="100% Tier-1"
            percentage={completeness}
            secondaryTitle="BIS Licence Registry Status"
            secondaryPercentage={100}
          />
          <TutorialCard />
        </div>
      </div>

      {/* Two Column Section: Matching Tenders & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Tenders Matched */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Matching Government Tenders</h3>
              <p className="text-[11px] text-slate-400">Tenders aligned with your product IS certifications</p>
            </div>
            <button
              onClick={() => onNavigateTab('tender-discovery')}
              className="text-xs font-semibold text-[#7C6BC4] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {tenders.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#7C6BC4]">
                      {t.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{t.tender_no}</span>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-900 mt-1 line-clamp-1">{t.title}</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Budget: ₹{(t.budget / 10000000).toFixed(2)} Cr | Closes in 14 days
                  </div>
                </div>

                <button
                  onClick={() => onApplyTender(t.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#7C6BC4] hover:bg-[#6957B7] text-white text-xs font-semibold shrink-0 transition-colors"
                >
                  Apply Bid
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live In-App Notifications */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Real-Time In-App Alerts</h3>
              <p className="text-[11px] text-slate-400">Evaluation updates, clarifications & deadlines</p>
            </div>
            <button
              onClick={() => onNavigateTab('clarifications')}
              className="text-xs font-semibold text-[#7C6BC4] hover:underline"
            >
              Clarifications Inbox
            </button>
          </div>

          <div className="space-y-2.5">
            {notifications.slice(0, 4).map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-xl border text-xs transition-colors ${
                  n.type === 'shortlisted'
                    ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                    : n.type === 'disqualified'
                    ? 'bg-rose-50/50 border-rose-100 text-rose-900'
                    : 'bg-slate-50 border-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    {n.type === 'shortlisted' && <Award className="w-3.5 h-3.5 text-emerald-600" />}
                    {n.type === 'disqualified' && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                    {n.title}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
