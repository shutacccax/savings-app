import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { AlertCircle, XCircle, Coins } from 'lucide-react';
import { auth } from '../firebase/config';
import { fsAddGoal } from '../firebase/firestoreService';
import { Denomination, Goal } from '../types';

const PHIL_DENOMINATIONS = [1, 5, 10, 20, 50, 100, 200, 500, 1000];

export const AddGoal = ({ onBack, onSuccess }: { onBack: () => void, onSuccess: () => void }) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [mode, setMode] = useState<'normal' | 'challenge'>('normal');
  const [totalAmount, setTotalAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Challenge specific state
  const [challengeQtys, setChallengeQtys] = useState<Record<number, string>>(
    PHIL_DENOMINATIONS.reduce((acc, val) => ({ ...acc, [val]: '' }), {})
  );

  const accounts = useLiveQuery(() => db.accounts.toArray());
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (msg: string) => {
    setToast(null);
    setTimeout(() => setToast(msg), 10);
  };

  const calculateChallengeTotal = () => {
    return PHIL_DENOMINATIONS.reduce((sum, val) => {
      const qty = parseInt(challengeQtys[val]) || 0;
      return sum + (val * qty);
    }, 0);
  };

  const handleQtyChange = (val: number, qty: string) => {
    setChallengeQtys(prev => ({ ...prev, [val]: qty }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // 1. Basic Validations
    if (!name.trim()) return setError("Goal name is required");
    if (!accountId) return setError("Please select a bank account");
    if (!targetDate) return setError("Please select a target date");

    // 2. Date Logic
    const selectedDate = new Date(targetDate);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    if (isNaN(selectedDate.getTime())) {
      return setError("Invalid date selected");
    }

    if (selectedDate < todayDate) {
      return showToast("Deadline must be today or later! 🗓️");
    }

    let finalTotal = 0;
    let denoms: Denomination[] = [];

    if (mode === 'normal') {
      finalTotal = parseFloat(totalAmount);
      if (isNaN(finalTotal) || finalTotal <= 0) return setError("Enter a valid target amount");
    } else {
      finalTotal = calculateChallengeTotal();
      if (finalTotal <= 0) return setError("Set at least one target quantity");
      
      denoms = PHIL_DENOMINATIONS.map(val => ({
        value: val,
        targetQty: parseInt(challengeQtys[val]) || 0,
        currentQty: 0
      })).filter(d => d.targetQty > 0);
    }

    // Construct goal object carefully to avoid undefined fields
    const goalData: Goal = {
      name: name.trim(),
      emoji,
      mode,
      totalAmount: finalTotal,
      targetDate: selectedDate.toISOString(),
      accountId,
      createdAt: new Date().toISOString()
    };

    if (mode === 'challenge') {
      goalData.denominations = denoms;
    }

    setIsSubmitting(true);
    try {
      await fsAddGoal(uid, goalData);
      onSuccess();
    } catch (err) { 
      console.error("Goal Creation Error:", err);
      setError("Error creating goal. Please try again."); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="px-5 animate-in fade-in duration-500 relative">
      {toast && (
        <div className="fixed top-[var(--safe-top)] left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 min-w-[280px]">
          <XCircle size={18} className="text-accent" />
          <span className="font-bold text-sm tracking-tight">{toast}</span>
        </div>
      )}

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">New Goal</h1>
        <p className="text-sm text-zinc-400 font-medium">What's next on the list? 🌸</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-[20px]">
          <button
            type="button"
            onClick={() => setMode('normal')}
            className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all ${mode === 'normal' ? 'bg-white dark:bg-zinc-800 text-accent shadow-sm' : 'text-zinc-400'}`}
          >
            Normal Goal
          </button>
          <button
            type="button"
            onClick={() => setMode('challenge')}
            className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === 'challenge' ? 'bg-white dark:bg-zinc-800 text-accent shadow-sm' : 'text-zinc-400'}`}
          >
            <Coins size={14} /> Peso Challenge
          </button>
        </div>

        <div className="flex gap-4">
          <div className="w-20">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-2 ml-1">Icon</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.substring(0, 2))}
              className="w-full h-14 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-center text-2xl focus:border-accent dark:focus:border-accent outline-none transition-all dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-2 ml-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Vacation"
              className="w-full h-14 px-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-base font-semibold text-zinc-900 dark:text-zinc-100 focus:border-accent dark:focus:border-accent outline-none transition-all placeholder:text-zinc-400"
              required
            />
          </div>
        </div>

        {mode === 'normal' ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Target Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent font-bold">₱</span>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full h-14 pl-8 pr-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:border-accent dark:focus:border-accent outline-none transition-all placeholder:text-zinc-400"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Deadline</label>
              <input
                type="date"
                value={targetDate}
                min={today}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:border-accent dark:focus:border-accent outline-none font-semibold transition-all"
                required
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-accent/5 dark:bg-white/[0.02] p-4 rounded-2xl border border-accent/10">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Total Goal</span>
                <span className="text-lg font-bold text-accent">₱ {calculateChallengeTotal().toLocaleString()}</span>
              </div>
              <div className="mt-2 text-[10px] text-zinc-400 font-medium">Set your target quantity for each bill:</div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {PHIL_DENOMINATIONS.map(val => {
                const qtyValue = parseInt(challengeQtys[val]) || 0;
                const hasValue = qtyValue > 0;
                
                return (
                  <div 
                    key={val} 
                    className={`p-3 rounded-2xl border transition-all duration-300 shadow-sm ${
                      hasValue 
                        ? 'bg-accent/5 border-accent/40 ring-1 ring-accent/10' 
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-accent/40'
                    }`}
                  >
                    <div className={`text-[10px] font-bold uppercase mb-1 transition-colors duration-300 ${hasValue ? 'text-accent' : 'text-zinc-400'}`}>
                      ₱{val}
                    </div>
                    <input
                      type="number"
                      value={challengeQtys[val]}
                      onChange={(e) => handleQtyChange(val, e.target.value)}
                      placeholder="0"
                      className={`w-full text-base font-bold bg-transparent outline-none transition-colors duration-300 ${
                        hasValue ? 'text-accent' : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Deadline</label>
              <input
                type="date"
                value={targetDate}
                min={today}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:border-accent dark:focus:border-accent outline-none font-semibold transition-all"
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Source Bank</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full h-14 px-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold focus:border-accent dark:focus:border-accent outline-none appearance-none transition-all"
            required
          >
            <option value="">Select account...</option>
            {accounts?.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
        </div>

        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onBack} className="flex-1 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex-[2] bg-accent text-white font-bold h-14 rounded-2xl shadow-lg shadow-accent/20 active:scale-95 transition-all">
            {isSubmitting ? '...' : 'Create Goal'}
          </button>
        </div>
      </form>
    </div>
  );
};