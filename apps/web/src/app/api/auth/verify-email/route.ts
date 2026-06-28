import { NextResponse } from 'next/server';
import { prisma } from '@quizpulse/db';
import { setAuthCookie } from '@/lib/auth';
import { hashVerificationToken } from '@/lib/email/verification';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = String(body?.token || '');

  if (!token) return NextResponse.json({ message: 'Токен отсутствует.' }, { status: 400 });

  const tokenHash = hashVerificationToken(token);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ message: 'Ссылка подтверждения недействительна или истекла.' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { email: record.email },
    data: { emailVerifiedAt: new Date() },
    select: { id: true, name: true, email: true, role: true }
  });

  await prisma.verificationToken.deleteMany({ where: { email: record.email } });

  const response = NextResponse.json({ user });
  setAuthCookie(response, user.id);
  return response;
}
