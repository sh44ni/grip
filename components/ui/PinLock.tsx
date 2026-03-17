'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete } from 'lucide-react';
import { USERS, verifyPin } from '@/lib/users';
import type { AppUser } from '@/lib/users';
import { GripLogo } from '@/components/ui/GripLogo';

interface PinLockProps {
  onUnlock: (userId: string) => void;
}

export function PinLock({ onUnlock }: PinLockProps) {
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4 && selectedUser) {
      if (verifyPin(selectedUser.id, pin)) {
        onUnlock(selectedUser.id);
      } else {
        setShake(true);
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
          setShake(false);
        }, 600);
      }
    }
  }, [pin, selectedUser, onUnlock]);

  const handleDigit = (d: string) => {
    if (pin.length < 4) {
      setPin((p) => p + d);
      setError(false);
    }
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  const NUMPAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  if (!selectedUser) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px] flex flex-col items-center gap-8"
        >
          <GripLogo />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Who&apos;s in?</h1>
            <p className="text-sm text-muted mt-1">Select your profile to continue</p>
          </div>

          <div className="flex gap-4 w-full">
            {USERS.map((user) => (
              <motion.button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                whileTap={{ scale: 0.95 }}
                className="pressable flex-1 flex flex-col items-center gap-3 py-8 rounded-2xl bg-surface border border-border"
              >
                <motion.div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
                  style={{ backgroundColor: user.color }}
                  whileHover={{ scale: 1.05 }}
                >
                  {user.initial}
                </motion.div>
                <span className="text-sm font-semibold text-foreground">{user.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[360px] flex flex-col items-center gap-8"
      >
        {/* Avatar */}
        <motion.div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white"
          style={{ backgroundColor: selectedUser.color }}
          animate={shake ? { x: [-8, 8, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {selectedUser.initial}
        </motion.div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">{selectedUser.name}</h2>
          <p className="text-sm text-muted mt-0.5">Enter your PIN</p>
        </div>

        {/* PIN dots */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-4 h-4 rounded-full"
              animate={{
                backgroundColor: error
                  ? '#EF4444'
                  : i < pin.length
                  ? selectedUser.color
                  : '#2A2A2A',
                scale: i < pin.length ? 1.15 : 1,
              }}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-danger -mt-4"
          >
            Wrong PIN. Try again.
          </motion.p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {NUMPAD.map((key, idx) => {
            if (key === '') return <div key={idx} />;
            if (key === '⌫') {
              return (
                <motion.button
                  key={idx}
                  onClick={handleDelete}
                  whileTap={{ scale: 0.9 }}
                  className="pressable aspect-square rounded-2xl bg-surface-2 flex items-center justify-center"
                >
                  <Delete size={20} className="text-muted" />
                </motion.button>
              );
            }
            return (
              <motion.button
                key={idx}
                onClick={() => handleDigit(key)}
                whileTap={{ scale: 0.9 }}
                className="pressable aspect-square rounded-2xl bg-surface text-xl font-semibold text-foreground flex items-center justify-center"
              >
                {key}
              </motion.button>
            );
          })}
        </div>

        {/* Back to user select */}
        <button
          onClick={() => { setSelectedUser(null); setPin(''); }}
          className="pressable text-sm text-muted"
        >
          ← Switch user
        </button>
      </motion.div>
    </div>
  );
}
