
import React, { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';
import { AddGoal } from './pages/AddGoal';
import { Accounts } from './pages/Accounts';
import { Landmark, Plus, Home } from 'lucide-react';
import { db } from './db/db';

type Tab = 'dashboard' | 'accounts' | 'add-goal';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Initialize with a default account if none exist
  useEffect(() => {
    const init = async () => {
      const count = await db.accounts.count();
      if (count === 0) {
        await db.accounts.add({
          name: 'Main Savings',
          initialBalance: 0,
          createdAt: new Date().toISOString(),
        });
      }
    };
    init();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'add-goal':
        return (
          <AddGoal 
            onBack={() => setActiveTab('dashboard')} 
            onSuccess={() => setActiveTab('dashboard')} 
          />
        );
      case 'accounts':
        return <Accounts />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen pb-20 safe-bottom">
      {/* Background Decor */}
      <div className="fixed top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-pink-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-pink-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Viewport */}
      <main className="mx-auto max-w-lg">
        {renderContent()}
      </main>

      {/* Bottom Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-pink-50 px-6 py-3 safe-bottom z-40">
        <div className="max-w-lg mx-auto grid grid-cols-3 items-center">
          <div className="flex justify-center">
            <NavButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<Home size={24} />} 
              label="Home"
            />
          </div>
          
          {/* Central Action Button - Perfectly Centered */}
          <div className="flex justify-center relative -top-8">
            <button
              onClick={() => setActiveTab('add-goal')}
              className="bg-pink-500 text-white p-4 rounded-full shadow-xl shadow-pink-200 active:scale-90 transition-all border-4 border-white flex items-center justify-center"
            >
              <Plus size={28} />
            </button>
          </div>

          <div className="flex justify-center">
            <NavButton 
              active={activeTab === 'accounts'} 
              onClick={() => setActiveTab('accounts')} 
              icon={<Landmark size={24} />} 
              label="Accounts"
            />
          </div>
        </div>
      </nav>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center space-y-1 transition-all w-20 ${
      active ? 'text-pink-500 scale-110 font-bold' : 'text-gray-400'
    }`}
  >
    {icon}
    <span className="text-[10px] uppercase tracking-wider">{label}</span>
  </button>
);

export default App;
