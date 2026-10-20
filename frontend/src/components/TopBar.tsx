import React, { useState } from 'react';
import {
  Search,
  Bell,
  SlidersHorizontal,
  Download,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronDown,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { User, Notification } from '../types';

interface TopBarProps {
  currentUser: User | null;
  users: User[];
  onSwitchUser: (email: string) => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: number) => void;
  onOpenRulebook: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onQuickAction?: (action: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  users,
  onSwitchUser,
  notifications,
  onMarkNotificationRead,
  onOpenRulebook,
  searchQuery,
  onSearchChange,
  onQuickAction
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const isOfficer = currentUser?.role === 'officer';
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-16 px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Search Bar with '/' hint matching screenshot! */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search here... (tenders, vendors, IS codes)"
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#7C6BC4]/20 focus:border-[#7C6BC4] transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
            /
          </kbd>
        </div>

        {/* Explore & News links matching screenshot */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-semibold text-slate-500">
          <button
            onClick={() => onOpenRulebook('Cement')}
            className="hover:text-slate-900 transition-colors"
          >
            Explore
          </button>
          <button
            onClick={() => onOpenRulebook('Services')}
            className="hover:text-slate-900 transition-colors"
          >
            Standards
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick action buttons matching screenshot */}
        <div className="hidden md:flex items-center gap-1.5 pr-2 border-r border-slate-200">
          <button
            onClick={() => onQuickAction?.('report')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Download latest PDF evaluation report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>
          <button
            onClick={() => onOpenRulebook('Cement')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Rulebooks</span>
          </button>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications ({unreadCount})</span>
                <span className="text-[10px] text-[#7C6BC4] font-semibold cursor-pointer">Mark all read</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">No new notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead(n.id)}
                      className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                        n.is_read ? 'bg-slate-50 text-slate-500' : 'bg-purple-50/50 text-slate-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-[#7C6BC4]">{n.title}</span>
                        {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ROLE & ACCOUNT SWITCHER PILL */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-slate-100 hover:bg-slate-200/80 transition-colors border border-slate-200/60"
          >
            <img
              src={currentUser?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120"}
              alt="Avatar"
              className="w-7 h-7 rounded-full object-cover"
            />
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block leading-tight">
                {currentUser?.name || "Rajesh Sharma"}
              </span>
              <span className="text-[10px] font-semibold text-[#7C6BC4] block leading-tight">
                {isOfficer ? "Government Officer" : "Vendor Portal"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
          </button>

          {/* Switcher Dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                Switch Demo Persona
              </div>

              {/* Quick Officer Switch */}
              <div className="text-[10px] font-semibold text-slate-500 px-2 mt-1">OFFICER ACCOUNT:</div>
              {users.filter(u => u.role === 'officer').map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    onSwitchUser(u.email);
                    setUserDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                    currentUser?.email === u.email ? 'bg-purple-50 text-[#7C6BC4] font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-[10px] text-slate-400">{u.department}</div>
                  </div>
                  {currentUser?.email === u.email && <CheckCircle2 className="w-3.5 h-3.5 text-[#7C6BC4]" />}
                </button>
              ))}

              <div className="text-[10px] font-semibold text-slate-500 px-2 mt-2 pt-2 border-t border-slate-100">
                VENDOR ACCOUNTS (SEED SCENARIOS):
              </div>
              {users.filter(u => u.role === 'vendor').map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    onSwitchUser(u.email);
                    setUserDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                    currentUser?.email === u.email ? 'bg-purple-50 text-[#7C6BC4] font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold truncate">{u.department}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {u.email.includes('vendor_b') && '✅ L1 Compliant Leader (₹365)'}
                      {u.email.includes('vendor_a') && '❌ Expired BIS (₹340)'}
                      {u.email.includes('vendor_d') && '⚠ Red Flagged Collusion (₹290)'}
                      {u.email.includes('vendor_c') && '✅ L2 Compliant (₹372)'}
                    </div>
                  </div>
                  {currentUser?.email === u.email && <CheckCircle2 className="w-3.5 h-3.5 text-[#7C6BC4]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
