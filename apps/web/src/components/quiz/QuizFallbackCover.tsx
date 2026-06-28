import { BrainPulseMark } from '@/components/brand/BrandLogo';
import { cn } from '@/lib/cn';

function initials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'QP';
}

export function QuizFallbackCover({
  title,
  category,
  className,
  compact = false
}: {
  title: string;
  category?: string | null;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-[linear-gradient(135deg,rgba(124,58,237,.12),rgba(6,182,212,.10),rgba(255,255,255,.35))] dark:bg-[linear-gradient(135deg,rgba(124,58,237,.22),rgba(6,182,212,.16),rgba(15,23,42,.22))]', className)}>
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan/15 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:22px_22px] text-[color:var(--muted)]" />
      <div className={cn('relative flex h-full min-h-0 flex-col justify-between', compact ? 'p-4 sm:p-6' : 'p-5 sm:p-6')}>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div
            className={cn(
              'grid shrink-0 place-items-center border border-cyan/25 bg-[color:var(--card-strong)] text-primary shadow-soft dark:text-cyan',
              compact ? 'h-9 w-9 rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl' : 'h-11 w-11 rounded-2xl sm:h-12 sm:w-12'
            )}
          >
            <BrainPulseMark className={compact ? 'h-5 w-5 sm:h-7 sm:w-7' : 'h-6 w-6 sm:h-7 sm:w-7'} />
          </div>
        </div>
        <div className="min-w-0 overflow-hidden">
          <div
            className={cn(
              'inline-flex max-w-full rounded-2xl bg-[color:var(--card-strong)] font-black text-primary shadow-soft dark:text-cyan',
              compact ? 'mb-1 px-2 py-1 text-sm sm:mb-3 sm:px-3 sm:py-2 sm:text-xl' : 'mb-2 px-3 py-2 text-lg sm:mb-3 sm:text-xl'
            )}
          >
            {initials(title)}
          </div>
          {!compact && <p className="truncate text-xs font-black uppercase tracking-wide text-cyan sm:text-sm">{category || 'VK Quiz'}</p>}
          <h3
            className={cn(
              'mt-1 line-clamp-2 max-w-full break-words font-black leading-snug text-[color:var(--foreground)] [overflow-wrap:anywhere] sm:mt-2 sm:leading-tight',
              compact ? 'text-sm sm:text-xl' : 'text-xl sm:text-3xl'
            )}
            title={title}
          >
            {title}
          </h3>
        </div>
      </div>
    </div>
  );
}
