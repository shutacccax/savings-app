
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
    ? "bg-red-500 hover:bg-red-600 shadow-red-100" 
    : "bg-pink-500 hover:bg-pink-600 shadow-pink-100";

  const Icon = confirmVariant === 'danger' ? AlertTriangle : Info;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${confirmVariant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-pink-50 text-pink-500'}`}>
            <Icon size={24} />
          </div>
          {showCancel && onCancel && (
            <button onClick={onCancel} className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">{message}</p>

        <div className="flex gap-3">
          {showCancel && onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 font-bold text-gray-500 bg-gray-100 rounded-2xl active:scale-95 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 font-bold text-white rounded-2xl shadow-lg active:scale-95 transition-all ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
