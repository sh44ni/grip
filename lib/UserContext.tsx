'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppUser } from './users';
import { USERS, getUserById, USER_STORAGE_KEY } from './users';

interface UserContextValue {
  user: AppUser | null;
  login: (userId: string) => void;
  logout: () => void;
  isLoaded: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoaded: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      const found = getUserById(stored);
      if (found) setUser(found);
    }
    setIsLoaded(true);
  }, []);

  const login = useCallback((userId: string) => {
    const found = USERS.find((u) => u.id === userId);
    if (found) {
      localStorage.setItem(USER_STORAGE_KEY, userId);
      setUser(found);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, login, logout, isLoaded }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
