import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 1_200_000;

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, message: 'Нужно войти в аккаунт.' },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, message: 'Файл не найден.' },
      { status: 400 }
    );
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { ok: false, message: 'Можно загружать только изображения.' },
      { status: 400 }
    );
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Изображение слишком большое. Выберите картинку поменьше или сделайте скриншот.'
      },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');

  return NextResponse.json({
    ok: true,
    url: `data:${file.type};base64,${base64}`
  });
}
