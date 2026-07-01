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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export default async function ParticipantHistoryPage() {
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

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-sm font-black uppercase tracking-wide text-cyan">История участника</p>
        <h1 className="mt-2 text-5xl font-black">Пройденные live-квизы</h1>
        <p className="mt-3 text-[color:var(--muted)]">Здесь показываются только реальные участия текущего пользователя.</p>

        <div className="mt-8 grid gap-4">
          {participations.map((participation) => {
            const rank = getParticipantRank(participation.id, participation.room.participants);
            return (
              <Card key={participation.id} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-2xl font-black">{participation.room.quiz.title}</h2>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{formatDate(participation.joinedAt)} · комната {participation.room.code} · ответов: {participation._count.submissions}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm font-black">
                  <span className="rounded-full bg-[color:var(--card-strong)] px-3 py-2">{participation.score} баллов</span>
                  <span className="rounded-full bg-[color:var(--card-strong)] px-3 py-2">{rank ? '#' + rank : 'место —'}</span>
                </div>
              </Card>
            );
          })}

          {!participations.length && (
            <Card>
              <h2 className="text-2xl font-black">Пока нет прохождений</h2>
              <p className="mt-3 text-[color:var(--muted)]">После участия в live-комнате здесь появится история с реальным количеством баллов и местом в комнате.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button href="/catalog">Открыть каталог</Button>
                <Button href="/join" variant="ghost">Войти в комнату</Button>
              </div>
            </Card>
          )}
        </div>
      </section>
    </AppShell>
  );
}

