import { cn, getLevelFromXp, LEVEL_NAMES } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface XPBadgeProps {
  xp: number;
  size?: 'sm' | 'md' | 'lg';
  showBar?: boolean;
}

export function XPBadge({ xp, size = 'md', showBar = false }: XPBadgeProps) {
  const { level, nextXp, progress } = getLevelFromXp(xp);
  const levelName = LEVEL_NAMES[level] ?? 'Atleta';

  return (
    <div className={cn('flex flex-col gap-1', size === 'sm' && 'text-xs', size === 'lg' && 'text-base')}>
      <div className="flex items-center gap-2">
        <span className={cn(
          'font-semibold px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20',
          size === 'sm' && 'text-xs',
        )}>
          Nv. {level} · {levelName}
        </span>
        <div className="flex items-center gap-1 text-zinc-500">
          <Zap size={size === 'sm' ? 10 : 12} className="text-yellow-500" />
          <span className={cn('font-medium', size === 'sm' ? 'text-xs' : 'text-sm')}>{xp} XP</span>
        </div>
      </div>
      {showBar && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-600">{nextXp} XP</span>
        </div>
      )}
    </div>
  );
}
