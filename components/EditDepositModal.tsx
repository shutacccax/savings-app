
import React, { useState } from 'react';
import { X, AlertCircle, Plus, Minus } from 'lucide-react';
import { roundToTwo } from '../utils/formatters';
import { auth } from '../firebase/config';
import { fsUpdateDeposit } from '../firebase/firestoreService';
import { Deposit, Goal } from '../types';

interface EditDepositModalProps {
  deposit: Deposit;
  goal: Goal;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const EditDepositModal: React.FC<EditDepositModalProps> = ({ deposit, goal, onClose, onSuccess }) => {
  const [amount, setAmount] = useState<string>(deposit.amount.toString());
  const [date, setDate] = useState<string>(new Date(deposit.date).toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Challenge mode state
  const [selectedDenom, setSelectedDenom] = useState<number | null>(
    goal.mode === 'challenge' ? (deposit.denominationValue || goal.denominations?.[0]?.value || null) : null
  );
  const [qty, setQty] = useState(deposit.quantity || 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const uid = auth.currentUser?.uid;
    if (!uid) return setError("User not authenticated");

    let finalAmount = 0;
    let updates: Partial<Deposit> = { date: new Date(date).toISOString() };

    if (goal.mode === 'challenge') {
      if (!selectedDenom) return setError("Select a denomination");
      finalAmount = selectedDenom * qty;
      updates.amount = finalAmount;
      updates.denominationValue = selectedDenom;
      updates.quantity = qty;
    } else {
      finalAmount = roundToTwo(parseFloat(amount));
      if (isNaN(finalAmount) || finalAmount <= 0) return setError("Amount must be greater than zero");
      updates.amount = finalAmount;
    }

    setIsSubmitting(true);
    try {
      await fsUpdateDeposit(uid, deposit.id!, updates);
      onSuccess('Deposit updated! ✨');
      onClose();
    } catch (err) { onSuccess('Error: Failed to update'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[32px] sm:rounded-3xl shadow-2xl p-6 border-t dark:border-white/[0.05] animate-in slide-in-from-bottom duration-300 pb-safe" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-accent">Edit Entry</h3>
          <button onClick={onClose} className="p-2 bg-accent/5 rounded-full hover:bg-accent/10 transition-colors">
            <X size={20} className="text-accent" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center text-red-600 text-xs">
            <AlertCircle size={14} className="mr-2" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {goal.mode === 'normal' ? (
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent font-bold">₱</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-14 p-4 pl-9 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:border-accent dark:focus:border-accent outline-none text-lg font-bold transition-all placeholder:text-zinc-400"
                  required
                  step="0.01"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 ml-1">Select Denomination</label>
                <div className="grid grid-cols-3 gap-2">
                  {goal.denominations?.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setSelectedDenom(d.value)}
                      className={`py-3 px-2 rounded-2xl text-xs font-bold border transition-all ${
                        selectedDenom === d.value 
                          ? 'bg-accent text-white border-accent shadow-md' 
                          : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-accent/40'
                      }`}
                    >
                      ₱{d.value}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 ml-1">Quantity</label>
                <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="p-3 bg-white dark:bg-zinc-800 rounded-2xl text-accent shadow-sm active:scale-90 transition-all border border-zinc-100 dark:border-zinc-700"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{qty}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Bills</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQty(qty + 1)}
                    className="p-3 bg-white dark:bg-zinc-800 rounded-2xl text-accent shadow-sm active:scale-90 transition-all border border-zinc-100 dark:border-zinc-700"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {selectedDenom && (
                <div className="p-3 bg-accent/5 rounded-2xl border border-accent/10 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Saving Total</span>
                  <span className="font-bold text-accent">₱ {(selectedDenom * qty).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-14 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:border-accent dark:focus:border-accent outline-none font-semibold transition-all"
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold p-4 rounded-2xl active:scale-[0.98] transition-all">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-[2] bg-accent text-white font-bold p-4 rounded-2xl shadow-lg shadow-accent/20 active:scale-[0.98] transition-all disabled:opacity-50">
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
