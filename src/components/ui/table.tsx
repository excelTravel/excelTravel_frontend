import { type ReactNode, type HTMLAttributes, type ThHTMLAttributes, type TdHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Shared data-table primitives — one consistent look across every screen: a quiet tinted header,
// generous row height, hairline dividers, and a clear hover. Numeric cells should add `tabular-nums`.
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-secondary/40">
      <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</tr>
    </thead>
  );
}

export function Th({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('whitespace-nowrap border-y border-border/70 px-5 py-3 font-semibold first:pl-6 last:pr-6', className)} {...props}>
      {children}
    </th>
  );
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border/50">{children}</tbody>;
}

export function Tr({ className, onClick, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      onClick={onClick}
      className={cn('transition-colors hover:bg-secondary/40', onClick && 'cursor-pointer', className)}
      {...props}
    >
      {children}
    </tr>
  );
}

export function Td({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-5 py-3.5 align-middle first:pl-6 last:pr-6', className)} {...props}>
      {children}
    </td>
  );
}
