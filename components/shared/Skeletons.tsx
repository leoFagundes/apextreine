import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-xl', className)} />;
}

export function ExerciseCardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-16 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

export function WorkoutCardSkeleton() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-9 w-full rounded-xl" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card p-5 space-y-2">
      <Skeleton className="w-9 h-9 rounded-xl" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="page-container space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    </div>
  );
}
