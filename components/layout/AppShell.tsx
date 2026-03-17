'use client';

import { type ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { ToastProvider } from '@/components/ui/Toast';
import { UserProvider, useUser } from '@/lib/UserContext';
import { PinLock } from '@/components/ui/PinLock';

function AppShellInner({ children }: { children: ReactNode }) {
  const { user, login, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-accent/20 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <PinLock onUnlock={login} />;
  }

  return (
    <div className="min-h-dvh bg-black flex justify-center">
      <div className="w-full max-w-[480px] bg-background min-h-dvh relative">
        <main className="pb-20 pt-safe min-h-dvh">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <UserProvider>
        <AppShellInner>{children}</AppShellInner>
      </UserProvider>
    </ToastProvider>
  );
}
