
import React, { useState } from 'react';
import { db } from '../db/db';
import { Deposit } from '../types';
import { X, AlertCircle } from 'lucide-react';
import { syncGoalCompletion } from '../utils/dbHelpers';
import { roundToTwo } from '../utils/formatters';

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

    const amountNum = roundToTwo(parseFloat(amount));
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Amount must be greater than zero");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await db.deposits.update(deposit.id!, {
        amount: amountNum,
        date: new Date(date).toISOString(),
      });
      await syncGoalCompletion(deposit.goalId);
      onSuccess('Deposit updated! ✨');
      onClose();
    } catch (err) {
      console.error(err);
      onSuccess('Error: Failed to update');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-pink-600">Edit Entry</h3>
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
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Amount</label>
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
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-4 rounded-xl border border-pink-100 bg-white text-gray-800 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none appearance-none"
              style={{ colorScheme: 'light' }}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-600 font-bold p-4 rounded-xl active:scale-95 transition-transform"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] bg-pink-500 text-white font-black p-4 rounded-xl shadow-lg shadow-pink-200 active:scale-95 transition-transform disabled:bg-pink-300"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
