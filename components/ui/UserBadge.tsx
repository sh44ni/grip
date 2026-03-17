'use client';

import React from 'react';
import { loadAvatar } from '@/lib/UserContext';

interface UserBadgeProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
  name?: string;
}

export function UserBadge({ userId, size = 'sm', showName = false, name, className = '' }: UserBadgeProps) {
  const avatar = loadAvatar(userId);

  const sizeMap = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-full flex items-center justify-center shrink-0`}
        style={{ backgroundColor: avatar.color + '30', border: `1.5px solid ${avatar.color}40` }}
      >
        <span style={{ lineHeight: 1 }}>{avatar.emoji}</span>
      </div>
      {showName && name && (
        <span className="text-xs font-medium" style={{ color: avatar.color }}>
          {name}
        </span>
      )}
    </div>
  );
}
