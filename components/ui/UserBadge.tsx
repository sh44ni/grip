'use client';

import React from 'react';
import { loadAvatar } from '@/lib/UserContext';
import { getUserById } from '@/lib/users';

interface UserBadgeProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export function UserBadge({ userId, size = 'sm', showName = false, className = '' }: UserBadgeProps) {
  const avatar = loadAvatar(userId);
  const user = getUserById(userId);
  if (!user) return null;

  const sizeMap = {
    sm: { box: 'w-6 h-6', text: 'text-[10px]' },
    md: { box: 'w-8 h-8', text: 'text-xs' },
    lg: { box: 'w-10 h-10', text: 'text-sm' },
  };
  const { box, text } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className={`${box} rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-white`}
        style={avatar.photo ? {} : { backgroundColor: avatar.color }}
      >
        {avatar.photo
          ? <img src={avatar.photo} alt={user.name} className="w-full h-full object-cover" />
          : <span className={text}>{user.initial}</span>
        }
      </div>
      {showName && (
        <span className={`${text} font-medium`} style={{ color: avatar.color }}>
          {user.name}
        </span>
      )}
    </div>
  );
}
