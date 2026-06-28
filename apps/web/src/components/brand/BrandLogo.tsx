import Link from 'next/link';
import { cn } from '@/lib/cn';

export function BrainPulseMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn('h-9 w-9 text-[color:var(--accent)]', className)}
      fill="none"
    >
      <circle cx="31" cy="30" r="18" stroke="currentColor" strokeWidth="6" />
      <path d="M43 43l9 9" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M20 31h8l3-6 5 13 3-7h6"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex min-w-0 items-center gap-2.5" aria-label="VK Quiz">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-strong)] shadow-soft transition duration-200 group-hover:-translate-y-0.5 sm:h-11 sm:w-11">
        <BrainPulseMark className="h-6 w-6 sm:h-7 sm:w-7" />
      </span>

      {!compact && (
        <span className="min-w-0">
          <span className="block truncate text-lg font-black tracking-tight text-[color:var(--foreground)] sm:text-xl md:text-2xl">
            VK<span className="text-gradient"> Quiz</span>
          </span>
        </span>
      )}
    </Link>
  );
}
