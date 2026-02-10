import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { roundToTwo } from '../utils/formatters';
import { auth } from '../firebase/config';
import { fsAddDeposit } from '../firebase/firestoreService';
import { Goal } from '../types';

interface DepositModalProps {
  goal: Goal;
  onClose: () => void;
  onSuccess: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ goal, onClose, onSuccess }) => {
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const uid = auth.currentUser?.uid;
    const amountNum = roundToTwo(parseFloat(amount));
    if (!uid) return setError("User not authenticated");
    if (isNaN(amountNum) || amountNum <= 0) return setError("Amount must be greater than zero");

    setIsSubmitting(true);
    try {
      await fsAddDeposit(uid, { goalId: goal.id!, amount: amountNum, date: new Date(date).toISOString() });
      onSuccess();
      onClose();
    } catch (err) { setError("Failed to save deposit"); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[32px] sm:rounded-3xl shadow-2xl p-6 border-t dark:border-white/[0.05] animate-in slide-in-from-bottom duration-300 pb-safe-offset" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-accent">Add Deposit</h3>
          <button onClick={onClose} className="p-2 bg-accent/5 rounded-full hover:bg-accent/10 transition-colors">
            <X size={20} className="text-accent" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-transparent rounded-xl flex items-center text-red-600 text-xs">
            <AlertCircle size={14} className="mr-2" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 ml-1">{goal.name}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent font-bold">₱</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-4 pl-9 rounded-xl border border-zinc-100 dark:border-white/[0.05] bg-zinc-50 dark:bg-white/[0.02] text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-accent/10 focus:border-accent outline-none text-lg font-bold transition-all"
                required
                step="0.01"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 ml-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-4 rounded-xl border border-zinc-100 dark:border-white/[0.05] bg-zinc-50 dark:bg-white/[0.02] text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-accent/10 focus:border-accent outline-none"
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent text-white font-bold p-4 rounded-xl shadow-lg shadow-accent/20 active:scale-[0.98] transition-all mt-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Deposit'}
          </button>
          {/* Safe area spacer for bottom modals */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </form>
      </div>
    </div>
  );
};