'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  FileText,
  ImagePlus,
  Loader2,
  LockKeyhole,
  Plus,
  Radio,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { QuizFallbackCover } from '@/components/quiz/QuizFallbackCover';

type Visibility = 'PUBLIC' | 'PRIVATE';
type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type AnswerMode = 'SINGLE' | 'MULTIPLE';

type DraftOption = {
  clientId: string;
  text: string;
  imageUrl: string;
  isCorrect: boolean;
};

type DraftQuestion = {
  clientId: string;
  text: string;
  imageUrl: string;
  answerMode: AnswerMode;
  timeLimit: number;
  points: number;
  options: DraftOption[];
};

const CATEGORY_OPTIONS = [
  'Технологии',
  'Наука',
  'История',
  'География',
  'Космос',
  'Искусство',
  'Кино и сериалы',
  'Музыка',
  'Спорт',
  'Литература',
  'Игры',
  'Бизнес',
  'Медицина',
  'Образование',
  'Еда и культура',
  'Другое'
];

export type QuizBuilderInitialData = {
  id?: string;
  title: string;
  description: string;
  coverImageUrl: string;
  defaultQuestionTime: number;
  visibility: Visibility;
  accessCode: string;
  status: Status;
  categoryName: string;
  questions: DraftQuestion[];
};

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createOption(index: number, correct = false): DraftOption {
  return {
    clientId: uid('option'),
    text: `Вариант ${index + 1}`,
    imageUrl: '',
    isCorrect: correct
  };
}

function createQuestion(index: number): DraftQuestion {
  return {
    clientId: uid('question'),
    text: `Вопрос ${index + 1}`,
    imageUrl: '',
    answerMode: 'SINGLE',
    timeLimit: 30,
    points: 1000,
    options: [createOption(0, true), createOption(1), createOption(2), createOption(3)]
  };
}

export const defaultQuizBuilderData: QuizBuilderInitialData = {
  title: 'Новый квиз',
  description: 'Краткое описание квиза для каталога.',
  coverImageUrl: '',
  defaultQuestionTime: 30,
  visibility: 'PUBLIC',
  accessCode: 'MY-PRIVATE-CODE',
  status: 'PUBLISHED',
  categoryName: 'Другое',
  questions: [createQuestion(0)]
};

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Не удалось прочитать изображение.'));
    };

    image.src = objectUrl;
  });
}

async function compressImageForUpload(file: File) {
  if (!file.type.startsWith('image/')) return file;

  const image = await loadImageFromFile(file);

  const maxSide = 1400;
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = largestSide > maxSide ? maxSide / largestSide : 1;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext('2d');

  if (!context) return file;

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Не удалось подготовить изображение.'));
      },
      'image/jpeg',
      0.78
    );
  });

  const safeName = file.name.replace(/\.[^.]+$/, '') || 'image';

  return new File([blob], `${safeName}.jpg`, {
    type: 'image/jpeg'
  });
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Не удалось прочитать изображение.'));
    };

    image.src = objectUrl;
  });
}

async function compressImageForUpload(file: File) {
  if (!file.type.startsWith('image/')) return file;

  const image = await loadImageFromFile(file);

  const maxSide = 1400;
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = largestSide > maxSide ? maxSide / largestSide : 1;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext('2d');

  if (!context) return file;

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Не удалось подготовить изображение.'));
      },
      'image/jpeg',
      0.78
    );
  });

  const safeName = file.name.replace(/\.[^.]+$/, '') || 'image';

  return new File([blob], `${safeName}.jpg`, {
    type: 'image/jpeg'
  });
}

async function uploadImage(file: File) {
  const preparedFile = await compressImageForUpload(file);

  const formData = new FormData();
  formData.append('file', preparedFile);

  const response = await fetch('/api/uploads', {
    method: 'POST',
    body: formData
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Не удалось загрузить изображение.');
  }

  return String(data.url);
}



function normalizeNumber(value: number, min: number, max: number, fallback: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}


function parseImportedQuestions(raw: string, defaultTime: number): DraftQuestion[] {
  const blocks = raw
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, blockIndex) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const questionText = (lines.shift() || `Вопрос ${blockIndex + 1}`).replace(/^\d+[.)]\s*/, '');
    const options = lines.map((line, optionIndex) => {
      const isCorrect = /^(\*|\+|\[x\]|правильно:)/i.test(line);
      const text = line.replace(/^(\*|\+|-|\[x\]|\[ \]|правильно:)\s*/i, '').trim() || `Вариант ${optionIndex + 1}`;
      return {
        clientId: uid('option'),
        text,
        imageUrl: '',
        isCorrect
      };
    }).filter((option) => option.text);

    const safeOptions = options.length >= 2 ? options : [createOption(0, true), createOption(1)];
    if (!safeOptions.some((option) => option.isCorrect)) safeOptions[0].isCorrect = true;

    return {
      clientId: uid('question'),
      text: questionText,
      imageUrl: '',
      answerMode: safeOptions.filter((option) => option.isCorrect).length > 1 ? 'MULTIPLE' : 'SINGLE',
      timeLimit: normalizeNumber(defaultTime, 10, 180, 30),
      points: 1000,
      options: safeOptions
    };
  });
}

