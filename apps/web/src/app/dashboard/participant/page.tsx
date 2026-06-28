import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { requireUser } from '@/lib/auth';

export default async function ParticipantDashboardPage() {
  const user = await requireUser();

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-sm font-black uppercase tracking-wide text-cyan">Кабинет участника</p>
        <h1 className="mt-2 text-5xl font-black">Привет, {user.name}</h1>
        <p className="mt-3 text-[color:var(--muted)]">Здесь будет история участий, лучшие результаты и персональная статистика.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card><div className="text-sm text-[color:var(--muted)]">Участий</div><div className="mt-2 text-4xl font-black">7</div></Card>
          <Card><div className="text-sm text-[color:var(--muted)]">Лучшее место</div><div className="mt-2 text-4xl font-black">#1</div></Card>
          <Card><div className="text-sm text-[color:var(--muted)]">Всего баллов</div><div className="mt-2 text-4xl font-black">14800</div></Card>
        </div>
        <div className="mt-8 flex gap-3">
          <Button href="/catalog">Открыть каталог</Button>
          <Button href="/join" variant="ghost">Войти в комнату</Button>
          <Button href="/dashboard/participant/history" variant="ghost">История</Button>
        </div>
      </section>
    </AppShell>
  );
}
