import { AnswerMode, QuestionType, QuizStatus, QuizVisibility } from '@quizpulse/db';

export function normalizeAccessCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '-');
}

export function normalizeStatus(value: unknown) {
  if (value === QuizStatus.DRAFT) return QuizStatus.DRAFT;
  if (value === QuizStatus.ARCHIVED) return QuizStatus.ARCHIVED;
  return QuizStatus.PUBLISHED;
}

export function normalizeQuizPayload(body: any) {
  const title = String(body?.title || '').trim();
  const description = String(body?.description || '').trim();
  const coverImageUrl = String(body?.coverImageUrl || '').trim();
  const visibility = body?.visibility === QuizVisibility.PRIVATE ? QuizVisibility.PRIVATE : QuizVisibility.PUBLIC;
  const accessCode = visibility === QuizVisibility.PRIVATE ? normalizeAccessCode(String(body?.accessCode || '')) : null;
  const defaultQuestionTime = Math.min(180, Math.max(10, Number(body?.defaultQuestionTime || 30)));
  const status = normalizeStatus(body?.status ?? (body?.publishNow === false ? QuizStatus.DRAFT : QuizStatus.PUBLISHED));
  const categoryName = String(body?.categoryName || 'Пользовательские').trim() || 'Пользовательские';

  const questionsRaw = Array.isArray(body?.questions) ? body.questions : [];
  const questions = questionsRaw.map((question: any, index: number) => {
    const text = String(question?.text || '').trim();
    const imageUrl = String(question?.imageUrl || '').trim();
    const answerMode = question?.answerMode === AnswerMode.MULTIPLE ? AnswerMode.MULTIPLE : AnswerMode.SINGLE;
    const optionsRaw = Array.isArray(question?.options) ? question.options : [];
    const options = optionsRaw
      .map((option: any, optionIndex: number) => ({
        text: String(option?.text || '').trim(),
        imageUrl: String(option?.imageUrl || '').trim() || null,
        isCorrect: Boolean(option?.isCorrect),
        order: optionIndex + 1
      }))
      .filter((option: any) => option.text.length > 0 || Boolean(option.imageUrl));

    return {
      text,
      imageUrl,
      type: imageUrl ? QuestionType.IMAGE : QuestionType.TEXT,
      answerMode,
      timeLimit: Math.min(180, Math.max(10, Number(question?.timeLimit || defaultQuestionTime))),
      points: Math.min(5000, Math.max(100, Number(question?.points || 1000))),
      order: index + 1,
      options
    };
  });

  return {
    title,
    description,
    coverImageUrl,
    visibility,
    accessCode,
    defaultQuestionTime,
    status,
    categoryName,
    questions
  };
}

export function validateQuizPayload(payload: ReturnType<typeof normalizeQuizPayload>) {
  if (payload.title.length < 3) return 'Название квиза должно быть минимум 3 символа.';
  if (payload.visibility === QuizVisibility.PRIVATE && (!payload.accessCode || payload.accessCode.length < 4)) {
    return 'Для приватного квиза нужен код доступа минимум из 4 символов.';
  }
  if (payload.questions.length === 0) return 'Добавьте хотя бы один вопрос.';
  if (payload.questions.some((question) => question.text.length < 3 && !question.imageUrl)) return 'У каждого вопроса должен быть текст или изображение.';
  if (payload.questions.some((question) => question.options.length < 2)) return 'У каждого вопроса должно быть минимум 2 варианта ответа.';
  if (payload.questions.some((question) => !question.options.some((option) => option.isCorrect))) return 'У каждого вопроса должен быть хотя бы один правильный ответ.';
  return null;
}
