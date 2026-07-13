import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      neutral: 'bg-secondary text-secondary-foreground',
      teal: 'bg-accent text-accent-foreground',
      success: 'bg-success/15 text-success',
      warning: 'bg-warning/15 text-warning',
      danger: 'bg-destructive/15 text-destructive',
      info: 'bg-primary/10 text-primary',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

// Maps a domain status (trip/booking/parcel) to a pill tone — colour is never the only signal (text too).
const statusTone: Record<string, BadgeProps['tone']> = {
  scheduled: 'info',
  boarding: 'warning',
  departed: 'teal',
  in_transit: 'teal',
  arriving: 'teal',
  completed: 'success',
  cancelled: 'danger',
  delayed: 'warning',
  confirmed: 'success',
  registered: 'info',
  arrived: 'teal',
  collected: 'success',
  paid: 'success',
  unpaid: 'warning',
  pending: 'neutral',
};

export function StatusPill({
  status,
  className,
  children,
}: {
  status: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Badge tone={statusTone[status] ?? 'neutral'} className={cn('capitalize', className)}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {children ?? status.replace(/_/g, ' ')}
    </Badge>
  );
}
