import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { PiggyBank, Sparkles, AlertCircle, Calendar, Wallet, Hash } from 'lucide-react';
import { auth } from '../firebase/config';
import { fsAddGoal } from '../firebase/firestoreService';

export const AddGoal = ({ onBack, onSuccess }: { onBack: () => void, onSuccess: () => void }) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [totalAmount, setTotalAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accounts = useLiveQuery(() => db.accounts.toArray());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const uid = auth.currentUser?.uid;
    const amountNum = parseFloat(totalAmount);
    if (!uid) return;
    if (isNaN(amountNum) || amountNum <= 0) return setError("Enter amount");
    if (!targetDate || !accountId) return setError("Missing fields");

    setIsSubmitting(true);
    try {
      await fsAddGoal(uid, { name: name.trim(), emoji, totalAmount: amountNum, targetDate: new Date(targetDate).toISOString(), accountId, createdAt: new Date().toISOString() });
      onSuccess();
    } catch (err) { setError("Error creating goal"); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="px-5 animate-in fade-in duration-500 pb-safe-offset">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">New Goal</h1>
        <p className="text-sm text-zinc-400 font-medium">What's next on the list? 🌸</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="flex gap-4">
          <div className="w-20">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-2 ml-1">Icon</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.substring(0, 2))}
              className="w-full h-14 rounded-xl border border-zinc-100 dark:border-white/[0.05] bg-white dark:bg-zinc-900 text-center text-2xl focus:border-accent outline-none transition-all dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-2 ml-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Vacation"
              className="w-full h-14 px-4 rounded-xl border border-zinc-100 dark:border-white/[0.05] bg-white dark:bg-zinc-900 text-base font-semibold text-zinc-800 dark:text-zinc-100 focus:border-accent outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Target</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent font-bold">₱</span>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full h-14 pl-8 pr-4 rounded-xl border border-zinc-100 dark:border-white/[0.05] bg-white dark:bg-zinc-900 text-sm font-bold text-zinc-800 dark:text-zinc-100 focus:border-accent outline-none"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Deadline</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full h-14 px-4 rounded-xl border border-zinc-100 dark:border-white/[0.05] bg-white dark:bg-zinc-900 text-sm font-semibold text-zinc-800 dark:text-zinc-100 focus:border-accent outline-none"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Source Bank</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full h-14 px-4 rounded-xl border border-zinc-100 dark:border-white/[0.05] bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 font-semibold focus:border-accent outline-none appearance-none"
            required
          >
            <option value="">Select account...</option>
            {accounts?.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
        </div>

        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onBack} className="flex-1 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex-[2] bg-accent text-white font-bold h-14 rounded-xl shadow-lg shadow-accent/20 active:scale-95 transition-all">
            {isSubmitting ? '...' : 'Create Goal'}
          </button>
        </div>
      </form>
    </div>
  );
};