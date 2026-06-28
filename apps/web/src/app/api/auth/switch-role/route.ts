import { NextResponse } from 'next/server';
import { prisma, UserRole } from '@quizpulse/db';
import { requireUser } from '@/lib/auth';

export async function POST() {
  const user = await requireUser();
  const nextRole = user.role === UserRole.ORGANIZER ? UserRole.PARTICIPANT : UserRole.ORGANIZER;

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: nextRole },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerifiedAt: true,
      mascotType: true,
      mascotColor: true
    }
  });

  return NextResponse.json({
    user: updatedUser,
    redirectTo: nextRole === UserRole.ORGANIZER ? '/dashboard/organizer' : '/dashboard/participant'
  });
}
