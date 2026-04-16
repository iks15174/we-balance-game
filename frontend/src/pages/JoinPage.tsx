import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

type View = 'form' | 'deleted' | 'full';

export default function JoinPage() {
  const { shortCode: paramCode } = useParams<{ shortCode?: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, validating, login } = useAuth();
  const [code, setCode] = useState(paramCode ?? '');
  const [view, setView] = useState<View>('form');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const autoEnteredRef = useRef(false);

  useEffect(() => {
    if (!paramCode) return;
    if (validating) return;
    if (autoEnteredRef.current) return;
    autoEnteredRef.current = true;

    async function autoEnter() {
      setLoading(true);
      try {
        if (!isLoggedIn) await login();
        await enterRoom(paramCode!);
      } catch {
        setFieldError('로그인에 실패했어요. 다시 시도해 주세요.');
        setLoading(false);
      }
    }
    autoEnter();
  }, [paramCode, validating]); // eslint-disable-line react-hooks/exhaustive-deps

  async function enterRoom(targetCode: string) {
    const c = targetCode.trim().toUpperCase();
    if (!c) { setFieldError('코드를 입력해 주세요'); return; }
    setLoading(true);
    setFieldError('');
    try {
      const room = await api.getRoom(c);
      if (room.bCompleted) {
        setView('full');
        setLoading(false);
      } else {
        navigate(`/game?shortCode=${c}`);
      }
    } catch (err: any) {
      const msg: string = err.message ?? '';
      if (msg.includes('404') || msg.includes('410')) {
        setView('deleted');
      } else {
        setFieldError('방을 찾을 수 없어요');
      }
      setLoading(false);
    }
  }

  // 딥링크 자동 진입 중
  if (loading && paramCode && view === 'form') {
    return (
      <div style={s.center}>
        <p style={s.body}>잠시만 기다려 주세요...</p>
      </div>
    );
  }

  if (view === 'deleted') {
    return (
      <Page>
        <StatusCard
          badge="초대 코드 만료"
          badgeColor="#F03E3E"
          title="삭제된 방이에요"
          desc={'이 초대 코드는 더 이상 유효하지 않아요.\n방이 삭제됐거나 기간이 만료됐어요.'}
        />
        <Btn onClick={() => navigate('/')}>홈으로 돌아가기</Btn>
      </Page>
    );
  }

  if (view === 'full') {
    return (
      <Page>
        <StatusCard
          badge="참여 불가"
          badgeColor="#3182F6"
          title="이미 꽉 찬 방이에요"
          desc={'다른 사람이 이미 이 방에 참여했어요.\n새 게임을 시작해보세요.'}
        />
        <Btn onClick={() => navigate('/')}>홈으로 돌아가기</Btn>
      </Page>
    );
  }

  return (
    <Page>
      <div>
        <p style={s.title}>초대 코드 입력</p>
        <p style={{ ...s.body, marginTop: 6 }}>친구가 보낸 6자리 코드를 입력하세요</p>
      </div>

      <div style={s.card}>
        <style>{`.join-input::placeholder { color: #AAAAAA; font-size: 14px; letter-spacing: 0; }`}</style>
        <input
          className="join-input"
          style={{ ...s.codeInput, borderColor: fieldError ? '#F03E3E' : '#EBEBEB' }}
          placeholder="예: A1B2C3"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setFieldError(''); }}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        {fieldError && <p style={s.errorMsg}>{fieldError}</p>}
      </div>

      <Btn onClick={() => enterRoom(code)} disabled={loading}>
        {loading ? '확인 중...' : '게임 참여하기'}
      </Btn>
    </Page>
  );
}

// ── 공통 컴포넌트 ─────────────────────────────────────────

function Page({ children }: { children: ReactNode }) {
  return (
    <div style={s.page}>
      <div style={s.content}>{children}</div>
    </div>
  );
}

function StatusCard({ badge, badgeColor, title, desc }: {
  badge: string;
  badgeColor: string;
  title: string;
  desc: string;
}) {
  return (
    <div style={{ ...s.card, textAlign: 'center' }}>
      <span style={{
        ...s.badge,
        color: badgeColor,
        borderColor: badgeColor + '40',
        backgroundColor: badgeColor + '0F',
      }}>
        {badge}
      </span>
      <p style={{ ...s.title, marginTop: 20, marginBottom: 10 }}>{title}</p>
      <p style={{ ...s.body, whiteSpace: 'pre-line' }}>{desc}</p>
    </div>
  );
}

function Btn({ children, onClick, disabled }: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      style={{ ...s.primaryBtn, opacity: disabled ? 0.6 : 1 }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// ── 스타일 ────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    backgroundColor: '#F7F8FA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 20px',
  },
  center: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8FA',
  },
  content: {
    width: '100%',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  // 타이포그래피 (4단계)
  title: { fontSize: 22, fontWeight: 800, color: '#111111', lineHeight: 1.3 },
  body:  { fontSize: 14, color: '#666666', lineHeight: 1.6 },
  badge: { fontSize: 12, fontWeight: 600, display: 'inline-block', padding: '4px 10px', borderRadius: 20, border: '1px solid', letterSpacing: 0.2 },
  errorMsg: { fontSize: 12, color: '#F03E3E', marginTop: 8, textAlign: 'center' },

  // 컴포넌트
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    border: '1px solid #EBEBEB',
  },
  codeInput: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    border: '1.5px solid',
    fontSize: 22,
    fontWeight: 700,
    textAlign: 'center',
    letterSpacing: 6,
    color: '#111111',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#FFFFFF',
    display: 'block',
  },
  primaryBtn: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    border: 'none',
    backgroundColor: '#3182F6',
    fontSize: 16,
    fontWeight: 700,
    color: '#FFFFFF',
    cursor: 'pointer',
    outline: 'none',
  },
};
