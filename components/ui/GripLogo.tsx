'use client';

interface GripLogoProps {
  compact?: boolean;
  className?: string;
}

export function GripLogo({ compact = false, className = '' }: GripLogoProps) {
  if (compact) {
    return (
      <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={80} height={28}>
        <text x="0" y="24" fontFamily="var(--font-jakarta), system-ui, sans-serif" fontSize="28" fontWeight="900" letterSpacing="-1.5" fill="url(#grip-grad-c)">
          GRIP
        </text>
        <defs>
          <linearGradient id="grip-grad-c" x1="0" y1="0" x2="80" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#14B8A6" />
            <stop offset="1" stopColor="#F0FDFA" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 160 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={160} height={52}>
      <text x="0" y="36" fontFamily="var(--font-jakarta), system-ui, sans-serif" fontSize="42" fontWeight="900" letterSpacing="-2" fill="url(#grip-grad)">
        GRIP
      </text>
      <text x="1" y="49" fontFamily="var(--font-jakarta), system-ui, sans-serif" fontSize="10" fontWeight="500" letterSpacing="0.5" fill="#737373">
        by projekts.pk
      </text>
      <defs>
        <linearGradient id="grip-grad" x1="0" y1="0" x2="160" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14B8A6" />
          <stop offset="1" stopColor="#F0FDFA" />
        </linearGradient>
      </defs>
    </svg>
  );
}
