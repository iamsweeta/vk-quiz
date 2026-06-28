import { cn } from '@/lib/cn';

export type ProductIconName = 'leaderboard' | 'speed' | 'launch' | 'accuracy' | 'pulse' | 'room' | 'catalog' | 'theme' | 'auth' | 'mobile';

export function ProductIcon({ name, className }: { name: ProductIconName; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn('h-7 w-7', className)} fill="none">
      {name === 'leaderboard' && (
        <>
          <path d="M14 48h36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M18 34h10v14H18zM28 22h10v26H28zM38 30h10v18H38z" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M33 13l2.1 4.2 4.6.7-3.3 3.2.8 4.6-4.2-2.2-4.2 2.2.8-4.6-3.3-3.2 4.6-.7L33 13Z" fill="currentColor" />
        </>
      )}
      {name === 'speed' && (
        <>
          <path d="M12 42c3-15 15-25 29-25 4 0 8 1 11 3" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M17 42h8M14 34h7M19 26h5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-60" />
          <path d="m36 22-9 18h8l-4 13 14-22h-8l-1-9Z" fill="currentColor" />
        </>
      )}
      {name === 'launch' && (
        <>
          <path d="M36 12c8 3 13 8 16 16L38 42l-16-16 14-14Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="39" cy="25" r="4" fill="currentColor" />
          <path d="M22 26l-8 2 8 8M38 42l-2 8-8-8M20 44c-3 1-6 4-7 7 3-1 6-1 9-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-60" />
        </>
      )}
      {name === 'accuracy' && (
        <>
          <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="4" />
          <circle cx="32" cy="32" r="13" stroke="currentColor" strokeWidth="3" className="opacity-70" />
          <circle cx="32" cy="32" r="4" fill="currentColor" />
          <path d="M32 32 49 15M46 15h8v8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === 'pulse' && (
        <path d="M8 34h12l5-14 9 26 6-12h16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {name === 'room' && (
        <>
          <rect x="12" y="16" width="40" height="32" rx="10" stroke="currentColor" strokeWidth="4" />
          <path d="M22 30h20M22 38h12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {name === 'catalog' && (
        <>
          <rect x="12" y="14" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="4" />
          <rect x="35" y="14" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="4" />
          <rect x="12" y="37" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="4" />
          <rect x="35" y="37" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="4" />
        </>
      )}
      {name === 'theme' && (
        <>
          <circle cx="32" cy="32" r="17" stroke="currentColor" strokeWidth="4" />
          <path d="M32 15v34c9 0 17-8 17-17s-8-17-17-17Z" fill="currentColor" className="opacity-30" />
        </>
      )}
      {name === 'auth' && (
        <>
          <rect x="15" y="28" width="34" height="24" rx="8" stroke="currentColor" strokeWidth="4" />
          <path d="M23 28v-6c0-6 4-10 9-10s9 4 9 10v6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="32" cy="40" r="3" fill="currentColor" />
        </>
      )}
      {name === 'mobile' && (
        <>
          <rect x="20" y="8" width="24" height="48" rx="8" stroke="currentColor" strokeWidth="4" />
          <path d="M28 48h8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function IconTile({ name, className }: { name: ProductIconName; className?: string }) {
  return (
    <span className={cn('grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] text-[color:var(--accent)] shadow-soft', className)}>
      <ProductIcon name={name} className="h-6 w-6" />
    </span>
  );
}

export function RankBadge({ rank }: { rank: number }) {
  const name: ProductIconName = rank === 1 ? 'leaderboard' : rank === 2 ? 'speed' : rank === 3 ? 'launch' : 'accuracy';
  return (
    <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-strong)] text-[color:var(--accent)]">
      <ProductIcon name={name} className="h-5 w-5" />
    </span>
  );
}
