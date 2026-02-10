
import React, { useState } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { PiggyBank, ArrowLeft, AlertCircle } from 'lucide-react';

interface AddGoalProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AddGoal: React.FC<AddGoalProps> = ({ onBack, onSuccess }) => {
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accounts = useLiveQuery(() => db.accounts.toArray());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Goal name is required");
    const amountNum = parseFloat(totalAmount);
    if (isNaN(amountNum) || amountNum <= 0) return setError("Target amount must be greater than zero");
    if (!targetDate) return setError("Target date is required");
    if (!accountId) return setError("Please link a bank account");

    setIsSubmitting(true);
    try {
      await db.goals.add({
        name: name.trim(),
        totalAmount: amountNum,
        targetDate: new Date(targetDate).toISOString(),
        accountId: parseInt(accountId),
        createdAt: new Date().toISOString(),
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Failed to create goal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-6 max-w-xl mx-auto">
      <button onClick={onBack} className="flex items-center text-pink-500 font-bold mb-6 hover:opacity-80 transition-opacity">
        <ArrowLeft size={20} className="mr-1" />
        Back
      </button>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-50">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-pink-100 rounded-2xl mr-4">
            <PiggyBank className="text-pink-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">New Savings Goal</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center text-red-600 text-sm animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">What are you saving for?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., New Laptop, Vacation"
              className="w-full p-4 rounded-2xl border border-pink-100 bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Target Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 font-bold">₱</span>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 pl-9 rounded-2xl border border-pink-100 bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-pink-500 outline-none"
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-4 rounded-2xl border border-pink-100 bg-white text-gray-800 focus:ring-2 focus:ring-pink-500 outline-none min-h-[56px] appearance-none"
                style={{ colorScheme: 'light' }}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Linked Bank Account</label>
            <div className="relative">
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full p-4 rounded-2xl border border-pink-100 bg-white text-gray-800 focus:ring-2 focus:ring-pink-500 outline-none appearance-none cursor-pointer"
                required
              >
                <option value="" className="text-gray-400 bg-white">Select an account</option>
                {accounts?.map((acc) => (
                  <option key={acc.id} value={acc.id} className="text-gray-800 bg-white">
                    {acc.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-pink-500 text-white font-black p-5 rounded-2xl shadow-lg shadow-pink-200 active:scale-95 transition-all mt-4 disabled:bg-pink-300"
          >
            {isSubmitting ? 'Creating Goal...' : 'Create Savings Goal'}
          </button>
        </form>
      </div>
    </div>
  );
};
