'use client';

import { type ReactNode } from 'react';
import * as Icons from 'lucide-react';

interface EmptyStateProps {
  icon: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, message, actionLabel, onAction }: EmptyStateProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<any>>)[icon] || Icons.Inbox;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
        <IconComponent size={28} className="text-muted" />
      </div>
      <p className="text-sm text-muted text-center mb-4">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="pressable px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
