
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Goal, Deposit } from '../types';
import { X, Trash2, Edit3, ReceiptText } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { EditDepositModal } from './EditDepositModal';
import { ConfirmationModal } from './ConfirmationModal';
import { auth } from '../firebase/config';
import { fsDeleteDeposit } from '../firebase/firestoreService';

interface ViewDepositsModalProps {
  goal: Goal;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ViewDepositsModal: React.FC<ViewDepositsModalProps> = ({ goal, onClose, onToast }) => {
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const deposits = useLiveQuery(
    () => db.deposits.where('goalId').equals(goal.id!).reverse().sortBy('date'),
    [goal.id]
  );

  const handleDeleteDeposit = async () => {
    const uid = auth.currentUser?.uid;
    if (!pendingDeleteId || !uid) return;
    try {
      await fsDeleteDeposit(uid, pendingDeleteId);
      onToast('Deposit deleted');
      setPendingDeleteId(null);
    } catch (err) { onToast('Error deleting entry'); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[32px] sm:rounded-3xl shadow-2xl p-6 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 pb-safe" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-accent">History</h3>
            <p className="text-xs text-zinc-400 font-medium">{goal.name}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-accent/5 rounded-full text-accent">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {!deposits ? (
            <p className="text-center text-zinc-400 py-8">Loading history...</p>
          ) : deposits.length === 0 ? (
            <div className="text-center py-12 text-zinc-300 dark:text-zinc-600">
              <ReceiptText size={40} className="mx-auto mb-2 opacity-50" />
              <p className="font-medium">No deposits recorded yet.</p>
            </div>
          ) : (
            deposits.map((deposit) => (
              <div key={deposit.id} className="bg-accent/5 dark:bg-accent/5 border border-accent/5 dark:border-accent/10 rounded-2xl p-4 flex items-center justify-between group">
                <div>
                  <div className="font-bold text-zinc-800 dark:text-zinc-100">{formatCurrency(deposit.amount)}</div>
                  {goal.mode === 'challenge' && deposit.denominationValue && (
                    <div className="text-[10px] font-bold text-accent/60 uppercase">
                      ₱{deposit.denominationValue} x {deposit.quantity}
                    </div>
                  )}
                  <div className="text-[11px] text-zinc-400">{formatDate(deposit.date)}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditingDeposit(deposit)} className="p-2 text-zinc-400 hover:text-accent transition-colors"><Edit3 size={18} /></button>
                  <button onClick={() => setPendingDeleteId(deposit.id!)} className="p-2 text-zinc-400 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-50 dark:border-zinc-800">
          <button onClick={onClose} className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold p-4 rounded-2xl active:scale-[0.98] transition-all">
            Close
          </button>
        </div>
      </div>

      {editingDeposit && (
        <EditDepositModal 
          deposit={editingDeposit} 
          goal={goal} 
          onClose={() => setEditingDeposit(null)} 
          onSuccess={onToast} 
        />
      )}
      <ConfirmationModal isOpen={pendingDeleteId !== null} title="Delete Deposit?" message="Remove this record? Your progress will update." confirmLabel="Delete" confirmVariant="danger" onConfirm={handleDeleteDeposit} onCancel={() => setPendingDeleteId(null)} />
    </div>
  );
};
