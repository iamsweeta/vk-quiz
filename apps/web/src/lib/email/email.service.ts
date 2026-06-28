import nodemailer from 'nodemailer';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function getAppUrl() {
  return process.env.APP_URL || 'http://localhost:3000';
}

export function getEmailProviderLabel() {
  return process.env.EMAIL_PROVIDER || 'mailpit';
}

export function verificationEmailTemplate({ name, url }: { name: string; url: string }) {
  const safeName = name || 'друг';
  const text = `Привет, ${safeName}! Подтверди email для VK Quiz: ${url}`;
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;background:#080a12;color:#f8fafc;padding:32px;border-radius:24px;max-width:560px;margin:0 auto">
    <div style="font-size:28px;font-weight:900;margin-bottom:12px">VK <span style="color:#22d3ee">Quiz</span></div>
    <h1 style="font-size:24px;margin:0 0 12px">Подтверждение почты</h1>
    <p style="color:#cbd5e1;line-height:1.6">Привет, <b>${safeName}</b>! Нажми кнопку ниже, чтобы подтвердить email и активировать аккаунт.</p>
    <a href="${url}" style="display:inline-block;margin:20px 0;padding:14px 20px;border-radius:16px;background:linear-gradient(135deg,#22d3ee,#7c3aed);color:white;text-decoration:none;font-weight:900">Подтвердить email</a>
    <p style="color:#94a3b8;font-size:13px;line-height:1.6">Если кнопка не открывается, скопируй ссылку:<br><span style="word-break:break-all;color:#22d3ee">${url}</span></p>
  </div>`;
  return { html, text };
}

async function sendWithMailpit(input: SendEmailInput) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAILPIT_HOST || 'localhost',
    port: Number(process.env.MAILPIT_PORT || 1025),
    secure: false
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'VK Quiz <no-reply@quizpulse.local>',
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html
  });
}

async function sendWithSmtp(input: SendEmailInput) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html
  });
}

async function sendWithResend(input: SendEmailInput) {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'VK Quiz <onboarding@resend.dev>',
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend email failed: ${response.status} ${body}`);
  }
}

export async function sendEmail(input: SendEmailInput) {
  const provider = (process.env.EMAIL_PROVIDER || 'mailpit').toLowerCase();

  if (provider === 'smtp' || provider === 'brevo') return sendWithSmtp(input);
  if (provider === 'resend') return sendWithResend(input);
  return sendWithMailpit(input);
}

export async function sendVerificationEmail({ to, name, token }: { to: string; name: string; token: string }) {
  const url = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const { html, text } = verificationEmailTemplate({ name, url });

  await sendEmail({
    to,
    subject: 'Подтвердите email в VK Quiz',
    html,
    text
  });
}
