import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';

// /join/:shortCode 라우트에서 진입 (딥링크 또는 직접 접근)
// 코드가 없으면 수동 입력 폼 표시
export default function JoinPage() {
  const { shortCode: paramCode } = useParams<{ shortCode?: string }>();
  const navigate = useNavigate();
  const [code, setCode] = useState(paramCode ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 딥링크로 코드가 바로 전달된 경우 자동 진입
  useEffect(() => {
    if (paramCode) handleEnter(paramCode);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleEnter(targetCode?: string) {
    const c = (targetCode ?? code).trim().toUpperCase();
    if (!c) { setError('코드를 입력해 주세요'); return; }
    setLoading(true);
    setError('');
    try {
      const room = await api.getRoom(c);
      if (room.bCompleted) {
        // B가 이미 완료했으면 결과 페이지로
        navigate(`/result/${c}`);
      } else {
        navigate(`/game?shortCode=${c}`);
      }
    } catch (err: any) {
      setError(err.message ?? '방을 찾을 수 없어요');
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.emoji}>📬</div>
        <h2 style={styles.title}>초대 코드 입력</h2>
        <p style={styles.desc}>
          친구가 보낸 초대 코드를 입력하면<br />
          같은 문제를 풀 수 있어요!
        </p>

        <input
          style={styles.input}
          placeholder="6자리 코드 입력 (예: A1B2C3)"
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
          {loading ? '확인 중...' : '게임 시작 →'}
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
    outline: 'none', marginBottom: 8,
  },
  error: { fontSize: 13, color: '#FF4444', marginBottom: 8 },
  btn: {
    width: '100%', padding: 16, borderRadius: 14, border: 'none',
    backgroundColor: '#3182F6', fontSize: 16, fontWeight: 700, color: '#fff',
    cursor: 'pointer', marginTop: 8,
  },
};
