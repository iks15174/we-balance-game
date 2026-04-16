export interface AnswerItem {
  questionId: string;
  choice: 'A' | 'B';
}

export interface RoomInfo {
  roomId: string;
  shortCode: string;
  topicId: string | null;
  isCustom: boolean;
  questionIds: string[] | null;
  questionsSnapshot: CustomQuestion[] | null;
  status: 'WAITING_B' | 'COMPLETE';
  aCompleted: boolean;
  bCompleted: boolean;
}

export interface RoomStatusInfo {
  shortCode: string;
  status: 'WAITING_B' | 'COMPLETE';
  expired: boolean;
}

export interface CustomQuestion {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
}

export interface ResultDetail {
  questionId: string;
  text: string | null;
  optionA: string | null;
  optionB: string | null;
  aChoice: 'A' | 'B' | null;
  bChoice: 'A' | 'B' | null;
  isMatch: boolean;
}

export interface MyRoom {
  shortCode: string;
  topicId: string | null;
  isCustom: boolean;
  status: 'WAITING_B' | 'COMPLETE';
  createdAt: string;
  expiresAt: string;
  otherName: string | null;
}

export interface GameResult {
  ready: boolean;
  isCustom: boolean;
  matchPercent: number;
  grade: { label: string; description: string };
  matchCount: number;
  totalCount: number;
  aName: string | null;
  bName: string | null;
  details: ResultDetail[];
}
