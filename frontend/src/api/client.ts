import { AnswerItem, CustomQuestion, GameResult, MyRoom, RoomInfo, RoomStatusInfo } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4001';
const REQUEST_TIMEOUT_MS = 8000;

type RequestOptions = RequestInit & {
  cacheKey?: string;
  cacheTtlMs?: number;
};

const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const inflightRequests = new Map<string, Promise<unknown>>();

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const method = options?.method ?? 'GET';
  const cacheKey = options?.cacheKey;
  const cacheTtlMs = options?.cacheTtlMs ?? 0;

  if (cacheKey && method === 'GET') {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const inflight = inflightRequests.get(cacheKey);
    if (inflight) {
      return inflight as Promise<T>;
    }
  }

  const run = async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
        signal: controller.signal,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${data.error ?? ''}`);
      }

      if (cacheKey && method === 'GET' && cacheTtlMs > 0) {
        responseCache.set(cacheKey, {
          expiresAt: Date.now() + cacheTtlMs,
          value: data,
        });
      }

      return data as T;
    } finally {
      window.clearTimeout(timeout);
      if (cacheKey) {
        inflightRequests.delete(cacheKey);
      }
    }
  };

  if (cacheKey && method === 'GET') {
    const promise = run();
    inflightRequests.set(cacheKey, promise);
    return promise;
  }

  return run();
}

export const api = {
  authLogin(body: { authorizationCode: string; referrer: string }): Promise<{ userKey: string; name: string | null }> {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  authMe(userKey: string): Promise<{ valid: boolean }> {
    return request(`/api/auth/me?userKey=${encodeURIComponent(userKey)}`, {
      cacheKey: `auth-me:${userKey}`,
      cacheTtlMs: 5 * 60 * 1000,
    });
  },

  createRoom(body: {
    topicId: string;
    questionIds: string[];
    answers: AnswerItem[];
    userKey?: string;
  }): Promise<{ roomId: string; shortCode: string }> {
    return request('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ ...body, isCustom: false }),
    });
  },

  createCustomRoom(body: {
    customQuestions: CustomQuestion[];
    answers: AnswerItem[];
    userKey?: string;
  }): Promise<{ roomId: string; shortCode: string }> {
    return request('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ ...body, isCustom: true }),
    });
  },

  getRoom(shortCode: string): Promise<RoomInfo> {
    return request(`/api/rooms/${shortCode}`, {
      cacheKey: `room:${shortCode}`,
      cacheTtlMs: 15 * 1000,
    });
  },

  getRoomStatus(shortCode: string): Promise<RoomStatusInfo> {
    return request(`/api/rooms/${shortCode}/status`);
  },

  submitBAnswers(shortCode: string, answers: AnswerItem[], userKey?: string): Promise<{ success: boolean }> {
    return request(`/api/rooms/${shortCode}/answers`, {
      method: 'POST',
      body: JSON.stringify({ answers, userKey }),
    });
  },

  getResult(shortCode: string): Promise<GameResult> {
    return request(`/api/rooms/${shortCode}/result`);
  },

  getMyRooms(userKey: string): Promise<{ sent: MyRoom[]; received: MyRoom[] }> {
    return request(`/api/rooms/my?userKey=${encodeURIComponent(userKey)}`);
  },

  deleteRoom(shortCode: string, userKey: string): Promise<{ success: boolean }> {
    return request(`/api/rooms/${shortCode}?userKey=${encodeURIComponent(userKey)}`, {
      method: 'DELETE',
    });
  },
};
