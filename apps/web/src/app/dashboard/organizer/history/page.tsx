import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { requireRole, UserRole } from '@/lib/auth';
import { prisma } from '@quizpulse/db';

function getStatusLabel(status: string) {
  if (status === 'WAITING') return 'Ожидание';
  if (status === 'ACTIVE') return 'Идёт игра';
  if (status === 'FINISHED') return 'Завершена';
  return status;
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

export default async function OrganizerHistoryPage() {
  const user = await requireRole(UserRole.ORGANIZER);

  const rooms = await prisma.room.findMany({
    where: { hostId: user.id },
    include: {
      quiz: { select: { title: true } },
      participants: { select: { id: true } },
      _count: { select: { submissions: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-sm font-black uppercase tracking-wide text-cyan">История</p>
        <h1 className="mt-2 text-5xl font-black">Проведённые квизы</h1>
        <p className="mt-3 text-[color:var(--muted)]">Список строится по реальным live-комнатам организатора.</p>

        <div className="mt-8 grid gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-black">{room.quiz.title}</h2>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{formatDate(room.createdAt)} · комната {room.code} · статус: {getStatusLabel(room.status)}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm font-black">
                <span className="rounded-full bg-[color:var(--card-strong)] px-3 py-2">участников: {room.participants.length}</span>
                <span className="rounded-full bg-[color:var(--card-strong)] px-3 py-2">ответов: {room._count.submissions}</span>
              </div>
            </Card>
          ))}

          {!rooms.length && (
            <Card>
              <h2 className="text-2xl font-black">Истории игр пока нет</h2>
              <p className="mt-3 text-[color:var(--muted)]">После запуска первой live-комнаты здесь появятся реальные проведённые игры.</p>
              <div className="mt-5">
                <Button href="/dashboard/organizer/quizzes">Перейти к квизам</Button>
              </div>
            </Card>
          )}
        </div>
      </section>
    </AppShell>
  );
}

