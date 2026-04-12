import { AnswerItem, CustomQuestion, GameResult, RoomInfo } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  // 로그인: authorizationCode + referrer → userKey
  authLogin(body: { authorizationCode: string; referrer: string }): Promise<{ userKey: string }> {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // localStorage의 userKey가 아직 유효한지 확인
  authMe(userKey: string): Promise<{ valid: boolean }> {
    return request(`/api/auth/me?userKey=${encodeURIComponent(userKey)}`);
  },

  // 일반 게임 방 생성 (A)
  createRoom(body: {
    topicId: string;
    questionIds: string[];
    answers: AnswerItem[];
  }): Promise<{ roomId: string; shortCode: string }> {
    return request('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ ...body, isCustom: false }),
    });
  },

  // 커스텀 게임 방 생성 (A)
  createCustomRoom(body: {
    customQuestions: CustomQuestion[];
    answers: AnswerItem[];
  }): Promise<{ roomId: string; shortCode: string }> {
    return request('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ ...body, isCustom: true }),
    });
  },

  getRoom(shortCode: string): Promise<RoomInfo> {
    return request(`/api/rooms/${shortCode}`);
  },

  submitBAnswers(shortCode: string, answers: AnswerItem[]): Promise<{ success: boolean }> {
    return request(`/api/rooms/${shortCode}/answers`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  getResult(shortCode: string): Promise<GameResult> {
    return request(`/api/rooms/${shortCode}/result`);
  },
};
