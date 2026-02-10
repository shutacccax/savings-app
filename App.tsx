import React, { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';
import { AddGoal } from './pages/AddGoal';
import { Accounts } from './pages/Accounts';
import { Settings } from './pages/Settings';
import { Auth } from './components/Auth';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Landmark, Plus, Home, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { subscribeToAuthChanges, logout } from './firebase/authService';
import { startRealtimeSync } from './firebase/firestoreService';
import { migrateDexieToFirestore } from './firebase/migration';

type Tab = 'dashboard' | 'accounts' | 'add-goal' | 'settings';

const ACCENT_COLORS = {
  pink: { main: '#ec4899', soft: '#fdf2f8' },
  blue: { main: '#3b82f6', soft: '#eff6ff' },
  purple: { main: '#a855f7', soft: '#faf5ff' },
  green: { main: '#10b981', soft: '#ecfdf5' },
  orange: { main: '#f97316', soft: '#fff7ed' },
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('savr_dark') === 'true');
  const [accentKey, setAccentKey] = useState(() => localStorage.getItem('savr_accent') || 'pink');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('savr_dark', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    const colors = ACCENT_COLORS[accentKey as keyof typeof ACCENT_COLORS] || ACCENT_COLORS.pink;
    document.documentElement.style.setProperty('--accent', colors.main);
    document.documentElement.style.setProperty('--accent-soft', darkMode ? `${colors.main}15` : colors.soft);
    localStorage.setItem('savr_accent', accentKey);
  }, [accentKey, darkMode]);

  useEffect(() => {
    let stopSync: (() => void) | null = null;
    const unsubAuth = subscribeToAuthChanges(async (user) => {
      if (stopSync) stopSync();
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        try {
          await migrateDexieToFirestore(user.uid);
          stopSync = startRealtimeSync(user.uid);
        } catch (err) { console.error(err); }
      }
    });
    return () => unsubAuth();
  }, []);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!currentUser) return <Auth />;

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200 safe-top-padding">
      <main className="mx-auto w-full max-w-lg flex-1 pb-32 pt-4 px-1">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'accounts' && <Accounts />}
        {activeTab === 'add-goal' && <AddGoal onBack={() => setActiveTab('dashboard')} onSuccess={() => setActiveTab('dashboard')} />}
        {activeTab === 'settings' && <Settings darkMode={darkMode} setDarkMode={setDarkMode} accentKey={accentKey} setAccentKey={setAccentKey} accentColors={ACCENT_COLORS} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-zinc-100 dark:border-white/[0.05] px-6 z-40 safe-bottom-padding">
        <div className="max-w-lg mx-auto flex justify-between items-center h-20">
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Home size={22} />} label="Home" />
          <NavButton active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} icon={<Landmark size={22} />} label="Banks" />
          
          <div className="relative -top-4">
            <button
              onClick={() => setActiveTab('add-goal')}
              className={`bg-accent text-white p-4 rounded-full shadow-lg shadow-accent/20 active:scale-90 transition-all border-4 border-white dark:border-zinc-950 flex items-center justify-center ${activeTab === 'add-goal' ? 'rotate-45' : ''}`}
            >
              <Plus size={24} />
            </button>
          </div>

          <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={22} />} label="Theme" />
          
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex flex-col items-center justify-center space-y-1 text-zinc-400 dark:text-zinc-600 hover:text-red-400 transition-colors"
          >
            <LogOut size={22} />
            <span className="text-[10px] uppercase tracking-wider font-semibold">Logout</span>
          </button>
        </div>
      </nav>

      <ConfirmationModal 
        isOpen={isLogoutModalOpen} 
        title="Logout?" 
        message="Are you sure you want to sign out of Savr?" 
        confirmLabel="Logout" 
        confirmVariant="danger"
        onConfirm={() => {
          logout();
          setIsLogoutModalOpen(false);
        }}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center space-y-1 transition-all ${active ? 'text-accent' : 'text-zinc-400 dark:text-zinc-600 hover:text-accent/60'}`}
  >
    {icon}
    <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
  </button>
);

export default App;