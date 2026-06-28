import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { requireUser } from '@/lib/auth';

export default async function ParticipantHistoryPage() {
  await requireUser();

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-sm font-black uppercase tracking-wide text-cyan">История участника</p>
        <h1 className="mt-2 text-5xl font-black">Пройденные квизы</h1>
        <div className="mt-8 grid gap-4">
          {['Космос и технологии', 'История веба', 'JavaScript basics'].map((item, index) => (
            <Card key={item} className="flex justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">{item}</h2>
                <p className="text-sm text-[color:var(--muted)]">Результат: {3200 - index * 420} баллов</p>
              </div>
              <div className="text-right font-black text-cyan">#{index + 1}</div>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
