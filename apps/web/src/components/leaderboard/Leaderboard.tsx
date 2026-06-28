import { Card } from '@/components/ui/Card';
import { ProductIcon, RankBadge } from '@/components/brand/ProductIcon';
import type { LeaderboardEntry } from '@quizpulse/shared';

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <Card>
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-cyan/15 p-3 text-cyan">
          <ProductIcon name="leaderboard" />
        </div>
        <div>
          <h2 className="text-xl font-black">Лидерборд</h2>
          <p className="text-sm text-[color:var(--muted)]">Обновляется в реальном времени</p>
        </div>
      </div>

      <div className="grid gap-3">
        {entries.length === 0 ? (
          <p className="rounded-2xl bg-[color:var(--glass)] p-4 text-sm text-[color:var(--muted)]">Пока нет участников с баллами.</p>
        ) : (
          entries.map((entry, index) => (
            <div key={entry.participantId} className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] p-4">
              <div className="flex items-center gap-3">
                <RankBadge rank={index + 1} />
                <div>
                  <div className="font-bold">{entry.nickname}</div>
                  <div className="text-xs text-[color:var(--muted)]">Ответов: {entry.answeredCount}</div>
                </div>
              </div>
              <div className="text-xl font-black text-cyan">{entry.score}</div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
