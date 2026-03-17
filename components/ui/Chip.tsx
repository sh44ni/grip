'use client';

interface ChipProps {
  label: string;
  selected?: boolean;
  color?: string;
  onClick?: () => void;
}

export function Chip({ label, selected = false, color, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`pressable px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
        selected
          ? 'text-white'
          : 'bg-surface-2 text-muted hover:text-foreground'
      }`}
      style={selected ? { backgroundColor: color || 'var(--color-accent)' } : undefined}
    >
      {label}
    </button>
  );
}
