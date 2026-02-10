import React from 'react';
import { Moon, Sun, Palette, CheckCircle2, Heart } from 'lucide-react';

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
  return (
    <div className="px-5 max-w-2xl mx-auto animate-in fade-in duration-500">
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
    </div>
  );
};