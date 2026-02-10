import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { formatCurrency } from '../utils/formatters';
import { Landmark, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { auth } from '../firebase/config';
import { fsAddAccount, fsDeleteAccount } from '../firebase/firestoreService';

export const Accounts: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBlocker, setShowBlocker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountsData = useLiveQuery(async () => {
    const accs = await db.accounts.toArray();
    return Promise.all(accs.map(async (acc) => {
      const linkedGoals = await db.goals.where('accountId').equals(acc.id!).toArray();
      const goalIds = linkedGoals.map(g => g.id!);
      const deposits = goalIds.length > 0 ? await db.deposits.where('goalId').anyOf(goalIds).toArray() : [];
      return { ...acc, totalDeposits: deposits.reduce((sum, d) => sum + d.amount, 0) };
    }));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid;
    const cleanName = name.trim();
    if (!uid) return;
    if (!cleanName) return setError("Required");
    if (await db.accounts.where('name').equalsIgnoreCase(cleanName).first()) return setError("Exists");

    try {
      await fsAddAccount(uid, { name: cleanName, initialBalance: 0, createdAt: new Date().toISOString() });
      setName(''); setIsAdding(false); setError(null); setToast("Added!");
      setTimeout(() => setToast(null), 3000);
    } catch (err) { setError("Failed"); }
  };

  const attemptDelete = async (id: string) => {
    if (await db.goals.where('accountId').equals(id).count() > 0) return setShowBlocker(true);
    setDeleteId(id);
  };

  return (
    <div className="px-5">
      {toast && (
        <div className="fixed top-[var(--safe-top)] left-1/2 -translate-x-1/2 z-[100] bg-accent text-white px-5 py-2.5 rounded-full shadow-lg flex items-center animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="mr-2" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Banks</h1>
          <p className="text-sm text-zinc-400 font-medium">Track your sources 🏦</p>
        </div>
        <button
          onClick={() => { setIsAdding(!isAdding); setError(null); }}
          className={`p-3 rounded-full shadow-md transition-all active:scale-95 ${isAdding ? 'bg-accent text-white' : 'bg-white dark:bg-zinc-900 text-accent border border-accent/10 dark:border-white/5'}`}
        >
          <Plus size={20} className={`transition-transform duration-200 ${isAdding ? 'rotate-45' : ''}`} />
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-white/5 mb-6 space-y-4 animate-in zoom-in duration-200">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder="e.g., GCash, Savings"
              className="w-full p-4 rounded-xl border border-zinc-100 dark:border-white/[0.05] bg-zinc-50 dark:bg-white/[0.02] text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-semibold"
              autoFocus
            />
            {error && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold uppercase tracking-widest">{error}</p>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="flex-1 p-3 font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-xl">Cancel</button>
            <button type="submit" className="flex-1 bg-accent text-white font-bold p-3 rounded-xl shadow-lg shadow-accent/20">Add</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {!accountsData ? null : accountsData.length === 0 ? (
          <div className="text-center py-10 opacity-40 font-medium">No banks added yet.</div>
        ) : (
          accountsData.map((acc) => (
            <div key={acc.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 flex items-center border border-zinc-50 dark:border-white/5">
              <div className="p-3 bg-accent/10 dark:bg-accent/5 rounded-xl text-accent mr-4"><Landmark size={20} /></div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">{acc.name}</h3>
                <p className="text-[11px] font-bold text-accent opacity-60 uppercase">{formatCurrency(acc.totalDeposits)}</p>
              </div>
              <button onClick={() => attemptDelete(acc.id!)} className="p-2 text-zinc-300 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
            </div>
          ))
        )}
      </div>

      <ConfirmationModal isOpen={deleteId !== null} title="Delete?" message="Remove this bank record." confirmLabel="Delete" confirmVariant="danger" onConfirm={() => fsDeleteAccount(auth.currentUser!.uid, deleteId!).then(() => { setToast("Deleted"); setDeleteId(null); setTimeout(() => setToast(null), 3000); })} onCancel={() => setDeleteId(null)} />
      <ConfirmationModal isOpen={showBlocker} title="Blocked" message="Move active goals first." confirmLabel="Got it" showCancel={false} onConfirm={() => setShowBlocker(false)} />
    </div>
  );
};