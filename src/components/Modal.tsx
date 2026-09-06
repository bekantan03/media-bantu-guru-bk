import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const widthMap: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  const widthClass = widthMap[maxWidth] || (maxWidth.startsWith('max-w-') ? maxWidth : 'max-w-lg');

  // PENTING: modal di-render lewat Portal langsung ke document.body.
  // Ini mencegah modal "terjebak" di dalam parent manapun yang punya
  // CSS transform/filter/backdrop-filter (mis. header dengan backdrop-blur),
  // karena properti itu membuat containing block baru yang merusak
  // perilaku position:fixed pada descendant-nya.
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 py-4 sm:py-8 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#21322C]/60 dark:bg-black/70"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative w-full ${widthClass} bg-white dark:bg-[#152721] rounded-2xl shadow-2xl border border-[#D9E0D4] dark:border-[#2D483F] overflow-hidden my-auto sm:my-8 z-10`}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#D9E0D4] dark:border-[#2D483F] flex items-center justify-between bg-[#EFF2EA]/70 dark:bg-[#10201B]">
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#1D4137] dark:text-[#6EE7B7]">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#647169] dark:text-gray-300 hover:text-[#21322C] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Tutup"
                aria-label="Tutup Dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 max-h-[80vh] sm:max-h-[75vh] overflow-y-auto">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[#EFF2EA]/40 dark:bg-[#10201B]/80 border-t border-[#D9E0D4] dark:border-[#2D483F] flex items-center justify-end flex-wrap sm:flex-nowrap gap-2">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};