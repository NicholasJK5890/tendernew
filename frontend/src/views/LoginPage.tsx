import React from 'react';
import { ShieldCheck, UserCheck, Building2, CheckCircle2, ArrowRight, Sparkles, AlertTriangle, Shield } from 'lucide-react';
import { User } from '../types';

interface LoginPageProps {
  users: User[];
  onSelectUser: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ users, onSelectUser }) => {
  const officerUser = users.find(u => u.role === 'officer') || {
    id: 1,
    name: "Rajesh Sharma",
    email: "officer@cpwd.gov.in",
    role: "officer" as const,
    department: "Central Public Works Department (CPWD), New Delhi",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
    created_at: new Date().toISOString()
  };

  const vendorUsers = users.filter(u => u.role === 'vendor');

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7C6BC4] to-[#9987E8] text-white shadow-lg shadow-[#7C6BC4]/25 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">TenderLens</h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          "Verify the vendor's claims. Don't just read them."
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-xs font-semibold text-[#7C6BC4]">
          <Sparkles className="w-3.5 h-3.5" />
          Autonomous AI Verification Agent for Indian Procurement
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] rounded-3xl border border-slate-100 space-y-8">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-center text-slate-400 mb-4">
              Select Your Portal Persona to Enter Demo
            </h3>

            {/* PORTAL SELECTOR CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Officer Portal Card */}
              <div
                onClick={() => onSelectUser(officerUser)}
                className="group relative p-5 rounded-2xl border-2 border-slate-200/80 hover:border-[#7C6BC4] bg-white hover:bg-purple-50/20 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#7C6BC4] flex items-center justify-center mb-3">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base group-hover:text-[#7C6BC4] transition-colors">
                    I am a Government Officer
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Upload NIT, AI checklist extraction, run parallel verification agents (BIS/GSTIN/GeM), and view deterministic rankings.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <img
                      src={officerUser.avatar_url}
                      alt="Officer"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div className="text-left text-[11px]">
                      <div className="font-bold text-slate-800">{officerUser.name}</div>
                      <div className="text-slate-400">Chief Engineer, CPWD</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#7C6BC4] group-hover:translate-x-1 transition-transform">
                  <span>Enter Officer Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Vendor Portal Card (Default to Vendor B - Ultracem L1) */}
              <div
                onClick={() => {
                  const defaultVendor = vendorUsers.find(v => v.email.includes('vendor_b')) || vendorUsers[0];
                  if (defaultVendor) onSelectUser(defaultVendor);
                }}
                className="group relative p-5 rounded-2xl border-2 border-slate-200/80 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                    I am a Vendor / Contractor
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Build compliance profile, verify statutory BIS licences, match open tenders, and submit pre-checked compliant bids.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120"
                      alt="Vendor"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div className="text-left text-[11px]">
                      <div className="font-bold text-slate-800">Ultracem Infra Solutions</div>
                      <div className="text-emerald-600 font-semibold">Verified Compliant (L1)</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                  <span>Enter Vendor Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Seeded Vendor Persona Switcher */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Or Test Specific Vendor Evaluation Test Cases:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {vendorUsers.map((v) => {
                const isUltracem = v.email.includes('vendor_b');
                const isShreeRam = v.email.includes('vendor_a');
                const isApex = v.email.includes('vendor_d');
                const isAmbuja = v.email.includes('vendor_c');

                return (
                  <button
                    key={v.id}
                    onClick={() => onSelectUser(v)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-[#7C6BC4] bg-slate-50/60 hover:bg-white text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{v.department}</div>
                      <div className="text-[10px] mt-0.5">
                        {isUltracem && <span className="text-emerald-600 font-semibold">₹365/bag (Compliant L1 Winner)</span>}
                        {isShreeRam && <span className="text-rose-600 font-semibold">₹340/bag (Expired BIS Disqualification)</span>}
                        {isApex && <span className="text-amber-700 font-semibold">₹290/bag (Collusion & ALT Red Flag)</span>}
                        {isAmbuja && <span className="text-indigo-600 font-semibold">₹372/bag (Compliant L2 Runner Up)</span>}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#7C6BC4] group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
