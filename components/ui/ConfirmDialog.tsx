'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = true,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sheet z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          >
            <div className="bg-surface rounded-2xl p-6 w-full max-w-[340px]">
              <div className="flex items-center gap-3 mb-3">
                {danger && <AlertTriangle size={22} className="text-danger" />}
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              </div>
              <p className="text-sm text-muted mb-6">{message}</p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="pressable flex-1 py-3 rounded-xl bg-surface-2 text-foreground text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`pressable flex-1 py-3 rounded-xl text-sm font-medium ${
                    danger
                      ? 'bg-danger text-white'
                      : 'bg-accent text-white'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
