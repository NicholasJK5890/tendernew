import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { RulebookModal } from './components/RulebookModal';
import { LoginPage } from './views/LoginPage';
import { OfficerDashboard } from './views/OfficerDashboard';
import { OfficerUploadNit } from './views/OfficerUploadNit';
import { OfficerTenderDetail } from './views/OfficerTenderDetail';
import { OfficerTenderList } from './views/OfficerTenderList';
import { AuditLogPage } from './views/AuditLogPage';
import { ClarificationsPage } from './views/ClarificationsPage';
import { VendorDashboard } from './views/VendorDashboard';
import { VendorProfileWizard } from './views/VendorProfileWizard';
import { VendorDocVerification } from './views/VendorDocVerification';
import { VendorTenderDiscovery } from './views/VendorTenderDiscovery';
import { VendorApplications } from './views/VendorApplications';
import { User, VendorProfile, Tender, Bid, Notification } from './types';
import { api, setCurrentUserEmail, getCurrentUserEmail } from './services/api';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Navigation
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedTenderId, setSelectedTenderId] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeRulebookCategory, setActiveRulebookCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showLogin, setShowLogin] = useState<boolean>(false);

  // Load initial application data
  const loadInitialData = async () => {
    try {
      const [uList, me, tList, notifs] = await Promise.all([
        api.getUsers(),
        api.getMe(),
        api.getTenders(),
        api.getNotifications()
      ]);
      setUsers(uList);
      setCurrentUser(me);
      setTenders(tList);
      setNotifications(notifs);

      if (me.role === 'vendor') {
        const [prof, myBids] = await Promise.all([
          api.getVendorProfile(),
          api.getVendorApplications()
        ]);
        setVendorProfile(prof);
        setBids(myBids);
      }
    } catch (e) {
      console.error("Initial data load error:", e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSwitchUser = async (email: string) => {
    setCurrentUserEmail(email);
    const targetUser = users.find(u => u.email === email);
    if (targetUser) {
      setCurrentUser(targetUser);
      setCurrentTab('dashboard');
      if (targetUser.role === 'vendor') {
        const [prof, myBids] = await Promise.all([
          api.getVendorProfile(),
          api.getVendorApplications()
        ]);
        setVendorProfile(prof);
        setBids(myBids);
      }
    }
    const notifs = await api.getNotifications(targetUser?.role);
    setNotifications(notifs);
  };

  const handleSelectPersonaFromLogin = (user: User) => {
    setCurrentUserEmail(user.email);
    setCurrentUser(user);
    setShowLogin(false);
    setCurrentTab('dashboard');
    loadInitialData();
  };

  const handleSelectTender = (id: number) => {
    setSelectedTenderId(id);
    setCurrentTab('tender-detail');
  };

  const handleMarkNotificationRead = async (id: number) => {
    await api.markNotificationRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  if (showLogin || !currentUser) {
    return <LoginPage users={users} onSelectUser={handleSelectPersonaFromLogin} />;
  }

  const isOfficer = currentUser.role === 'officer';

  return (
    <div className="flex h-screen bg-[#F8F9FD] overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        currentUser={currentUser}
        onOpenRulebook={(cat) => setActiveRulebookCategory(cat)}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TopBar Header */}
        <TopBar
          currentUser={currentUser}
          users={users}
          onSwitchUser={handleSwitchUser}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onOpenRulebook={(cat) => setActiveRulebookCategory(cat)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          onQuickAction={(action) => {
            if (action === 'report') {
              window.open(`/api/tenders/1/report`, '_blank');
            }
          }}
        />

        {/* Dynamic Main View */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {/* OFFICER VIEWS */}
          {isOfficer && (
            <>
              {currentTab === 'dashboard' && (
                <OfficerDashboard
                  currentUser={currentUser}
                  tenders={tenders}
                  onSelectTender={handleSelectTender}
                  onCreateTender={() => setCurrentTab('upload-nit')}
                  onOpenRulebook={(cat) => setActiveRulebookCategory(cat)}
                  selectedCategory={selectedCategory}
                />
              )}

              {currentTab === 'upload-nit' && (
                <OfficerUploadNit
                  onTenderPublished={(newTender) => {
                    setTenders([newTender, ...tenders]);
                    setSelectedTenderId(newTender.id);
                    setCurrentTab('tender-detail');
                  }}
                  onCancel={() => setCurrentTab('dashboard')}
                />
              )}

              {currentTab === 'tenders' && (
                <OfficerTenderList
                  tenders={tenders}
                  onSelectTender={handleSelectTender}
                  onCreateTender={() => setCurrentTab('upload-nit')}
                  selectedCategory={selectedCategory}
                />
              )}

              {currentTab === 'tender-detail' && (
                <OfficerTenderDetail
                  tenderId={selectedTenderId}
                  onBack={() => setCurrentTab('dashboard')}
                  onOpenRulebook={(cat) => setActiveRulebookCategory(cat)}
                />
              )}

              {currentTab === 'evaluation' && (
                <OfficerTenderDetail
                  tenderId={1} // Default cement demo tender
                  onBack={() => setCurrentTab('dashboard')}
                  onOpenRulebook={(cat) => setActiveRulebookCategory(cat)}
                />
              )}

              {currentTab === 'audit-log' && <AuditLogPage />}

              {currentTab === 'clarifications' && <ClarificationsPage isOfficer={true} />}
            </>
          )}

          {/* VENDOR VIEWS */}
          {!isOfficer && (
            <>
              {currentTab === 'dashboard' && (
                <VendorDashboard
                  profile={vendorProfile}
                  tenders={tenders}
                  bids={bids}
                  notifications={notifications}
                  onNavigateTab={(tab) => setCurrentTab(tab)}
                  onApplyTender={(tId) => {
                    setSelectedTenderId(tId);
                    setCurrentTab('tender-discovery');
                  }}
                />
              )}

              {currentTab === 'vendor-profile' && (
                <VendorProfileWizard
                  onProfileUpdated={() => {
                    api.getVendorProfile().then(p => setVendorProfile(p));
                  }}
                />
              )}

              {currentTab === 'doc-verify' && <VendorDocVerification />}

              {currentTab === 'tender-discovery' && (
                <VendorTenderDiscovery
                  profile={vendorProfile}
                  onApplySuccess={() => {
                    api.getVendorApplications().then(b => setBids(b));
                    setCurrentTab('my-applications');
                  }}
                  selectedCategory={selectedCategory}
                />
              )}

              {currentTab === 'my-applications' && <VendorApplications />}

              {currentTab === 'clarifications' && <ClarificationsPage isOfficer={false} />}
            </>
          )}
        </main>
      </div>

      {/* Rulebook Drawer / Modal */}
      {activeRulebookCategory && (
        <RulebookModal
          category={activeRulebookCategory}
          onClose={() => setActiveRulebookCategory(null)}
        />
      )}
    </div>
  );
}

export default App;
