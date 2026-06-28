import { cn } from '@/lib/cn';
import type { InputHTMLAttributes } from 'react';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--input)] px-4 py-3 text-[color:var(--foreground)] outline-none placeholder:text-[color:var(--muted)] transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-soft)]',
        className
      )}
      {...props}
    />
  );
}
