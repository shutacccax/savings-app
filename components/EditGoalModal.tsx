import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { X, AlertCircle, Coins } from 'lucide-react';
import { auth } from '../firebase/config';
import { fsUpdateGoal } from '../firebase/firestoreService';
import { Goal, Denomination } from '../types';

const PHIL_DENOMINATIONS = [1, 5, 10, 20, 50, 100, 200, 500, 1000];

interface EditGoalModalProps {
  goal: Goal;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const EditGoalModal: React.FC<EditGoalModalProps> = ({ goal, onClose, onSuccess }) => {
  const [name, setName] = useState(goal.name);
  const [emoji, setEmoji] = useState(goal.emoji || '🎯');
  const [totalAmount, setTotalAmount] = useState(goal.totalAmount.toString());
  const [targetDate, setTargetDate] = useState(new Date(goal.targetDate).toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(goal.accountId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Challenge specific state
  const [challengeQtys, setChallengeQtys] = useState<Record<number, string>>(() => {
    const qtys: Record<number, string> = PHIL_DENOMINATIONS.reduce((acc, val) => ({ ...acc, [val]: '' }), {});
    goal.denominations?.forEach(d => {
      qtys[d.value] = d.targetQty.toString();
    });
    return qtys;
  });

  const accounts = useLiveQuery(() => db.accounts.toArray());

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
    if (!uid || !goal.id) return;

    let finalTotal = 0;
    let denoms: Denomination[] = [];

    if (goal.mode === 'normal') {
      finalTotal = parseFloat(totalAmount);
      if (isNaN(finalTotal) || finalTotal <= 0) return setError("Enter a valid target amount");
    } else {
      finalTotal = calculateChallengeTotal();
      if (finalTotal <= 0) return setError("Set at least one target quantity");
      
      denoms = PHIL_DENOMINATIONS.map(val => {
        const existingDenom = goal.denominations?.find(d => d.value === val);
        return {
          value: val,
          targetQty: parseInt(challengeQtys[val]) || 0,
          currentQty: existingDenom?.currentQty || 0
        };
      }).filter(d => d.targetQty > 0);
    }

    const selectedDate = new Date(targetDate);
    if (isNaN(selectedDate.getTime())) return setError("Invalid date");

    setIsSubmitting(true);
    try {
      const updates: Partial<Goal> = {
        name: name.trim(),
        emoji,
        totalAmount: finalTotal,
        targetDate: selectedDate.toISOString(),
        accountId,
        denominations: goal.mode === 'challenge' ? denoms : undefined
      };

      await fsUpdateGoal(uid, goal.id, updates);
      onSuccess('Goal updated! ✨');
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to update goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[32px] sm:rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] animate-in slide-in-from-bottom duration-300 border-t dark:border-white/[0.05]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-accent">Edit Goal</h3>
          <button onClick={onClose} className="p-2 bg-accent/5 rounded-full hover:bg-accent/10 transition-colors">
            <X size={20} className="text-accent" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-transparent rounded-2xl flex items-center text-red-600 text-xs font-bold">
            <AlertCircle size={14} className="mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
                className="w-full h-14 px-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-base font-semibold text-zinc-900 dark:text-zinc-100 focus:border-accent dark:focus:border-accent outline-none transition-all"
                required
              />
            </div>
          </div>

          {goal.mode === 'normal' ? (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Target Amount</label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent font-bold">₱</span>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full h-14 pl-8 pr-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:border-accent dark:focus:border-accent outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
               <div className="bg-accent/5 dark:bg-white/[0.02] p-4 rounded-2xl border border-accent/10">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Total Goal</span>
                  <span className="text-lg font-bold text-accent">₱ {calculateChallengeTotal().toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {PHIL_DENOMINATIONS.map(val => {
                  const qtyValue = parseInt(challengeQtys[val]) || 0;
                  const hasValue = qtyValue > 0;
                  return (
                    <div key={val} className={`p-2 rounded-2xl border transition-all duration-300 ${hasValue ? 'bg-accent/5 border-accent/40 ring-1 ring-accent/10' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-accent/40'}`}>
                      <div className={`text-[9px] font-bold uppercase mb-1 ${hasValue ? 'text-accent' : 'text-zinc-400'}`}>₱{val}</div>
                      <input
                        type="number"
                        value={challengeQtys[val]}
                        onChange={(e) => handleQtyChange(val, e.target.value)}
                        placeholder="0"
                        className={`w-full text-sm font-bold bg-transparent outline-none ${hasValue ? 'text-accent' : 'text-zinc-900 dark:text-zinc-100'}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Deadline</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:border-accent dark:focus:border-accent outline-none font-semibold transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Source Bank</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold focus:border-accent dark:focus:border-accent outline-none appearance-none transition-all"
                required
              >
                {accounts?.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-[2] bg-accent text-white font-bold h-14 rounded-2xl shadow-lg shadow-accent/20 active:scale-95 transition-all disabled:opacity-50">
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};