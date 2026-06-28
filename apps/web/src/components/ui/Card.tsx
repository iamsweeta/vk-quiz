import { cn } from '@/lib/cn';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-soft backdrop-blur-xl transition hover:border-primary/20 dark:hover:border-cyan/25',
        className
      )}
      {...props}
    />
  );
}
