
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { formatCurrency } from '../utils/formatters';
import { Landmark, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const Accounts: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showBlocker, setShowBlocker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const accountsData = useLiveQuery(async () => {
    const accs = await db.accounts.toArray();
    return Promise.all(accs.map(async (acc) => {
      const linkedGoals = await db.goals.where('accountId').equals(acc.id!).toArray();
      const goalIds = linkedGoals.map(g => g.id!);
      let totalDeposits = 0;
      if (goalIds.length > 0) {
        const deposits = await db.deposits.where('goalId').anyOf(goalIds).toArray();
        totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);
      }
      return { ...acc, totalDeposits };
    }));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Account name cannot be empty");
      return;
    }

    // Check for duplicates
    const existing = await db.accounts.where('name').equalsIgnoreCase(cleanName).first();
    if (existing) {
      setError("An account with this name already exists");
      return;
    }

    try {
      await db.accounts.add({
        name: cleanName,
        initialBalance: 0,
        createdAt: new Date().toISOString()
      });
      setName('');
      setIsAdding(false);
      setError(null);
      setToast("Account added!");
    } catch (err) {
      console.error(err);
      setError("Failed to add account");
    }
  };

  const attemptDelete = async (id: number) => {
    const linkedGoalsCount = await db.goals.where('accountId').equals(Number(id)).count();
    
    if (linkedGoalsCount > 0) {
      setShowBlocker(true);
      return;
    }

    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await db.accounts.delete(deleteId);
      setToast("Account deleted.");
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete account:", err);
      setToast("Error: Deletion failed");
    }
  };

  return (
    <div className="px-4 pb-24 pt-6 max-w-2xl mx-auto">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-pink-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={18} className="mr-2" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-pink-600">Accounts</h1>
          <p className="text-pink-400">Where your money lives 🏦</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setError(null);
          }}
          className={`p-3 rounded-2xl shadow-sm border transition-all ${isAdding ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-pink-500 border-pink-50'}`}
        >
          <Plus size={24} className={`transition-transform duration-300 ${isAdding ? 'rotate-45' : ''}`} />
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white rounded-3xl p-6 shadow-sm border border-pink-50 mb-6 space-y-4 animate-in fade-in zoom-in duration-200">
          <h2 className="font-bold text-gray-800">Add Bank Account</h2>
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Account Name (e.g., GCash, BPI)"
              className={`w-full p-4 rounded-xl border bg-white text-gray-800 outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-500' : 'border-pink-100 focus:ring-pink-500'}`}
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{error}</p>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setError(null);
              }}
              className="flex-1 p-3 font-bold text-gray-500 bg-gray-50 rounded-xl active:scale-95 transition-transform"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 bg-pink-500 text-white font-bold p-3 px-8 rounded-xl active:scale-95 transition-transform"
            >
              Add
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {!accountsData ? (
          <div className="text-center py-12 text-pink-300">Loading accounts...</div>
        ) : accountsData.length === 0 ? (
          <div className="text-center py-12 bg-white/50 rounded-3xl border border-dashed border-pink-200">
            <AlertCircle className="mx-auto text-pink-200 mb-2" />
            <p className="text-gray-400">No accounts yet. Click + to add one.</p>
          </div>
        ) : (
          accountsData.map((acc) => (
            <div key={acc.id} className="bg-white rounded-3xl p-5 flex items-center shadow-sm border border-pink-50 transition-all hover:border-pink-200">
              <div className="p-4 bg-pink-100 rounded-2xl text-pink-500 mr-4">
                <Landmark size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{acc.name}</h3>
                <p className="text-sm font-semibold text-pink-400">
                  Total Saved: {formatCurrency(acc.totalDeposits)}
                </p>
              </div>
              <button 
                onClick={() => attemptDelete(acc.id!)}
                className="p-3 text-gray-300 hover:text-red-400 active:scale-90 transition-all"
                title="Delete Account"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteId !== null}
        title="Delete Account?"
        message="If you delete this account, goals linked to it must be reassigned or removed first. This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmationModal
        isOpen={showBlocker}
        title="Cannot Delete"
        message="This account has active goals. Please reassign or delete those goals first to maintain your records."
        confirmLabel="OK"
        confirmVariant="primary"
        showCancel={false}
        onConfirm={() => setShowBlocker(false)}
      />
    </div>
  );
};
