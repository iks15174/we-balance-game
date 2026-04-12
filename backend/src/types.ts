export interface QuestionSnapshot {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  imageUrl?: string | null;
  order: number;
}

export interface AnswerItem {
  questionId: string;
  choice: 'A' | 'B';
}
