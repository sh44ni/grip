'use client';

import React from 'react';
import { getUserById } from '@/lib/users';

interface UserBadgeProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export function UserBadge({ userId, size = 'sm', showName = false, className = '' }: UserBadgeProps) {
  const user = getUserById(userId);
  if (!user) return null;

  const sizeMap = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
        style={{ backgroundColor: user.color }}
      >
        {user.initial}
      </div>
      {showName && (
        <span className="text-xs font-medium" style={{ color: user.color }}>
          {user.name}
        </span>
      )}
    </div>
  );
}