export function QuizBuilderForm({
  mode,
  initialData = defaultQuizBuilderData
}: {
  mode: 'create' | 'edit';
  initialData?: QuizBuilderInitialData;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [coverImageUrl, setCoverImageUrl] = useState(initialData.coverImageUrl);
  const [defaultQuestionTime, setDefaultQuestionTime] = useState(initialData.defaultQuestionTime);
  const [visibility, setVisibility] = useState<Visibility>(initialData.visibility);
  const [accessCode, setAccessCode] = useState(initialData.accessCode);
  const [status, setStatus] = useState<Status>(initialData.status);
  const [categoryName, setCategoryName] = useState(initialData.categoryName || 'Другое');
  const [questions, setQuestions] = useState<DraftQuestion[]>(initialData.questions.length ? initialData.questions : [createQuestion(0)]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [dirtyBaseline, setDirtyBaseline] = useState('');

  const visibilityHint = useMemo(() => {
    if (visibility === 'PUBLIC') return 'Публичный квиз появится в каталоге и будет доступен для самостоятельного прохождения.';
    return 'Приватный квиз скрыт из каталога. Его можно открыть только по коду доступа или прямой ссылке.';
  }, [visibility]);

  const currentDraftSnapshot = useMemo(() => JSON.stringify({
    title,
    description,
    coverImageUrl,
    defaultQuestionTime,
    visibility,
    accessCode,
    status,
    categoryName,
    questions
  }), [title, description, coverImageUrl, defaultQuestionTime, visibility, accessCode, status, categoryName, questions]);

  const initializedDirtyBaseline = useRef(false);

  useEffect(() => {
    if (initializedDirtyBaseline.current) return;
    initializedDirtyBaseline.current = true;
    setDirtyBaseline(currentDraftSnapshot);
  }, [currentDraftSnapshot]);

  const hasUnsavedChanges = Boolean(dirtyBaseline && dirtyBaseline !== currentDraftSnapshot);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }

    function captureLinkClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const link = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!link) return;
      if (link.target === '_blank' || link.download) return;
      if (link.origin !== window.location.origin) return;
      if (link.pathname === window.location.pathname && link.search === window.location.search) return;

      const shouldLeave = window.confirm('Есть несохранённые изменения. Уйти без сохранения? Чтобы сохранить черновик, нажмите «Отмена» и используйте кнопку «Сохранить черновик».');
      if (!shouldLeave) event.preventDefault();
    }

    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', captureLinkClick, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', captureLinkClick, true);
    };
  }, [hasUnsavedChanges]);

  function addQuestion() {
    setQuestions((items) => [...items, createQuestion(items.length)]);
  }

  function removeQuestion(clientId: string) {
    setQuestions((items) => (items.length === 1 ? items : items.filter((question) => question.clientId !== clientId)));
  }

  function moveQuestion(clientId: string, direction: -1 | 1) {
    setQuestions((items) => {
      const index = items.findIndex((question) => question.clientId === clientId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return items;
      const copy = [...items];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy;
    });
  }

  function updateQuestion(clientId: string, patch: Partial<DraftQuestion>) {
    setQuestions((items) => items.map((question) => (question.clientId === clientId ? { ...question, ...patch } : question)));
  }

  function addOption(questionId: string) {
    setQuestions((items) => items.map((question) => question.clientId === questionId
      ? { ...question, options: [...question.options, createOption(question.options.length)] }
      : question));
  }

  function removeOption(questionId: string, optionId: string) {
    setQuestions((items) => items.map((question) => {
      if (question.clientId !== questionId || question.options.length <= 2) return question;
      const nextOptions = question.options.filter((option) => option.clientId !== optionId);
      if (!nextOptions.some((option) => option.isCorrect)) nextOptions[0].isCorrect = true;
      return { ...question, options: nextOptions };
    }));
  }

  function updateOption(questionId: string, optionId: string, patch: Partial<DraftOption>) {
    setQuestions((items) => items.map((question) => question.clientId === questionId
      ? { ...question, options: question.options.map((option) => (option.clientId === optionId ? { ...option, ...patch } : option)) }
      : question));
  }

  function toggleCorrect(questionId: string, optionId: string) {
    setQuestions((items) => items.map((question) => {
      if (question.clientId !== questionId) return question;
      if (question.answerMode === 'SINGLE') {
        return { ...question, options: question.options.map((option) => ({ ...option, isCorrect: option.clientId === optionId })) };
      }
      const nextOptions = question.options.map((option) => option.clientId === optionId ? { ...option, isCorrect: !option.isCorrect } : option);
      return { ...question, options: nextOptions };
    }));
  }

  function changeAnswerMode(questionId: string, answerMode: AnswerMode) {
    setQuestions((items) => items.map((question) => {
      if (question.clientId !== questionId) return question;
      if (answerMode === 'SINGLE') {
        let correctWasSet = false;
        const hasCorrect = question.options.some((option) => option.isCorrect);
        return {
          ...question,
          answerMode,
          options: question.options.map((option, optionIndex) => {
            if ((option.isCorrect || (!hasCorrect && optionIndex === 0)) && !correctWasSet) {
              correctWasSet = true;
              return { ...option, isCorrect: true };
            }
            return { ...option, isCorrect: false };
          })
        };
      }
      return { ...question, answerMode };
    }));
  }

  async function onCoverFile(file?: File) {
    if (!file) return;
    setUploading('cover');
    setError('');
    try {
      setCoverImageUrl(await uploadImage(file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Не удалось загрузить изображение.');
    } finally {
      setUploading(null);
    }
  }

  function importQuestionsFromText(mode: 'append' | 'replace') {
    const parsed = parseImportedQuestions(importText, defaultQuestionTime);
    if (!parsed.length) {
      setError('Вставьте вопросы: первая строка — вопрос, ниже варианты. Правильный вариант пометьте * или +.');
      return;
    }
    setQuestions((items) => (mode === 'replace' ? parsed : [...items, ...parsed]));
    setImportText('');
    setSuccess(`Импортировано вопросов: ${parsed.length}. Проверьте правильные ответы перед сохранением.`);
  }

  async function onQuestionFile(questionId: string, file?: File) {
    if (!file) return;
    setUploading(`question-${questionId}`);
    setError('');
    try {
      updateQuestion(questionId, { imageUrl: await uploadImage(file) });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Не удалось загрузить изображение.');
    } finally {
      setUploading(null);
    }
  }

  function buildPayload(forcedStatus?: Status) {
    return {
      title,
      description,
      coverImageUrl,
      defaultQuestionTime: normalizeNumber(defaultQuestionTime, 10, 180, 30),
      visibility,
      accessCode,
      status: forcedStatus || status,
      categoryName,
      questions: questions.map((question) => ({
        text: question.text,
        imageUrl: question.imageUrl,
        answerMode: question.answerMode,
        timeLimit: normalizeNumber(question.timeLimit, 10, 180, defaultQuestionTime || 30),
        points: normalizeNumber(question.points, 100, 5000, 1000),
        options: question.options.map((option) => ({
          text: option.text,
          imageUrl: option.imageUrl,
          isCorrect: option.isCorrect
        }))
      }))
    };
  }

  async function createRoomForQuiz(quizId: string) {
    const response = await fetch(`/api/quizzes/${quizId}/rooms`, { method: 'POST' });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || 'Не удалось создать live-комнату.');
    return String(data.roomCode);
  }

  async function saveQuiz(launchAfterSave = false, forcedStatus?: Status, stayOnPage = false) {
    setError('');
    setSuccess('');
    setSaving(true);

    const payload = buildPayload(forcedStatus);
    const response = await fetch(mode === 'edit' && initialData.id ? `/api/quizzes/${initialData.id}` : '/api/quizzes', {
      method: mode === 'edit' ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setSaving(false);
      setError(data?.message || 'Не удалось сохранить квиз.');
      return;
    }

    setDirtyBaseline(JSON.stringify({
      title,
      description,
      coverImageUrl,
      defaultQuestionTime,
      visibility,
      accessCode,
      status: forcedStatus || status,
      categoryName,
      questions
    }));

    try {
      if (launchAfterSave) {
        const quizId = mode === 'edit' ? initialData.id : data.quiz?.id;
        const roomCode = data.roomCode || (quizId ? await createRoomForQuiz(quizId) : null);
        if (!roomCode) throw new Error('Комната не была создана.');
        window.location.assign(`/host/${roomCode}`);
        return;
      }

      setSaving(false);
      setSuccess(forcedStatus === 'DRAFT' ? 'Черновик сохранён.' : mode === 'edit' ? 'Изменения сохранены.' : `Квиз создан. Комната: ${data.roomCode}`);
      router.refresh();

      if (mode === 'create' && data.quiz?.id) {
        setTimeout(() => router.push(`/dashboard/organizer/quizzes/${data.quiz.id}/edit`), 700);
        return;
      }

      if (!stayOnPage) setTimeout(() => router.push('/dashboard/organizer/quizzes'), 700);
    } catch (launchError) {
      setSaving(false);
      setError(launchError instanceof Error ? launchError.message : 'Не удалось запустить комнату.');
    }
  }

  async function deleteQuiz() {
    if (mode !== 'edit' || !initialData.id) return;
    const confirmed = window.confirm('Удалить квиз вместе с вопросами и комнатами? Это действие нельзя отменить.');
    if (!confirmed) return;

    setSaving(true);
    const response = await fetch(`/api/quizzes/${initialData.id}`, { method: 'DELETE' });
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.message || 'Не удалось удалить квиз.');
      return;
    }

    router.push('/dashboard/organizer/quizzes');
    router.refresh();
  }

  return (
    <>
      <Card className="mt-8 overflow-hidden p-0">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold md:col-span-2">
                Название
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Название квиза" />
              </label>
              <label className="grid gap-2 text-sm font-bold md:col-span-2">
                Описание
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Краткое описание" className="min-h-28 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--input)] px-4 py-3 text-[color:var(--foreground)] outline-none focus:border-cyan focus:ring-4 focus:ring-cyan/10" />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Статус
                <select value={status} onChange={(event) => setStatus(event.target.value as Status)} className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--input)] px-4 py-3 text-[color:var(--foreground)] outline-none focus:border-cyan focus:ring-4 focus:ring-cyan/10">
                  <option value="DRAFT">Черновик</option>
                  <option value="PUBLISHED">Опубликован</option>
                  <option value="ARCHIVED">Архив</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Время по умолчанию, сек.
                <Input type="number" min={10} max={180} value={defaultQuestionTime} onChange={(event) => setDefaultQuestionTime(Number(event.target.value))} />
              </label>
              <label className="grid gap-2 text-sm font-bold md:col-span-2">
                Категория
                <select value={categoryName} onChange={(event) => setCategoryName(event.target.value)} className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--input)] px-4 py-3 text-[color:var(--foreground)] outline-none focus:border-cyan focus:ring-4 focus:ring-cyan/10">
                  {CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-5">
              <div className="mb-2 text-sm font-bold">Доступ</div>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] p-1">
                <button type="button" onClick={() => setVisibility('PUBLIC')} className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${visibility === 'PUBLIC' ? 'bg-[color:var(--card-strong)] text-[color:var(--foreground)] shadow-soft' : 'text-[color:var(--muted)]'}`}>
                  <Eye size={16} /> Публичный
                </button>
                <button type="button" onClick={() => setVisibility('PRIVATE')} className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${visibility === 'PRIVATE' ? 'bg-[color:var(--card-strong)] text-[color:var(--foreground)] shadow-soft' : 'text-[color:var(--muted)]'}`}>
                  <LockKeyhole size={16} /> Приватный
                </button>
              </div>
              <p className="mt-3 text-sm text-[color:var(--muted)]">{visibilityHint}</p>
            </div>

            {visibility === 'PRIVATE' && (
              <label className="mt-5 grid gap-2 text-sm font-bold">
                Код доступа к приватному квизу
                <Input value={accessCode} onChange={(event) => setAccessCode(event.target.value.toUpperCase())} />
              </label>
            )}
          </div>

          <div className="border-t border-[color:var(--border)] bg-[color:var(--glass)] p-6 lg:border-l lg:border-t-0">
            <div className="mb-3 text-sm font-black uppercase tracking-wide text-cyan">Обложка квиза</div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(34,211,238,.22),rgba(124,58,237,.2))]">
              {coverImageUrl ? (
                <img src={coverImageUrl} alt="Обложка квиза" className="h-full w-full object-cover" />
              ) : (
                <QuizFallbackCover title={title || 'Новый квиз'} category={categoryName || (visibility === 'PUBLIC' ? 'Публичный' : 'Приватный')} compact />
              )}
            </div>
            <label className="mt-4 block">
              <span className="sr-only">Загрузить обложку</span>
              <input type="file" accept="image/*" onChange={(event) => onCoverFile(event.target.files?.[0])} className="block w-full text-sm text-[color:var(--muted)] file:mr-4 file:rounded-xl file:border-0 file:bg-cyan/10 file:px-4 file:py-2 file:font-black file:text-cyan" />
            </label>
            <Input className="mt-3" value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} placeholder="Или URL изображения" />
            {coverImageUrl && <Button className="mt-3 w-full" variant="ghost" onClick={() => setCoverImageUrl('')}>Убрать обложку</Button>}
            {uploading === 'cover' && <p className="mt-2 flex items-center gap-2 text-sm text-cyan"><Loader2 className="animate-spin" size={16} /> Загружаем...</p>}
          </div>
        </div>
      </Card>


      <Card className="mt-6">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan/10 text-cyan">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black">Импорт вопросов из текста</h2>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
              Вставьте блоками: первая строка — вопрос, ниже варианты. Правильные варианты помечайте звёздочкой или плюсом.
            </p>
          </div>
        </div>
        <textarea
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder={"Столица Франции?\n* Париж\nБерлин\nМадрид\n\nКакие технологии относятся к frontend?\n* HTML\n* CSS\n* JavaScript\nPostgreSQL"}
          className="mt-4 min-h-44 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--input)] px-4 py-3 font-mono text-sm text-[color:var(--foreground)] outline-none focus:border-cyan focus:ring-4 focus:ring-cyan/10"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="ghost" onClick={() => importQuestionsFromText('append')} disabled={!importText.trim()}>Добавить к вопросам</Button>
          <Button type="button" onClick={() => importQuestionsFromText('replace')} disabled={!importText.trim()}>Заменить вопросы</Button>
        </div>
      </Card>

      <div className="mt-6 grid gap-4">
        {questions.map((question, index) => (
          <Card key={question.clientId}>
            <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-[color:var(--muted)]">Позиция {index + 1}</div>
                <h2 className="text-2xl font-black">Вопрос {index + 1}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={index === 0} className="rounded-2xl bg-[color:var(--glass)] p-3 text-[color:var(--muted)] disabled:opacity-40" onClick={() => moveQuestion(question.clientId, -1)} aria-label="Поднять вопрос">
                  <ArrowUp size={18} />
                </button>
                <button type="button" disabled={index === questions.length - 1} className="rounded-2xl bg-[color:var(--glass)] p-3 text-[color:var(--muted)] disabled:opacity-40" onClick={() => moveQuestion(question.clientId, 1)} aria-label="Опустить вопрос">
                  <ArrowDown size={18} />
                </button>
                <select value={question.answerMode} onChange={(event) => changeAnswerMode(question.clientId, event.target.value as AnswerMode)} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--input)] px-3 py-2 text-sm font-bold text-[color:var(--foreground)]">
                  <option value="SINGLE">Один ответ</option>
                  <option value="MULTIPLE">Несколько ответов</option>
                </select>
                <button type="button" className="rounded-2xl bg-[color:var(--glass)] p-3 text-[color:var(--muted)] hover:bg-danger/10 hover:text-danger" onClick={() => removeQuestion(question.clientId)} aria-label="Удалить вопрос">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_160px_160px]">
              <label className="grid gap-2 text-sm font-bold">
                Текст вопроса {question.imageUrl && <span className="font-medium text-[color:var(--muted)]">необязательно, если есть картинка</span>}
                <Input value={question.text} onChange={(event) => updateQuestion(question.clientId, { text: event.target.value })} placeholder="Можно оставить пустым, если вопрос задан картинкой" />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Время, сек.
                <Input type="number" min={10} max={180} value={question.timeLimit} onChange={(event) => updateQuestion(question.clientId, { timeLimit: Number(event.target.value) })} />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Баллы
                <Input type="number" min={100} max={5000} value={question.points} onChange={(event) => updateQuestion(question.clientId, { points: Number(event.target.value) })} />
              </label>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
              <div>
                <div className="mb-2 text-sm font-bold">Картинка к вопросу, опционально</div>
                <div className="flex flex-col gap-3 rounded-3xl border border-dashed border-cyan/35 bg-cyan/10 p-4 text-sm text-cyan">
                  <label className="flex cursor-pointer items-center gap-3 font-bold">
                    <ImagePlus size={22} />
                    <span>Загрузить изображение</span>
                    <input type="file" accept="image/*" onChange={(event) => onQuestionFile(question.clientId, event.target.files?.[0])} className="sr-only" />
                  </label>
                  <Input value={question.imageUrl} onChange={(event) => updateQuestion(question.clientId, { imageUrl: event.target.value })} placeholder="Или URL изображения" />
                  {question.imageUrl && <Button variant="ghost" onClick={() => updateQuestion(question.clientId, { imageUrl: '' })}>Убрать картинку</Button>}
                  {uploading === `question-${question.clientId}` && <p className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Загружаем...</p>}
                </div>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--glass)]">
                {question.imageUrl ? <img src={question.imageUrl} alt={question.text || 'Картинка вопроса'} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-[color:var(--muted)]">Без картинки</div>}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black">Варианты ответа</div>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">Одиночный выбор: полный балл за правильный ответ. Multiple-choice: частичный балл за правильные варианты и штраф за лишние.</p>
                </div>
                <Button variant="ghost" onClick={() => addOption(question.clientId)}><Plus size={18} /> Вариант</Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {question.options.map((option, optionIndex) => (
                  <div key={option.clientId} className={`rounded-2xl border p-4 transition ${option.isCorrect ? 'border-success/40 bg-success/10' : 'border-[color:var(--border)] bg-[color:var(--glass)]'}`}>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => toggleCorrect(question.clientId, option.clientId)} className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition ${option.isCorrect ? 'border-success bg-success text-white' : 'border-[color:var(--border)] text-[color:var(--muted)]'}`} aria-label="Отметить правильный ответ">
                        <CheckCircle2 size={17} />
                      </button>
                      <Input value={option.text} onChange={(event) => updateOption(question.clientId, option.clientId, { text: event.target.value })} placeholder={`Вариант ${optionIndex + 1}`} />
                      <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[color:var(--muted)] hover:bg-danger/10 hover:text-danger disabled:opacity-40" disabled={question.options.length <= 2} onClick={() => removeOption(question.clientId, option.clientId)} aria-label="Удалить вариант">
                        <Trash2 size={17} />
                      </button>
                    </div>
                    <Input className="mt-3" value={option.imageUrl} onChange={(event) => updateOption(question.clientId, option.clientId, { imageUrl: event.target.value })} placeholder="URL картинки варианта, опционально" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {hasUnsavedChanges && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-[color:var(--foreground)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <b>Есть несохранённые изменения.</b>
            <p className="mt-1 text-[color:var(--muted)]">Перед выходом со страницы сохраните квиз или черновик, чтобы не потерять данные.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => saveQuiz(false, 'DRAFT', true)} disabled={saving}>Сохранить черновик</Button>
            <Button onClick={() => saveQuiz(false, undefined, true)} disabled={saving}>Сохранить</Button>
          </div>
        </div>
      )}

      {error && <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm font-bold text-danger">{error}</div>}
      {success && <div className="mt-6 rounded-2xl border border-success/20 bg-success/10 p-4 text-sm font-bold text-success">{success}</div>}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={addQuestion} variant="ghost"><Plus size={18} /> Добавить вопрос</Button>
        <Button onClick={() => saveQuiz(false, 'DRAFT', true)} disabled={saving} variant="ghost">Сохранить черновик</Button>
        <Button onClick={() => saveQuiz(false)} disabled={saving}>{saving ? 'Сохраняем...' : mode === 'edit' ? 'Сохранить изменения' : 'Создать квиз'}</Button>
        <Button onClick={() => saveQuiz(true)} disabled={saving} variant="ghost"><Radio size={18} /> {saving ? 'Готовим...' : 'Сохранить и запустить live'}</Button>
        {mode === 'edit' && <Button onClick={deleteQuiz} disabled={saving} variant="danger"><Trash2 size={18} /> Удалить квиз</Button>}
      </div>
    </>
  );
}
