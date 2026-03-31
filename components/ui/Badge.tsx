import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'orange' | 'blue' | 'green' | 'red' | 'purple' | 'yellow' | 'zinc';
  size?: 'sm' | 'md';
  className?: string;
}

const VARIANTS = {
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  green:  'bg-green-500/10 text-green-400 border-green-500/20',
  red:    'bg-red-500/10 text-red-400 border-red-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  zinc:   'bg-zinc-700/50 text-zinc-400 border-zinc-700',
};

export function Badge({ children, variant = 'zinc', size = 'sm', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center font-semibold rounded-lg border',
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
      VARIANTS[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function LevelBadge({ level, xp }: { level: number; xp: number }) {
  const color = level >= 8 ? 'yellow' : level >= 5 ? 'purple' : level >= 3 ? 'blue' : 'zinc';
  return (
    <Badge variant={color as any}>
      ⚡ Nível {level} · {xp} XP
    </Badge>
  );
}

export function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null;
  const color = streak >= 30 ? 'yellow' : streak >= 7 ? 'orange' : 'zinc';
  return (
    <Badge variant={color as any}>
      🔥 {streak} dias
    </Badge>
  );
}
