import * as React from 'react';
import { cn } from '@/lib/utils';

// Solid card — for dense content (tables) where glass would hurt readability.
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-2xl border border-border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

// Frosted card — for elevated cards floating over the gradient ground (the glassmorphism look).
export const GlassCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('glass rounded-2xl text-card-foreground shadow-sm', className)} {...props} />
  ),
);
GlassCard.displayName = 'GlassCard';

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-between p-5 pb-0', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}
