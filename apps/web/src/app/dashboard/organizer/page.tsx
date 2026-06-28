import { BarChart3, History, Plus, Radio, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { UserMascot } from '@/components/mascot/UserMascot';
import { Card } from '@/components/ui/Card';
import { requireRole, UserRole } from '@/lib/auth';

export default async function OrganizerDashboardPage() {
  const user = await requireRole(UserRole.ORGANIZER);

  const cards = [
    ['Квизов', '3'],
    ['Проведено игр', '12'],
    ['Средний результат', '74%']
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
              <p className="mt-3 max-w-2xl text-[color:var(--muted)]">Создавайте вопросы, запускайте комнаты и отслеживайте результаты участников. Доступ защищён авторизацией.</p>
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
            <p className="mt-3 text-[color:var(--muted)]">Чтобы проверить live-сценарий, откройте любой свой квиз, нажмите «Запустить live», а затем подключите участника по коду комнаты.</p>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
