
import React, { useState } from 'react';
import { db } from '../db/db';
import { Goal } from '../types';
import { X, AlertCircle } from 'lucide-react';
import { syncGoalCompletion } from '../utils/dbHelpers';
import { roundToTwo } from '../utils/formatters';

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
    
    const amountNum = roundToTwo(parseFloat(amount));
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Deposit amount must be greater than zero");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await db.deposits.add({
        goalId: goal.id!,
        amount: amountNum,
        date: new Date(date).toISOString(),
      });
      await syncGoalCompletion(goal.id!);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to save deposit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-pink-600">Add Deposit</h3>
          <button onClick={onClose} className="p-2 bg-pink-50 rounded-full hover:bg-pink-100 transition-colors">
            <X size={20} className="text-pink-600" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-600 text-xs">
            <AlertCircle size={14} className="mr-2 flex-shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Goal: {goal.name}</label>
            <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 font-bold">₱</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="0.00"
                className="w-full p-4 pl-9 rounded-xl border border-pink-100 bg-white text-gray-800 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-lg font-bold"
                required
                step="0.01"
                min="0.01"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-4 rounded-xl border border-pink-100 bg-white text-gray-800 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none appearance-none"
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-pink-500 text-white font-black p-4 rounded-xl shadow-lg shadow-pink-200 active:scale-95 transition-transform mt-2 disabled:bg-pink-300"
          >
            {isSubmitting ? 'Saving...' : 'Save Deposit'}
          </button>
        </form>
      </div>
    </div>
  );
};
