import React from 'react';
import { Modal } from './Modal';
import { Trash2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: React.ReactNode;
  detailMessage?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message,
  detailMessage,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs border border-rose-200/80 dark:border-rose-800/60">
            <Trash2 className="w-6 h-6" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs border border-amber-200/80 dark:border-amber-800/60">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case 'primary':
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs border border-emerald-200/80 dark:border-emerald-800/60">
            <HelpCircle className="w-6 h-6" />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow active:scale-[0.98] border border-rose-700/20';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm hover:shadow active:scale-[0.98] border border-amber-700/20';
      case 'primary':
      default:
        return 'bg-[#2D5F52] hover:bg-[#1D4137] text-white shadow-sm hover:shadow active:scale-[0.98] border border-[#1D4137]/30';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3.5">
          {getIcon()}
          <div className="flex-1 space-y-1.5 pt-0.5">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-relaxed">
              {message}
            </div>
            {detailMessage && (
              <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{detailMessage}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D9E0D4] dark:border-[#2D483F]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 ${getConfirmButtonClasses()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
