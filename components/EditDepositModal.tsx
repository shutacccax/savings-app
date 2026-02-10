import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { roundToTwo } from '../utils/formatters';
import { auth } from '../firebase/config';
import { fsUpdateDeposit } from '../firebase/firestoreService';
import { Deposit } from '../types';

interface EditDepositModalProps {
  deposit: Deposit;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const EditDepositModal: React.FC<EditDepositModalProps> = ({ deposit, onClose, onSuccess }) => {
  const [amount, setAmount] = useState<string>(deposit.amount.toString());
  const [date, setDate] = useState<string>(new Date(deposit.date).toISOString().split('T')[0]);
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
      await fsUpdateDeposit(uid, deposit.id!, { amount: amountNum, date: new Date(date).toISOString() });
      onSuccess('Deposit updated! ✨');
      onClose();
    } catch (err) { onSuccess('Error: Failed to update'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-accent">Edit Entry</h3>
          <button onClick={onClose} className="p-2 bg-accent/5 rounded-full hover:bg-accent/10 transition-colors">
            <X size={20} className="text-accent" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center text-red-600 text-xs">
            <AlertCircle size={14} className="mr-2" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent font-bold">₱</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-4 pl-9 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-lg font-bold"
                required
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold p-4 rounded-xl active:scale-[0.98] transition-all">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-[2] bg-accent text-white font-bold p-4 rounded-xl shadow-lg shadow-accent/20 active:scale-[0.98] transition-all disabled:opacity-50">
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};