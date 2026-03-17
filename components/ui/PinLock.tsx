'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Delete, Camera, X } from 'lucide-react';
import { USERS, verifyPin } from '@/lib/users';
import type { AppUser } from '@/lib/users';
import { GripLogo } from '@/components/ui/GripLogo';
import { loadAvatar, saveAvatar } from '@/lib/UserContext';
import type { AvatarConfig } from '@/lib/UserContext';

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
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [draftAvatar, setDraftAvatar] = useState<AvatarConfig>({ color: '#14B8A6' });
  const [avatarVersion, setAvatarVersion] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const avatars = USERS.map(u => ({ ...u, avatar: loadAvatar(u.id) }));

  React.useEffect(() => {
    if (pin.length === 4 && selectedUser) {
      if (verifyPin(selectedUser.id, pin)) {
        onUnlock(selectedUser.id);
      } else {
        setShake(true); setError(true);
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setDraftAvatar(d => ({ ...d, photo: result }));
    };
    reader.readAsDataURL(file);
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

  // ── Avatar Editor ─────────────────────────────────────────
  if (screen === 'avatar') {
    const editUser = USERS.find(u => u.id === editingUserId);
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px] flex flex-col items-center gap-6">

          <h2 className="text-xl font-bold text-foreground">Edit Avatar</h2>
          <p className="text-sm text-muted -mt-4">{editUser?.name}</p>

          {/* Preview */}
          <div
            className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center text-3xl font-bold text-white"
            style={draftAvatar.photo ? {} : { backgroundColor: draftAvatar.color }}
          >
            {draftAvatar.photo
              ? <img src={draftAvatar.photo} alt="preview" className="w-full h-full object-cover" />
              : <span>{editUser?.initial}</span>
            }
          </div>

          {/* Photo upload */}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          <button onClick={() => fileRef.current?.click()}
            className="pressable flex items-center gap-2 px-5 py-3 rounded-2xl bg-surface border border-border text-sm font-medium text-foreground w-full justify-center">
            <Camera size={18} className="text-accent" />
            {draftAvatar.photo ? 'Change Photo' : 'Upload Photo'}
          </button>

          {/* Remove photo */}
          {draftAvatar.photo && (
            <button onClick={() => setDraftAvatar(d => ({ ...d, photo: undefined }))}
              className="pressable flex items-center gap-1.5 text-xs text-danger -mt-3">
              <X size={12} /> Remove photo
            </button>
          )}

          {/* Color accent */}
          <div className="w-full">
            <p className="text-xs text-muted mb-2 uppercase tracking-wider">Accent color</p>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_OPTIONS.map(c => (
                <button key={c} onClick={() => setDraftAvatar(d => ({ ...d, color: c }))}
                  className="pressable w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: c }}>
                  {draftAvatar.color === c && <span className="text-white font-bold">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button onClick={() => setScreen('select')} className="pressable flex-1 py-3 rounded-xl bg-surface-2 text-sm text-muted font-medium">Cancel</button>
            <button onClick={saveAvatarEdit} className="pressable flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold">Save</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── User Select ────────────────────────────────────────────
  if (!selectedUser || screen === 'select') {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px] flex flex-col items-center gap-8" key={avatarVersion}>
          <GripLogo />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Who&apos;s in?</h1>
            <p className="text-sm text-muted mt-1">Tap to sign in</p>
          </div>

          <div className="flex gap-4 w-full">
            {avatars.map((u) => (
              <div key={u.id} className="flex-1 flex flex-col items-center gap-1.5">
                <motion.button
                  onClick={() => { setSelectedUser(u); setScreen('pin'); setPin(''); }}
                  whileTap={{ scale: 0.95 }}
                  className="pressable w-full flex flex-col items-center gap-3 py-8 rounded-2xl bg-surface border border-border"
                >
                  {/* Avatar photo or colored initial */}
                  <motion.div
                    className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-white text-xl"
                    style={u.avatar.photo ? {} : { backgroundColor: u.avatar.color }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {u.avatar.photo
                      ? <img src={u.avatar.photo} alt={u.name} className="w-full h-full object-cover" />
                      : u.initial
                    }
                  </motion.div>
                  <span className="text-sm font-semibold text-foreground">{u.name}</span>
                </motion.button>
                <button onClick={() => openAvatarEditor(u.id)}
                  className="pressable text-[11px] text-muted/50 flex items-center gap-1">
                  <Camera size={10} /> edit photo
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── PIN Entry ──────────────────────────────────────────────
  const userAvatar = loadAvatar(selectedUser.id);
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[360px] flex flex-col items-center gap-8">

        <motion.div
          className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-white text-2xl"
          style={userAvatar.photo ? {} : { backgroundColor: userAvatar.color }}
          animate={shake ? { x: [-8, 8, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {userAvatar.photo
            ? <img src={userAvatar.photo} alt={selectedUser.name} className="w-full h-full object-cover" />
            : selectedUser.initial
          }
        </motion.div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">{selectedUser.name}</h2>
          <p className="text-sm text-muted mt-0.5">Enter your PIN</p>
        </div>

        <div className="flex gap-4">
          {[0,1,2,3].map((i) => (
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

        <button onClick={() => { setSelectedUser(null); setPin(''); setScreen('select'); }}
          className="pressable text-sm text-muted">
          ← Switch user
        </button>
      </motion.div>
    </div>
  );
}
