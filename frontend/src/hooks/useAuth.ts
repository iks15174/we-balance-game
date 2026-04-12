import { useState, useEffect } from 'react';
import { appLogin } from '@apps-in-toss/web-framework';
import { api } from '../api/client';

const AUTH_KEY = 'ait_user_key';
const AUTH_NAME_KEY = 'ait_user_name';

export function useAuth() {
  const [userKey, setUserKey] = useState<string | null>(() => localStorage.getItem(AUTH_KEY));
  const [userName, setUserName] = useState<string | null>(() => localStorage.getItem(AUTH_NAME_KEY));
  const [validating, setValidating] = useState<boolean>(() => !!localStorage.getItem(AUTH_KEY));

  // 앱 시작 시 저장된 userKey가 유효한지 서버에서 확인 (탈퇴 후 무효화 대응)
  useEffect(() => {
    const storedKey = localStorage.getItem(AUTH_KEY);
    if (!storedKey) return;

    api.authMe(storedKey)
      .catch((err) => {
        // 404 등 서버가 유효하지 않다고 응답하면 로그아웃
        if (err.message?.includes('404') || err.message?.includes('401')) {
          localStorage.removeItem(AUTH_KEY);
          setUserKey(null);
        }
        // 네트워크 오류 등은 기존 상태 유지 (오프라인 대응)
      })
      .finally(() => setValidating(false));
  }, []);

  async function login(): Promise<string> {
    const { authorizationCode, referrer } = await appLogin();
    const { userKey: newKey, name } = await api.authLogin({ authorizationCode, referrer });
    localStorage.setItem(AUTH_KEY, newKey);
    if (name) localStorage.setItem(AUTH_NAME_KEY, name);
    setUserKey(newKey);
    setUserName(name ?? null);
    return newKey;
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_NAME_KEY);
    setUserKey(null);
    setUserName(null);
  }

  return {
    userKey,
    userName,
    isLoggedIn: !!userKey,
    validating,
    login,
    logout,
  };
}
