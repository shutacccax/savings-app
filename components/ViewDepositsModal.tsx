
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Goal, Deposit } from '../types';
import { X, Trash2, Edit3, ReceiptText } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { EditDepositModal } from './EditDepositModal';
import { ConfirmationModal } from './ConfirmationModal';
import { syncGoalCompletion } from '../utils/dbHelpers';

interface ViewDepositsModalProps {
  goal: Goal;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ViewDepositsModal: React.FC<ViewDepositsModalProps> = ({ goal, onClose, onToast }) => {
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const deposits = useLiveQuery(
    () => db.deposits.where('goalId').equals(goal.id!).reverse().sortBy('date'),
    [goal.id]
  );

  const handleDeleteDeposit = async () => {
    if (!pendingDeleteId) return;
    try {
      await db.deposits.delete(pendingDeleteId);
      await syncGoalCompletion(goal.id!);
      onToast('Deposit deleted');
      setPendingDeleteId(null);
    } catch (err) {
      console.error(err);
      onToast('Error: Failed to delete');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-pink-600">History</h3>
            <p className="text-xs text-pink-400 font-medium">{goal.name}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-pink-50 rounded-full">
            <X size={20} className="text-pink-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {!deposits ? (
            <p className="text-center text-gray-400 py-8">Loading deposits...</p>
          ) : deposits.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ReceiptText size={40} className="mx-auto mb-2 text-pink-100" />
              <p>No deposits recorded yet.</p>
            </div>
          ) : (
            deposits.map((deposit) => (
              <div key={deposit.id} className="bg-pink-50/50 border border-pink-100 rounded-2xl p-4 flex items-center justify-between group transition-all">
                <div>
                  <div className="font-bold text-gray-800">{formatCurrency(deposit.amount)}</div>
                  <div className="text-xs text-gray-500">{formatDate(deposit.date)}</div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingDeposit(deposit)}
                    className="p-2 text-gray-400 hover:text-pink-500 transition-colors"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => setPendingDeleteId(deposit.id!)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-pink-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-600 font-bold p-4 rounded-xl active:scale-95 transition-transform"
          >
            Close
          </button>
        </div>
      </div>

      {editingDeposit && (
        <EditDepositModal
          deposit={editingDeposit}
          onClose={() => setEditingDeposit(null)}
          onSuccess={(msg) => onToast(msg)}
        />
      )}

      <ConfirmationModal
        isOpen={pendingDeleteId !== null}
        title="Delete Deposit?"
        message="Are you sure you want to remove this deposit record? This will update your goal progress immediately."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteDeposit}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
};
