'use client';

import { motion } from 'framer-motion';

interface CircularProgressProps {
  value: number; // 0-100, or -1 for no data
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  glow?: boolean;
  label?: string;
}

export function CircularProgress({
  value,
  size = 100,
  strokeWidth = 8,
  className = '',
  color,
  glow = false,
  label,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const noData = value < 0;
  const displayValue = noData ? 0 : value;
  const offset = circumference - (displayValue / 100) * circumference;

  const getColor = () => {
    if (color) return color;
    if (displayValue >= 86) return '#22C55E';
    if (displayValue >= 71) return '#10B981';
    if (displayValue >= 51) return '#737373';
    if (displayValue >= 31) return '#F59E0B';
    return '#EF4444';
  };

  // Pulse speed: faster at higher scores
  const pulseSpeed = displayValue >= 86 ? 1.2 : displayValue >= 71 ? 2 : 0;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {glow && displayValue >= 71 && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `0 0 ${displayValue >= 86 ? 20 : 12}px ${getColor()}40`,
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: pulseSpeed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-surface-2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {!noData && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor()}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {noData ? (
          <span className="text-lg font-bold text-muted">--</span>
        ) : (
          <motion.span
            className="text-2xl font-bold text-foreground"
            key={value}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {value}
          </motion.span>
        )}
        {label && <span className="text-[9px] text-muted mt-0.5">{label}</span>}
      </div>
      {/* Heartbeat pulse for high scores */}
      {!noData && pulseSpeed > 0 && (
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: getColor() }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: pulseSpeed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
}
