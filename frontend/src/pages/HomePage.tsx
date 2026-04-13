import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { TOPICS_DATA } from '../data/topics';
import { useAuth } from '../hooks/useAuth';

// 커스텀 게임은 추후 구현 예정
const CUSTOM_AD_GROUP_ID = import.meta.env.VITE_REWARDED_AD_GROUP_ID ?? 'ait.dev.43daa14da3ae487b';
void CUSTOM_AD_GROUP_ID; void loadFullScreenAd; void showFullScreenAd;

export default function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn, validating, login } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);

  // 로그인 검증 완료 후 미로그인이면 자동으로 로그인 시도
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

  // 검증 중이거나 로그인 시도 중이거나 아직 로그인 안 된 상태면 진입 차단
  if (validating || loginLoading || !isLoggedIn) {
    return (
      <div style={styles.center}>
        <p style={{ fontSize: 13, color: '#999' }}>잠시만 기다려 주세요...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 상단 간략 설명 */}
      <div style={styles.header}>
        <p style={styles.subtitle}>주제를 골라 초대 코드를 만들고<br />친구와 함께 케미를 확인해봐요</p>
      </div>

      {/* 초대 현황 + 코드 입력 버튼 */}
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

      {/* 테마 선택 */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>테마 선택</p>
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

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100dvh', backgroundColor: '#f4f4f4', paddingBottom: 32 },
  center: {
    minHeight: '100dvh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff', padding: '20px 24px 18px',
    borderBottom: '1px solid #f0f0f0', textAlign: 'center',
  },
  subtitle: { fontSize: 14, color: '#666', lineHeight: 1.7, margin: 0 },
  actionRow: {
    display: 'flex', gap: 10, padding: '16px 16px 0',
  },
  actionBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 6, padding: '16px 12px', borderRadius: 16,
    backgroundColor: '#fff', border: '1.5px solid #E8F0FE',
    cursor: 'pointer', boxShadow: '0 1px 4px rgba(49,130,246,0.08)',
  },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 13, fontWeight: 700, color: '#3182F6' },
  section: { padding: '20px 16px 0' },
  sectionLabel: { fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 12, paddingLeft: 4 },
  topicGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  topicCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    backgroundColor: '#fff', borderRadius: 16, padding: '18px 14px',
    border: '1.5px solid #f0f0f0', cursor: 'pointer', textAlign: 'left',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  topicEmoji: { fontSize: 28, marginBottom: 8 },
  topicName: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 },
  topicDesc: { fontSize: 12, color: '#999', lineHeight: 1.4 },
};
