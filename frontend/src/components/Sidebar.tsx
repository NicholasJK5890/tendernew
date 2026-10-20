import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  CheckSquare,
  ShieldCheck,
  History,
  MessageSquareText,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Award,
  Sparkles,
  Building2,
  FolderOpen
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User | null;
  onOpenRulebook: (category: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenRulebook,
  selectedCategory,
  onSelectCategory
}) => {
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const isOfficer = currentUser?.role === 'officer';

  const categories = [
    { name: 'Cement', code: 'IS 269, IS 4031', tag: 'Full Demo' },
    { name: 'TMT Steel', code: 'IS 1786', tag: 'Seeded' },
    { name: 'PVC Pipes', code: 'IS 4985', tag: 'Seeded' },
    { name: 'Services', code: 'QCBS / ISO', tag: 'Seeded' }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C6BC4] to-[#9987E8] flex items-center justify-center text-white shadow-md shadow-[#7C6BC4]/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
              TenderLens
              <span className="text-[10px] bg-purple-50 text-[#7C6BC4] font-bold px-1.5 py-0.2 rounded-md border border-purple-100">
                PRO
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">GovProcure AI Agent</div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        {/* Main Section */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-2">
            Main Navigation
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-[#7C6BC4] text-white shadow-md shadow-[#7C6BC4]/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>

            {isOfficer ? (
              <>
                <button
                  onClick={() => onSelectTab('upload-nit')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'upload-nit'
                      ? 'bg-[#7C6BC4] text-white shadow-md shadow-[#7C6BC4]/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <UploadCloud className="w-4 h-4 shrink-0" />
                  <span>Upload & Review NIT</span>
                </button>

                <button
                  onClick={() => onSelectTab('tenders')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'tenders'
                      ? 'bg-[#7C6BC4] text-white shadow-md shadow-[#7C6BC4]/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Tender Management</span>
                </button>

                <button
                  onClick={() => onSelectTab('evaluation')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'evaluation'
                      ? 'bg-[#7C6BC4] text-white shadow-md shadow-[#7C6BC4]/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 shrink-0" />
                  <span>Evaluation & Ranking</span>
                </button>

                <button
                  onClick={() => onSelectTab('audit-log')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'audit-log'
                      ? 'bg-[#7C6BC4] text-white shadow-md shadow-[#7C6BC4]/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <History className="w-4 h-4 shrink-0" />
                  <span>Audit Trail</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onSelectTab('vendor-profile')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'vendor-profile'
                      ? 'bg-[#7C6BC4] text-white shadow-md shadow-[#7C6BC4]/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Profile Builder Wizard</span>
                </button>

                <button
                  onClick={() => onSelectTab('doc-verify')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'doc-verify'
                      ? 'bg-[#7C6BC4] text-white shadow-md shadow-[#7C6BC4]/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Document Verification</span>
                </button>

                <button
                  onClick={() => onSelectTab('tender-discovery')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'tender-discovery'
                      ? 'bg-[#7C6BC4] text-white shadow-md shadow-[#7C6BC4]/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Tender Discovery</span>
                </button>

                <button
                  onClick={() => onSelectTab('my-applications')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'my-applications'
                      ? 'bg-[#7C6BC4] text-white shadow-md shadow-[#7C6BC4]/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Award className="w-4 h-4 shrink-0" />
                  <span>My Applications</span>
                </button>
              </>
            )}

            <button
              onClick={() => onSelectTab('clarifications')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'clarifications'
                  ? 'bg-[#7C6BC4] text-white shadow-md shadow-[#7C6BC4]/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MessageSquareText className="w-4 h-4 shrink-0" />
              <span>Clarifications Inbox</span>
            </button>
          </nav>
        </div>

        {/* TENDER CATEGORIES - Collapsible Group */}
        <div>
          <button
            onClick={() => setCategoriesOpen(!categoriesOpen)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-2 hover:text-slate-600 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#7C6BC4]" />
              Tender Categories
            </span>
            {categoriesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {categoriesOpen && (
            <div className="space-y-1 pl-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <div
                    key={cat.name}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-purple-50 text-[#7C6BC4] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <button
                      onClick={() => onSelectCategory(cat.name)}
                      className="flex-1 text-left flex items-center gap-2 truncate"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#7C6BC4]' : 'bg-slate-300'}`} />
                      <span className="truncate">{cat.name}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRulebook(cat.name);
                      }}
                      className="text-[10px] text-slate-400 hover:text-[#7C6BC4] px-1.5 py-0.5 rounded-md hover:bg-white/80 transition-colors"
                      title={`View ${cat.name} Rulebook`}
                    >
                      Rulebook
                    </button>
                  </div>
                );
              })}

              <button
                onClick={() => onSelectCategory('All')}
                className={`w-full text-left px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  selectedCategory === 'All' ? 'text-[#7C6BC4] font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Show All Categories
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Role / Mode Badge */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-100">
          <img
            src={currentUser?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120"}
            alt="Avatar"
            className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-800 truncate">
              {currentUser?.name || "Rajesh Sharma"}
            </div>
            <div className="text-[10px] text-slate-500 font-medium capitalize flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isOfficer ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
              {isOfficer ? 'Govt Officer' : 'Vendor Portal'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
