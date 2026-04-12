export interface AnswerItem {
  questionId: string;
  choice: 'A' | 'B';
}

// 서버 응답 타입
export interface RoomInfo {
  roomId: string;
  shortCode: string;
  topicId: string | null;
  isCustom: boolean;
  // 일반 게임: FE 로컬 룩업용 ID 배열
  questionIds: string[] | null;
  // 커스텀 게임: 질문 내용 포함
  questionsSnapshot: CustomQuestion[] | null;
  status: 'WAITING_B' | 'COMPLETE';
  aCompleted: boolean;
  bCompleted: boolean;
}

export interface CustomQuestion {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
}

// ResultDetail: 일반 게임은 text/optionA/optionB가 null → FE가 로컬 데이터로 보강
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
  details: ResultDetail[];
}
