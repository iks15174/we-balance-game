import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { TOPICS_DATA } from '../data/topics';
import { useAuth } from '../hooks/useAuth';

const CUSTOM_AD_GROUP_ID = import.meta.env.VITE_REWARDED_AD_GROUP_ID ?? 'ait.dev.43daa14da3ae487b';

export default function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn, validating, login } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);
  const [customAdLoaded, setCustomAdLoaded] = useState(false);
  const unregisterRef = useRef<(() => void) | null>(null);

  // 커스텀 게임용 보상형 광고 미리 로드
  useEffect(() => {
    if (!loadFullScreenAd.isSupported()) return;
    const unregister = loadFullScreenAd({
      options: { adGroupId: CUSTOM_AD_GROUP_ID },
      onEvent: (e) => { if (e.type === 'loaded') setCustomAdLoaded(true); },
      onError: console.error,
    });
    unregisterRef.current = unregister;
    return () => unregister();
  }, []);

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

  function handleTopicSelect(topicId: string) {
    navigate(`/intro?topicId=${topicId}`);
  }

  function handleCustomGame() {
    if (!loadFullScreenAd.isSupported()) {
      navigate('/custom');
      return;
    }
    if (!customAdLoaded) {
      alert('광고를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.');
      return;
    }
    showFullScreenAd({
      options: { adGroupId: CUSTOM_AD_GROUP_ID },
      onEvent: (e) => { if (e.type === 'userEarnedReward') navigate('/custom'); },
      onError: () => navigate('/custom'),
    });
  }

  if (validating || loginLoading) {
    return (
      <div style={styles.center}>
        <p style={{ fontSize: 13, color: '#999' }}>잠시만 기다려 주세요...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <p style={styles.sectionLabel}>테마 선택</p>
          <button style={styles.myRoomsLink} onClick={() => navigate('/my-rooms')}>
            초대 현황 →
          </button>
        </div>
        <div style={styles.topicGrid}>
          {TOPICS_DATA.map((topic) => (
            <button key={topic.id} style={styles.topicCard} onClick={() => handleTopicSelect(topic.id)}>
              <span style={styles.topicEmoji}>{topic.emoji}</span>
              <span style={styles.topicName}>{topic.name}</span>
              <span style={styles.topicDesc}>{topic.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.divider} />

      <button style={styles.customBtn} onClick={handleCustomGame}>
        <span style={styles.customIcon}>✏️</span>
        <div>
          <div style={styles.customTitle}>우리만의 밸런스 게임 만들기</div>
          <div style={styles.customSubtitle}>광고 1회 시청 후 이용 가능</div>
        </div>
        <span style={styles.arrow}>›</span>
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100dvh', backgroundColor: '#f4f4f4', paddingBottom: 32 },
  center: {
    minHeight: '100dvh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center',
  },
  section: { padding: '20px 16px 0' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingLeft: 4 },
  sectionLabel: { fontSize: 13, fontWeight: 600, color: '#888' },
  myRoomsLink: {
    fontSize: 13, color: '#3182F6', fontWeight: 600,
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
  },
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
  divider: { height: 8, backgroundColor: '#f4f4f4', margin: '24px 0 0' },
  customBtn: {
    display: 'flex', alignItems: 'center', gap: 14,
    width: 'calc(100% - 32px)', margin: '0 16px',
    backgroundColor: '#fff', borderRadius: 16, padding: '18px 16px',
    border: '1.5px solid #3182F6', cursor: 'pointer', textAlign: 'left',
  },
  customIcon: { fontSize: 28, flexShrink: 0 },
  customTitle: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 2 },
  customSubtitle: { fontSize: 12, color: '#3182F6', fontWeight: 500 },
  arrow: { fontSize: 22, color: '#ccc', marginLeft: 'auto' },
};
