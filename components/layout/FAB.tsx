'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ListTodo, Receipt, Flame } from 'lucide-react';
import { haptic } from '@/lib/utils';

interface FABProps {
  onAddTask: () => void;
  onLogExpense: () => void;
  onLogAddiction: () => void;
}

const ACTIONS = [
  { label: 'Add Task', Icon: ListTodo, key: 'task' },
  { label: 'Log Expense', Icon: Receipt, key: 'expense' },
  { label: 'Log Addiction', Icon: Flame, key: 'addiction' },
];

export function FAB({ onAddTask, onLogExpense, onLogAddiction }: FABProps) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    haptic();
    setOpen((v) => !v);
  };

  const handleAction = (key: string) => {
    haptic();
    setOpen(false);
    if (key === 'task') onAddTask();
    else if (key === 'expense') onLogExpense();
    else if (key === 'addiction') onLogAddiction();
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-30"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-20 right-4 z-40 flex flex-col-reverse items-end gap-3 max-w-[480px]">
        <AnimatePresence>
          {open &&
            ACTIONS.map(({ label, Icon, key }, i) => (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleAction(key)}
                className="pressable flex items-center gap-3 bg-surface-2 rounded-2xl px-4 py-3 shadow-lg"
              >
                <span className="text-sm text-foreground font-medium">{label}</span>
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Icon size={18} className="text-accent" />
                </div>
              </motion.button>
            ))}
        </AnimatePresence>

        <motion.button
          onClick={toggle}
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="pressable w-14 h-14 rounded-2xl bg-accent shadow-lg shadow-accent/20 flex items-center justify-center"
        >
          {open ? (
            <X size={24} className="text-white" />
          ) : (
            <Plus size={24} className="text-white" />
          )}
        </motion.button>
      </div>
    </>
  );
}
