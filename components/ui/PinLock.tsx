'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Check } from 'lucide-react';
import { USERS, verifyPin } from '@/lib/users';
import type { AppUser } from '@/lib/users';
import { GripLogo } from '@/components/ui/GripLogo';
import { loadAvatar, saveAvatar } from '@/lib/UserContext';
import type { AvatarConfig } from '@/lib/UserContext';

// Emoji options grouped by vibe
const EMOJI_OPTIONS = [
  '👨','👩','🧔','👱','🧑','👦','👧',
  '🦸','🦹','🧙','🧝','🧛','🤴','👸',
  '🐻','🦊','🐺','🐯','🦁','🐼','🐸',
  '🚀','⚡','🔥','💎','👑','🎯','🌙',
];

const COLOR_OPTIONS = [
  '#14B8A6','#A855F7','#3B82F6','#F59E0B',
  '#EF4444','#10B981','#F97316','#EC4899',
  '#8B5CF6','#06B6D4','#84CC16','#E11D48',
];

interface PinLockProps {
  onUnlock: (userId: string) => void;
}

type Screen = 'select' | 'pin' | 'avatar';

export function PinLock({ onUnlock }: PinLockProps) {
  const [screen, setScreen] = useState<Screen>('select');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  // Avatar editing
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [draftAvatar, setDraftAvatar] = useState<AvatarConfig>({ emoji: '👨', color: '#14B8A6' });

  // Force re-render after avatar save
  const [avatarVersion, setAvatarVersion] = useState(0);

  const avatars = USERS.map(u => ({ ...u, avatar: loadAvatar(u.id) }));

  // Auto-submit when 4 digits entered
  React.useEffect(() => {
    if (pin.length === 4 && selectedUser) {
      if (verifyPin(selectedUser.id, pin)) {
        onUnlock(selectedUser.id);
      } else {
        setShake(true);
        setError(true);
        setTimeout(() => { setPin(''); setError(false); setShake(false); }, 600);
      }
    }
  }, [pin, selectedUser, onUnlock]);

  const handleDigit = (d: string) => {
    if (pin.length < 4) { setPin(p => p + d); setError(false); }
  };

  const openAvatarEditor = (userId: string) => {
    setEditingUserId(userId);
    setDraftAvatar(loadAvatar(userId));
    setScreen('avatar');
  };

  const saveAvatarEdit = () => {
    if (editingUserId) {
      saveAvatar(editingUserId, draftAvatar);
      setAvatarVersion(v => v + 1);
    }
    setScreen('select');
    setEditingUserId(null);
  };

  const NUMPAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  // ── Avatar Editor Screen ─────────────────────────────────
  if (screen === 'avatar') {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px] flex flex-col items-center gap-6">

          <h2 className="text-xl font-bold text-foreground">Edit Avatar</h2>

          {/* Preview */}
          <motion.div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{ backgroundColor: draftAvatar.color + '25', border: `2px solid ${draftAvatar.color}50` }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.3 }}
          >
            {draftAvatar.emoji}
          </motion.div>

          {/* Emoji Picker */}
          <div>
            <p className="text-xs text-muted mb-2 text-center uppercase tracking-wider">Choose emoji</p>
            <div className="grid grid-cols-7 gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button key={e} onClick={() => setDraftAvatar(d => ({ ...d, emoji: e }))}
                  className={`pressable w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${draftAvatar.emoji === e ? 'ring-2 ring-accent bg-accent/10' : 'bg-surface-2'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <p className="text-xs text-muted mb-2 text-center uppercase tracking-wider">Choose color</p>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_OPTIONS.map(c => (
                <button key={c} onClick={() => setDraftAvatar(d => ({ ...d, color: c }))}
                  className="pressable w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: c }}>
                  {draftAvatar.color === c && <Check size={16} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button onClick={() => setScreen('select')} className="pressable flex-1 py-3 rounded-xl bg-surface-2 text-sm text-muted font-medium">
              Cancel
            </button>
            <button onClick={saveAvatarEdit} className="pressable flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold">
              Save
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── User Select Screen ────────────────────────────────────
  if (!selectedUser || screen === 'select') {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px] flex flex-col items-center gap-8" key={avatarVersion}>
          <GripLogo />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Who&apos;s in?</h1>
            <p className="text-sm text-muted mt-1">Tap to sign in · Hold to edit avatar</p>
          </div>

          <div className="flex gap-4 w-full">
            {avatars.map((u) => (
              <div key={u.id} className="flex-1 flex flex-col items-center gap-1">
                <motion.button
                  onClick={() => { setSelectedUser(u); setScreen('pin'); setPin(''); }}
                  whileTap={{ scale: 0.95 }}
                  onContextMenu={(e) => { e.preventDefault(); openAvatarEditor(u.id); }}
                  className="pressable w-full flex flex-col items-center gap-3 py-8 rounded-2xl bg-surface border border-border"
                >
                  <motion.div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: u.avatar.color + '20', border: `2px solid ${u.avatar.color}40` }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {u.avatar.emoji}
                  </motion.div>
                  <span className="text-sm font-semibold text-foreground">{u.name}</span>
                </motion.button>
                {/* Edit button below avatar card */}
                <button onClick={() => openAvatarEditor(u.id)}
                  className="pressable text-[10px] text-muted/50 mt-0.5">
                  edit avatar
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── PIN Entry Screen ──────────────────────────────────────
  const userAvatar = loadAvatar(selectedUser.id);
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[360px] flex flex-col items-center gap-8">

        <motion.div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl"
          style={{ backgroundColor: userAvatar.color + '20', border: `2px solid ${userAvatar.color}50` }}
          animate={shake ? { x: [-8, 8, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {userAvatar.emoji}
        </motion.div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">{selectedUser.name}</h2>
          <p className="text-sm text-muted mt-0.5">Enter your PIN</p>
        </div>

        {/* PIN dots */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <motion.div key={i} className="w-4 h-4 rounded-full"
              animate={{
                backgroundColor: error ? '#EF4444' : i < pin.length ? userAvatar.color : '#2A2A2A',
                scale: i < pin.length ? 1.15 : 1,
              }}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-danger -mt-4">
            Wrong PIN. Try again.
          </motion.p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {NUMPAD.map((key, idx) => {
            if (key === '') return <div key={idx} />;
            if (key === '⌫') return (
              <motion.button key={idx} onClick={() => setPin(p => p.slice(0, -1))} whileTap={{ scale: 0.9 }}
                className="pressable aspect-square rounded-2xl bg-surface-2 flex items-center justify-center">
                <Delete size={20} className="text-muted" />
              </motion.button>
            );
            return (
              <motion.button key={idx} onClick={() => handleDigit(key)} whileTap={{ scale: 0.9 }}
                className="pressable aspect-square rounded-2xl bg-surface text-xl font-semibold text-foreground flex items-center justify-center">
                {key}
              </motion.button>
            );
          })}
        </div>

        <button onClick={() => { setSelectedUser(null); setPin(''); setScreen('select'); }} className="pressable text-sm text-muted">
          ← Switch user
        </button>
      </motion.div>
    </div>
  );
}
