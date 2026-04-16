import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function JoinPage() {
  const { shortCode: paramCode } = useParams<{ shortCode?: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, validating, login } = useAuth();
  const [code, setCode] = useState(paramCode ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const autoEnteredRef = useRef(false);

  // 딥링크 자동 진입: 로그인 완료 후 게임으로 이동
  useEffect(() => {
    if (!paramCode) return;
    if (validating) return; // 인증 확인 대기
    if (autoEnteredRef.current) return;
    autoEnteredRef.current = true;

    async function autoEnter() {
      setLoading(true);
      try {
        if (!isLoggedIn) await login();
        await handleEnter(paramCode);
      } catch {
        setError('로그인에 실패했어요. 다시 시도해 주세요.');
        setLoading(false);
      }
    }
    autoEnter();
  }, [paramCode, validating]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleEnter(targetCode?: string) {
    const c = (targetCode ?? code).trim().toUpperCase();
    if (!c) { setError('코드를 입력해 주세요'); return; }
    setLoading(true);
    setError('');
    try {
      const room = await api.getRoom(c);
      if (room.bCompleted) {
        navigate(`/result/${c}`);
      } else {
        navigate(`/game?shortCode=${c}`);
      }
    } catch (err: any) {
      setError(err.message ?? '방을 찾을 수 없어요');
      setLoading(false);
    }
  }

  if (loading && paramCode) {
    return (
      <div style={styles.container}>
        <p style={{ fontSize: 14, color: '#999' }}>잠시만 기다려 주세요...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* placeholder 폰트 크기 분리 */}
      <style>{`.join-input::placeholder { font-size: 14px; letter-spacing: 0; color: #bbb; }`}</style>

      <div style={styles.content}>
        <div style={styles.emoji}>📬</div>
        <h2 style={styles.title}>초대 코드 입력</h2>
        <p style={styles.desc}>
          친구가 보낸 초대 코드를 입력하면<br />
          같은 문제를 풀 수 있어요!
        </p>

        <input
          className="join-input"
          style={styles.input}
          placeholder="6자리 코드 (예: A1B2C3)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={() => handleEnter()}
          disabled={loading}
        >
          {loading ? '확인 중...' : '게임 시작'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh', backgroundColor: '#f4f4f4',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  content: { width: '100%', maxWidth: 340, textAlign: 'center' },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 8 },
  desc: { fontSize: 14, color: '#888', lineHeight: 1.7, marginBottom: 28 },
  input: {
    width: '100%', padding: '16px', borderRadius: 14,
    border: '2px solid #ddd', fontSize: 22, fontWeight: 700,
    textAlign: 'center', letterSpacing: 6, color: '#111',
    outline: 'none', marginBottom: 8, boxSizing: 'border-box',
  },
  error: { fontSize: 13, color: '#FF4444', marginBottom: 8 },
  btn: {
    width: '100%', padding: 16, borderRadius: 14, border: 'none',
    backgroundColor: '#3182F6', fontSize: 16, fontWeight: 700, color: '#fff',
    cursor: 'pointer', marginTop: 8, outline: 'none',
  },
};
