import { AppShell } from '@/components/layout/AppShell';
import { HostRoomClient } from '@/features/live/HostRoomClient';
import { requireRole, UserRole } from '@/lib/auth';

export default async function HostRoomPage() {
  await requireRole(UserRole.ORGANIZER);

  return (
    <AppShell>
      <HostRoomClient />
    </AppShell>
  );
}
