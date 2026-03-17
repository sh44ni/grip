'use client';

import { type ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { ToastProvider } from '@/components/ui/Toast';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-black flex justify-center">
        <div className="w-full max-w-[480px] bg-background min-h-dvh relative">
          <main className="pb-20 pt-safe min-h-dvh">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </ToastProvider>
  );
}
