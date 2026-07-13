import { cn } from '@/lib/utils';

// Layout-shaped loading placeholder (never a bare spinner). Compose these to match each surface.
// Uses a travelling shimmer band; falls back to a static muted block under reduced-motion (CSS media rule).
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('shimmer rounded-md', className)} {...props} />;
}
