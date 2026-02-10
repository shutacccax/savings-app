
import React, { useState } from 'react';
import { Moon, Sun, Palette, CheckCircle2, Heart, Trash2, AlertTriangle } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { auth } from '../firebase/config';
import { fsHardReset } from '../firebase/firestoreService';
import { deleteUserAccount } from '../firebase/authService';

interface SettingsProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  accentKey: string;
  setAccentKey: (val: string) => void;
  accentColors: any;
}

export const Settings: React.FC<SettingsProps> = ({ 
  darkMode, 
  setDarkMode, 
  accentKey, 
  setAccentKey, 
  accentColors 
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setIsDeleting(true);
    try {
      // 1. Wipe Firestore Data first
      await fsHardReset(uid);
      // 2. Delete Auth User Profile
      await deleteUserAccount();
      // Application state will automatically reset via subscribeToAuthChanges in App.tsx
    } catch (err: any) {
      console.error("Deletion failed:", err);
      // Fallback: Just log them out if auth deletion requires re-auth
      if (err.code === 'auth/requires-recent-login') {
        alert("Please log out and log back in to verify your identity before deleting your account.");
      } else {
        alert("Something went wrong. Please try again later.");
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="px-5 max-w-2xl mx-auto animate-in fade-in duration-500 pb-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-accent tracking-tight">Settings</h1>
        <p className="text-zinc-400 text-sm font-medium">Make Savr yours 🎨</p>
      </header>

      <div className="space-y-6">
        {/* Appearance Section */}
        <section className="bg-white dark:bg-white/[0.02] rounded-2xl p-6 shadow-sm border border-accent/10 dark:border-transparent">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-accent/10 rounded-xl text-accent">
              <Sun size={20} className="dark:hidden" />
              <Moon size={20} className="hidden dark:block" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Appearance</h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-accent/5 dark:bg-white/[0.03] rounded-2xl">
            <div>
              <p className="font-bold text-gray-800 dark:text-gray-200">Dark Mode</p>
              <p className="text-xs text-zinc-500">Easier on the eyes at night</p>
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`w-14 h-8 rounded-full transition-all relative ${darkMode ? 'bg-accent' : 'bg-gray-200 dark:bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${darkMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </section>

        {/* Accent Color Section */}
        <section className="bg-white dark:bg-white/[0.02] rounded-2xl p-6 shadow-sm border border-accent/10 dark:border-transparent">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-accent/10 rounded-xl text-accent">
              <Palette size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Accent Color</h2>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {Object.keys(accentColors).map((key) => (
              <button
                key={key}
                onClick={() => setAccentKey(key)}
                className={`aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-90 border-4 ${
                  accentKey === key ? 'border-accent scale-110 shadow-lg' : 'border-transparent'
                }`}
                style={{ backgroundColor: accentColors[key].main }}
              >
                {accentKey === key && <CheckCircle2 size={24} className="text-white" />}
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] font-bold text-zinc-400 mt-4 uppercase tracking-widest">
            Currently: {accentKey}
          </p>
        </section>

        {/* Danger Zone Section */}
        <section className="bg-red-50/50 dark:bg-red-950/10 rounded-2xl p-6 shadow-sm border border-red-100 dark:border-red-900/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-500">
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-lg font-bold text-red-600 dark:text-red-500">Danger Zone</h2>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-red-100 dark:border-red-900/20">
            <div className="mb-4">
              <p className="font-bold text-gray-800 dark:text-gray-200">Permanently Delete Account</p>
              <p className="text-xs text-zinc-500">This will wipe all your goals, banks, and deposits. This action cannot be undone.</p>
            </div>
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full h-12 rounded-2xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-red-500/20"
            >
              <Trash2 size={18} />
              Delete Account
            </button>
          </div>
        </section>

        {/* About Section */}
        <section className="text-center py-8">
          <div className="flex items-center justify-center gap-2 text-accent/40 font-bold text-sm">
            <span>Savr v2.5</span>
            <div className="w-1 h-1 bg-accent/20 rounded-full" />
            <span>Handcrafted with</span>
            <Heart size={14} className="fill-accent text-accent" />
          </div>
        </section>
      </div>

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        title="Are you absolutely sure?"
        message="Permanently deleting your account will remove all your data from our servers. You will lose access to all tracked goals and history. There is no way to recover your information."
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        confirmVariant="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
