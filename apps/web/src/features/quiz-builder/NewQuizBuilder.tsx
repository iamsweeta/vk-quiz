'use client';

import { QuizBuilderForm, defaultQuizBuilderData } from './QuizBuilderForm';

export function NewQuizBuilder() {
  return <QuizBuilderForm mode="create" initialData={defaultQuizBuilderData} />;
}
