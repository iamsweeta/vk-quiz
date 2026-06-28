import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@quizpulse/db';

const TOKEN_TTL_HOURS = 24;

export function hashVerificationToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createVerificationToken(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashVerificationToken(rawToken);

  await prisma.verificationToken.deleteMany({ where: { email: normalizedEmail } });
  await prisma.verificationToken.create({
    data: {
      email: normalizedEmail,
      tokenHash,
      expiresAt: new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000)
    }
  });

  return rawToken;
}
