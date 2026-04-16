import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { share, getTossShareLink, loadFullScreenAd } from '@apps-in-toss/web-framework';
import { api } from '../api/client';

const INTERSTITIAL_AD_GROUP_ID =
  import.meta.env.VITE_INTERSTITIAL_AD_GROUP_ID ?? 'ait.v2.live.aed9b062f93f4df7';

const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'we-balance-game';
const POLL_INTERVAL = 5000; // 5초마다 폴링

export default function WaitingPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') as 'A' | 'B';
  const navigate = useNavigate();

  const [dots, setDots] = useState('.');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigatedRef = useRef(false); // 중복 navigate 방지

  // ResultPage에서 바로 광고를 표시할 수 있도록 미리 로딩
  useEffect(() => {
    if (!loadFullScreenAd.isSupported()) return;
    const unregister = loadFullScreenAd({
      options: { adGroupId: INTERSTITIAL_AD_GROUP_ID },
      onEvent: () => {},
      onError: () => {},
    });
    return () => unregister();
  }, []);

  // 애니메이션 점
  useEffect(() => {
    const t = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'));
    }, 600);
    return () => clearInterval(t);
  }, []);

  // 결과 폴링 (양쪽 완료 여부 확인)
  useEffect(() => {
    if (!shortCode) return;

    async function check() {
      if (navigatedRef.current) return;
      try {
        const room = await api.getRoom(shortCode!);
        if (room.status === 'COMPLETE') {
          navigatedRef.current = true;
          clearInterval(intervalRef.current!);
          // replace: true → 결과 화면에서 뒤로가기 시 WaitingPage로 돌아오지 않음
          navigate(`/result/${shortCode}`, { replace: true });
        }
      } catch {
        // 에러 무시, 계속 폴링
      }
    }

    check();
    intervalRef.current = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current!);
  }, [shortCode, navigate]);

  async function handlePingA() {
    try {
      const link = await getTossShareLink(`intoss://${APP_NAME}/result/${shortCode}`);
      await share({ message: link });
    } catch {
      try {
        const deepLink = `intoss://${APP_NAME}/result/${shortCode}`;
        await navigator.clipboard.writeText(deepLink);
        alert('링크가 복사됐어요! 친구에게 보내세요.');
      } catch {
        alert('친구에게 알려주세요!');
      }
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.animEmoji}>🔍</div>
        <h2 style={styles.title}>
          {role === 'A'
            ? `친구가 답변 중이에요${dots}`
            : `결과 분석 중이에요${dots}`}
        </h2>
        <p style={styles.desc}>
          {role === 'A'
            ? '친구가 다 풀면 자동으로 결과 화면으로 이동해요'
            : '잠시 후 결과가 나와요!'}
        </p>

        {role === 'B' && (
          <button style={styles.pingBtn} onClick={handlePingA}>
            <span>💬</span>
            친구에게 "다 풀었어!" 알려주기
          </button>
        )}

        <div style={styles.waitInfo}>
          <span style={styles.waitDot} />
          실시간 확인 중
        </div>
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
  animEmoji: { fontSize: 56, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 10 },
  desc: { fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 28 },
  pingBtn: {
    width: '100%', padding: '16px 20px', borderRadius: 16, border: 'none',
    backgroundColor: '#FEE500', fontSize: 15, fontWeight: 700, color: '#3C1E1E',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 20,
  },
  waitInfo: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, fontSize: 13, color: '#aaa',
  },
  waitDot: {
    width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4CAF50',
    display: 'inline-block',
  },
};
