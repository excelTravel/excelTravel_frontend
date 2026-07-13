import { cn } from '@/lib/utils';

// Layout-shaped loading placeholder (never a bare spinner). Compose these to match each surface.
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}
