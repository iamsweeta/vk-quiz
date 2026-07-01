import { BarChart3, History, Plus, Radio, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { UserMascot } from '@/components/mascot/UserMascot';
import { Card } from '@/components/ui/Card';
import { requireRole, UserRole } from '@/lib/auth';
import { prisma } from '@quizpulse/db';

type QuestionPoints = {
  points: number;
};

type RoomForStats = {
  status: string;
  participants: { score: number }[];
  quiz: { questions: QuestionPoints[] };
};

function getMaxScore(questions: QuestionPoints[]) {
  return questions.reduce((sum, question) => sum + question.points, 0);
}

function getAverageResult(rooms: RoomForStats[]) {
  const percentages = rooms.flatMap((room) => {
    const maxScore = getMaxScore(room.quiz.questions);
    if (room.status !== 'FINISHED' || maxScore <= 0) return [];
    return room.participants.map((participant) => Math.round((participant.score / maxScore) * 100));
  });

  if (!percentages.length) return '—';
  return Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length) + '%';
}

function getStatusLabel(status: string) {
  if (status === 'WAITING') return 'Ожидание';
  if (status === 'ACTIVE') return 'Идёт игра';
  if (status === 'FINISHED') return 'Завершена';
  return status;
}

export default async function OrganizerDashboardPage() {
  const user = await requireRole(UserRole.ORGANIZER);

  const [quizzes, rooms] = await Promise.all([
    prisma.quiz.findMany({
      where: { ownerId: user.id },
      include: {
        questions: { select: { points: true } },
        _count: { select: { rooms: true, questions: true, ratings: true } }
      },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.room.findMany({
      where: { hostId: user.id },
      include: {
        quiz: { select: { title: true, questions: { select: { points: true } } } },
        participants: { select: { score: true } },
        _count: { select: { submissions: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const finishedRooms = rooms.filter((room) => room.status === 'FINISHED').length;
  const averageResult = getAverageResult(rooms);
  const lastRoom = rooms[0];

  const cards = [
    ['Квизов', String(quizzes.length)],
    ['Проведено игр', String(finishedRooms)],
    ['Средний результат', averageResult]
  ];

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="flex items-center gap-5">
            <UserMascot type={user.mascotType} color={user.mascotColor} size="lg" className="hidden sm:inline-grid" />
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-cyan">Кабинет организатора</p>
              <h1 className="mt-2 text-4xl font-black md:text-6xl">Привет, {user.name}</h1>
              <p className="mt-3 max-w-2xl text-[color:var(--muted)]">Здесь отображаются только реальные квизы, комнаты и результаты из базы данных.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/dashboard/organizer/quizzes/new"><Plus size={18} /> Создать квиз</Button>
            <Button href="/dashboard/organizer/quizzes" variant="ghost"><Radio size={18} /> Запустить свой квиз</Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {cards.map(([label, value]) => (
            <Card key={label}>
              <div className="text-sm text-[color:var(--muted)]">{label}</div>
              <div className="mt-2 text-4xl font-black">{value}</div>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <BarChart3 className="text-cyan" />
              <h2 className="text-2xl font-black">Быстрые действия</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Button href="/dashboard/organizer/quizzes">Мои квизы</Button>
              <Button href="/catalog" variant="ghost">Публичный каталог</Button>
              <Button href="/dashboard/organizer/history" variant="ghost">История игр</Button>
              <Button href="/dashboard/organizer/analytics" variant="ghost">Аналитика</Button>
              <Button href="/dashboard/organizer/quizzes" variant="ghost">Запустить live-комнату</Button>
            </div>
          </Card>

          <Card>
            <ShieldCheck className="mb-4 text-cyan" />
            <h2 className="text-2xl font-black">Защищённый доступ</h2>
            <p className="mt-3 text-[color:var(--muted)]">Страница доступна только организаторам. Роль текущего пользователя: {user.role}.</p>
          </Card>

          <Card className="lg:col-span-3">
            <History className="mb-4 text-cyan" />
            <h2 className="text-2xl font-black">Последняя игра</h2>
            {lastRoom ? (
              <p className="mt-3 text-[color:var(--muted)]">{lastRoom.quiz.title} · статус: {getStatusLabel(lastRoom.status)} · участников: {lastRoom.participants.length} · ответов: {lastRoom._count.submissions}</p>
            ) : (
              <p className="mt-3 text-[color:var(--muted)]">Проведённых live-комнат пока нет. Создайте квиз и запустите первую игру.</p>
            )}
          </Card>
        </div>
      </section>
    </AppShell>
  );
}

