import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOPICS_DATA } from '../data/topics';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn, validating, login } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (validating) return;
    if (!isLoggedIn) handleLogin();
  }, [validating]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogin() {
    setLoginLoading(true);
    try {
      await login();
    } catch {
      alert('로그인에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setLoginLoading(false);
    }
  }

  if (validating || loginLoading || !isLoggedIn) {
    return (
      <div style={styles.center}>
        <p style={{ fontSize: 13, color: '#999' }}>잠시만 기다려 주세요...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      {/* 히어로 카드 */}
      <div style={styles.hero}>
        <p style={styles.heroTitle}>우리의 케미는? 🔍</p>
        <p style={styles.heroDesc}>밸런스 게임으로 친구와 취향을 비교해봐요</p>
        <div style={styles.steps}>
          <Step label="답변 작성" />
          <span style={styles.stepArrow}>›</span>
          <Step label="친구 초대" />
          <span style={styles.stepArrow}>›</span>
          <Step label="케미 확인" />
        </div>

      </div>

      {/* 초대 현황 / 코드 입력 */}
      <div style={styles.actionRow}>
        <button style={styles.actionBtn} onClick={() => navigate('/my-rooms')}>
          <span style={styles.actionIcon}>📋</span>
          <span style={styles.actionLabel}>초대 현황</span>
        </button>
        <button style={styles.actionBtn} onClick={() => navigate('/join')}>
          <span style={styles.actionIcon}>📬</span>
          <span style={styles.actionLabel}>코드 입력</span>
        </button>
      </div>

      {/* 주제 선택 */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>어떤 주제로 시작할까요?</p>
        <div style={styles.topicGrid}>
          {TOPICS_DATA.map((topic) => (
            <button
              key={topic.id}
              style={styles.topicCard}
              onClick={() => navigate(`/intro?topicId=${topic.id}`)}
            >
              <span style={styles.topicEmoji}>{topic.emoji}</span>
              <span style={styles.topicName}>{topic.name}</span>
              <span style={styles.topicDesc}>{topic.description}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

function Step({ label }: { label: string }) {
  return (
    <div style={styles.step}>
      <span style={styles.stepLabel}>{label}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100dvh', backgroundColor: '#f4f4f4', paddingBottom: 40 },
  center: {
    minHeight: '100dvh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 32,
  },

  // 히어로
  hero: {
    background: 'linear-gradient(135deg, #3182F6 0%, #1B64DA 100%)',
    padding: '28px 24px 24px',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 22, fontWeight: 800, color: '#fff',
    marginBottom: 6, letterSpacing: -0.3,
  },
  heroDesc: {
    fontSize: 13, color: 'rgba(255,255,255,0.82)',
    marginBottom: 20, lineHeight: 1.5,
  },
  steps: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 4, flexWrap: 'wrap' as const,
  },
  step: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, padding: '4px 10px',
  },
  stepLabel: { fontSize: 11, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' as const },
  stepArrow: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, flexShrink: 0 },

  // 액션 버튼
  actionRow: {
    display: 'flex', gap: 10, padding: '14px 16px',
  },
  actionBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '14px 12px', borderRadius: 14,
    backgroundColor: '#fff', border: '1px solid #E8F0FE',
    cursor: 'pointer', boxShadow: '0 1px 4px rgba(49,130,246,0.08)',
  },
  actionIcon: { fontSize: 18 },
  actionLabel: { fontSize: 14, fontWeight: 700, color: '#3182F6' },

  // 주제 그리드
  section: { padding: '0 16px' },
  sectionLabel: {
    fontSize: 13, fontWeight: 600, color: '#888',
    marginBottom: 12, paddingLeft: 2,
  },
  topicGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  topicCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    backgroundColor: '#fff', borderRadius: 16, padding: '18px 14px',
    border: '1.5px solid #f0f0f0', cursor: 'pointer', textAlign: 'left',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'border-color 0.15s',
  },
  topicEmoji: { fontSize: 28, marginBottom: 8 },
  topicName: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 },
  topicDesc: { fontSize: 11, color: '#aaa', lineHeight: 1.4 },
};
