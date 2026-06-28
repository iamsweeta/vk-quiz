import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { requireRole, UserRole } from '@/lib/auth';

export default async function OrganizerHistoryPage() {
  await requireRole(UserRole.ORGANIZER);

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-sm font-black uppercase tracking-wide text-cyan">История</p>
        <h1 className="mt-2 text-5xl font-black">Проведённые квизы</h1>
        <div className="mt-8 grid gap-4">
          {['Демо-комната QZ-4821', 'Frontend Battle', 'Технологический квиз'].map((item, index) => (
            <Card key={item} className="flex justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">{item}</h2>
                <p className="text-sm text-[color:var(--muted)]">Участников: {8 + index * 3}</p>
              </div>
              <div className="text-right font-black text-cyan">#{index + 1}</div>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
