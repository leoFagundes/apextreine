import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-20 px-6', className)}>
      <div className="w-16 h-16 rounded-2xl bg-zinc-800/60 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
        <Icon size={28} className="text-zinc-600" />
      </div>
      <h3 className="font-semibold text-zinc-300 mb-1">{title}</h3>
      {description && <p className="text-zinc-500 text-sm max-w-xs">{description}</p>}
      {actionLabel && (
        <div className="mt-6">
          {actionHref ? (
            <Link href={actionHref} className="btn-primary inline-flex items-center gap-2 text-sm">
              {actionLabel}
            </Link>
          ) : (
            <button onClick={onAction} className="btn-primary text-sm">
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
