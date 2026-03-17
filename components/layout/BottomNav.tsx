'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Target, Wallet, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '@/lib/UserContext';

const NAV_ITEMS = [
  { href: '/', label: 'Home', Icon: LayoutDashboard },
  { href: '/planner', label: 'Planner', Icon: CalendarDays },
  { href: '/tracker', label: 'Tracker', Icon: Target },
  { href: '/money', label: 'Money', Icon: Wallet },
  { href: '/settings', label: 'Settings', Icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center">
      <div className="w-full max-w-[480px] bg-surface/95 backdrop-blur-md border-t border-border pb-safe">
        <div className="flex items-center justify-around h-16 relative">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="pressable relative flex flex-col items-center justify-center gap-1 w-16 h-full"
              >
                <div className="relative">
                  <Icon
                    size={22}
                    className={active ? 'text-accent' : 'text-muted'}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  {active && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${active ? 'text-accent' : 'text-muted'}`}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* User avatar floating in corner */}
          {user && (
            <div
              className="absolute right-3 top-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: user.color }}
            >
              {user.initial}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
