import React from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'primary';
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmVariant = 'primary',
  showCancel = true,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const confirmClasses = confirmVariant === 'danger' 
    ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" 
    : "bg-accent hover:opacity-90 shadow-accent/20";

  const Icon = confirmVariant === 'danger' ? AlertTriangle : Info;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-200 border border-accent/10 dark:border-accent/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div className={`p-4 rounded-2xl ${confirmVariant === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-accent/10 text-accent'}`}>
            <Icon size={28} />
          </div>
          {showCancel && onCancel && (
            <button onClick={onCancel} className="p-2 text-gray-400 hover:bg-accent/5 rounded-full transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
        
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">{message}</p>

        <div className="flex gap-3">
          {showCancel && onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-4 font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 rounded-2xl active:scale-95 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-4 font-bold text-white rounded-2xl shadow-lg active:scale-95 transition-all ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};