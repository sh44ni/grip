'use client';

import { motion } from 'framer-motion';
import { Flame, Diamond, Shield, Sparkles } from 'lucide-react';

interface StreakFlameProps {
  streak: number;
  size?: number;
  showLabel?: boolean;
  broken?: boolean;
  className?: string;
}

export function StreakFlame({ streak, size = 20, showLabel = false, broken = false, className = '' }: StreakFlameProps) {
  if (broken) {
    return (
      <motion.div
        className={`inline-flex items-center gap-1 ${className}`}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 0.5, 0], opacity: [1, 0.5, 0] }}
        transition={{ duration: 0.8 }}
      >
        <Flame size={size} className="text-muted" />
        {showLabel && <span className="text-xs text-muted italic">extinguished</span>}
      </motion.div>
    );
  }

  if (streak <= 0) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <Flame size={size} className="text-muted/30" />
        {showLabel && <span className="text-xs text-muted">no streak</span>}
      </div>
    );
  }

  // Day 90+ = diamond/shield
  if (streak >= 90) {
    return (
      <motion.div
        className={`inline-flex items-center gap-1.5 ${className}`}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Diamond size={size} className="text-accent" style={{ filter: 'drop-shadow(0 0 6px #14B8A6)' }} />
        </motion.div>
        {showLabel && <span className="text-xs font-semibold text-accent">Day {streak} of the fight</span>}
      </motion.div>
    );
  }

  // Day 30+ = full blaze with animated flicker
  if (streak >= 30) {
    return (
      <motion.div className={`inline-flex items-center gap-1.5 ${className}`}>
        <motion.div
          animate={{ 
            scale: [1, 1.1, 0.95, 1.05, 1],
            rotate: [0, 3, -2, 1, 0],
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <Flame size={size} className="text-orange-400" style={{ filter: 'drop-shadow(0 0 8px #F97316)' }} />
        </motion.div>
        {showLabel && <span className="text-xs font-semibold text-orange-400">Day {streak} of the fight</span>}
      </motion.div>
    );
  }

  // Day 14+ = strong flame with glow
  if (streak >= 14) {
    return (
      <motion.div className={`inline-flex items-center gap-1.5 ${className}`}>
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <Flame size={size} className="text-orange-500" style={{ filter: 'drop-shadow(0 0 4px #F97316)' }} />
        </motion.div>
        {showLabel && <span className="text-xs font-medium text-orange-500">Day {streak} of the fight</span>}
      </motion.div>
    );
  }

  // Day 7+ = medium flame, brighter
  if (streak >= 7) {
    return (
      <motion.div className={`inline-flex items-center gap-1.5 ${className}`}>
        <motion.div
          animate={{ rotate: [0, 3, -3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Flame size={size} className="text-amber-500" />
        </motion.div>
        {showLabel && <span className="text-xs font-medium text-amber-500">Day {streak} of the fight</span>}
      </motion.div>
    );
  }

  // Day 3+ = small flame
  if (streak >= 3) {
    return (
      <motion.div className={`inline-flex items-center gap-1.5 ${className}`}>
        <motion.div
          animate={{ rotate: [0, 2, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Flame size={size * 0.85} className="text-amber-600" />
        </motion.div>
        {showLabel && <span className="text-xs text-amber-600">Day {streak} of the fight</span>}
      </motion.div>
    );
  }

  // Day 1-2 = tiny spark
  return (
    <motion.div className={`inline-flex items-center gap-1.5 ${className}`}>
      <Sparkles size={size * 0.7} className="text-amber-700/60" />
      {showLabel && <span className="text-xs text-muted">Day {streak} of the fight</span>}
    </motion.div>
  );
}
