import { cn } from '@/lib/cn';
import type { HTMLAttributes } from 'react';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-black uppercase tracking-wide text-[color:var(--accent)]',
        className
      )}
      {...props}
    />
  );
}
