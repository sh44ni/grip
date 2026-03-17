'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppUser } from './users';
import { USERS, getUserById, USER_STORAGE_KEY } from './users';

export interface AvatarConfig {
  photo?: string; // base64 data URL
  color: string;
}

const DEFAULT_AVATARS: Record<string, AvatarConfig> = {
  zeeshan: { color: '#14B8A6' },
  maryam:  { color: '#A855F7' },
};

function avatarKey(userId: string) { return `grip_avatar_${userId}`; }

export function loadAvatar(userId: string): AvatarConfig {
  if (typeof window === 'undefined') return DEFAULT_AVATARS[userId] ?? { emoji: '🙂', color: '#14B8A6' };
  try {
    const raw = localStorage.getItem(avatarKey(userId));
    if (raw) return JSON.parse(raw) as AvatarConfig;
  } catch { /* ignore */ }
  return DEFAULT_AVATARS[userId] ?? { emoji: '🙂', color: '#14B8A6' };
}

export function saveAvatar(userId: string, config: AvatarConfig) {
  localStorage.setItem(avatarKey(userId), JSON.stringify(config));
}

interface UserContextValue {
  user: AppUser | null;
  avatar: AvatarConfig | null;
  login: (userId: string) => void;
  logout: () => void;
  updateAvatar: (config: AvatarConfig) => void;
  isLoaded: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  avatar: null,
  login: () => {},
  logout: () => {},
  updateAvatar: () => {},
  isLoaded: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      const found = getUserById(stored);
      if (found) {
        setUser(found);
        setAvatar(loadAvatar(found.id));
      }
    }
    setIsLoaded(true);
  }, []);

  const login = useCallback((userId: string) => {
    const found = USERS.find((u) => u.id === userId);
    if (found) {
      localStorage.setItem(USER_STORAGE_KEY, userId);
      setUser(found);
      setAvatar(loadAvatar(found.id));
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    setAvatar(null);
  }, []);

  const updateAvatar = useCallback((config: AvatarConfig) => {
    if (!user) return;
    saveAvatar(user.id, config);
    setAvatar(config);
  }, [user]);

  return (
    <UserContext.Provider value={{ user, avatar, login, logout, updateAvatar, isLoaded }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
