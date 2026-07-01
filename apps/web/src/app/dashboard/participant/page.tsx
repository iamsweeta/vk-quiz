import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { requireUser } from '@/lib/auth';
import { prisma } from '@quizpulse/db';

type ParticipantScore = {
  id: string;
  score: number;
  joinedAt: Date;
};

function getParticipantRank(participantId: string, participants: ParticipantScore[]) {
  const sorted = [...participants].sort((a, b) => b.score - a.score || a.joinedAt.getTime() - b.joinedAt.getTime());
  const index = sorted.findIndex((participant) => participant.id === participantId);
  return index >= 0 ? index + 1 : null;
}

export default async function ParticipantDashboardPage() {
  const user = await requireUser();

  const participations = await prisma.roomParticipant.findMany({
    where: { userId: user.id },
    include: {
      room: {
        include: {
          quiz: { select: { title: true } },
          participants: { select: { id: true, score: true, joinedAt: true } }
        }
      },
      _count: { select: { submissions: true } }
    },
    orderBy: { joinedAt: 'desc' }
  });

  const totalParticipations = participations.length;
  const totalScore = participations.reduce((sum, participation) => sum + participation.score, 0);
  const ranks = participations
    .map((participation) => getParticipantRank(participation.id, participation.room.participants))
    .filter((rank): rank is number => rank !== null);
  const bestRank = ranks.length ? Math.min(...ranks) : null;
  const recentParticipations = participations.slice(0, 3);

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-sm font-black uppercase tracking-wide text-cyan">Кабинет участника</p>
        <h1 className="mt-2 text-5xl font-black">Привет, {user.name}</h1>
        <p className="mt-3 text-[color:var(--muted)]">Здесь отображаются только реальные участия в live-комнатах и результаты, которые уже есть в базе данных.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <div className="text-sm text-[color:var(--muted)]">Участий</div>
            <div className="mt-2 text-4xl font-black">{totalParticipations}</div>
          </Card>
          <Card>
            <div className="text-sm text-[color:var(--muted)]">Лучшее место</div>
            <div className="mt-2 text-4xl font-black">{bestRank ? '#' + bestRank : '—'}</div>
          </Card>
          <Card>
            <div className="text-sm text-[color:var(--muted)]">Всего баллов</div>
            <div className="mt-2 text-4xl font-black">{totalScore}</div>
          </Card>
        </div>

        {recentParticipations.length > 0 ? (
          <Card className="mt-8">
            <h2 className="text-2xl font-black">Последние участия</h2>
            <div className="mt-5 grid gap-3">
              {recentParticipations.map((participation) => {
                const rank = getParticipantRank(participation.id, participation.room.participants);
                return (
                  <div key={participation.id} className="flex flex-col justify-between gap-3 rounded-3xl border border-[color:var(--border)] bg-[color:var(--glass)] p-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="font-black">{participation.room.quiz.title}</div>
                      <div className="mt-1 text-sm text-[color:var(--muted)]">Код комнаты: {participation.room.code} · ответов: {participation._count.submissions}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm font-black">
                      <span className="rounded-full bg-[color:var(--card-strong)] px-3 py-2">{participation.score} баллов</span>
                      <span className="rounded-full bg-[color:var(--card-strong)] px-3 py-2">{rank ? '#' + rank : 'место —'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card className="mt-8">
            <h2 className="text-2xl font-black">Истории пока нет</h2>
            <p className="mt-3 text-[color:var(--muted)]">Вы ещё не участвовали в live-квизах. После первой игры здесь появятся реальные баллы, место и история прохождений.</p>
          </Card>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/catalog">Открыть каталог</Button>
          <Button href="/join" variant="ghost">Войти в комнату</Button>
          <Button href="/dashboard/participant/history" variant="ghost">История</Button>
        </div>
      </section>
    </AppShell>
  );
}

