import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getTossShareLink, loadFullScreenAd, share } from '@apps-in-toss/web-framework';
import { api } from '../api/client';
import WaitingMotion from '../components/WaitingMotion';

const INTERSTITIAL_AD_GROUP_ID =
  import.meta.env.VITE_INTERSTITIAL_AD_GROUP_ID ?? 'ait.v2.live.aed9b062f93f4df7';

const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'we-balance-game';
const POLL_INTERVAL = 5000;

export default function WaitingPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') as 'A' | 'B';
  const navigate = useNavigate();

  const [dots, setDots] = useState('.');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (!loadFullScreenAd.isSupported()) return;
    const unregister = loadFullScreenAd({
      options: { adGroupId: INTERSTITIAL_AD_GROUP_ID },
      onEvent: () => {},
      onError: () => {},
    });
    return () => unregister();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '.' : `${prev}.`));
    }, 600);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!shortCode) return;

    async function check() {
      if (navigatedRef.current) return;

      try {
        const room = await api.getRoomStatus(shortCode);
        if (room.expired) {
          navigatedRef.current = true;
          clearInterval(intervalRef.current!);
          navigate('/', { replace: true });
          return;
        }

        if (room.status === 'COMPLETE') {
          navigatedRef.current = true;
          clearInterval(intervalRef.current!);
          navigate(`/result/${shortCode}`, { replace: true });
        }
      } catch (err: any) {
        if (String(err?.message ?? '').includes('410')) {
          navigatedRef.current = true;
          clearInterval(intervalRef.current!);
          navigate('/', { replace: true });
        }
      }
    }

    check();
    intervalRef.current = setInterval(check, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [navigate, shortCode]);

  async function handlePingA() {
    try {
      const link = await getTossShareLink(`intoss://${APP_NAME}/result/${shortCode}`);
      await share({ message: link });
    } catch {
      try {
        const deepLink = `intoss://${APP_NAME}/result/${shortCode}`;
        await navigator.clipboard.writeText(deepLink);
        alert('링크를 복사했어요. 친구에게 바로 보내보세요.');
      } catch {
        alert('친구에게 한 번 더 알려주세요.');
      }
    }
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes waiting-radar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes waiting-radar-pulse {
          0% { transform: scale(0.92); opacity: 0.8; box-shadow: 0 0 0 0 rgba(0,199,115,0.42); }
          70% { transform: scale(1.18); opacity: 0; box-shadow: 0 0 0 14px rgba(0,199,115,0); }
          100% { transform: scale(0.92); opacity: 0; box-shadow: 0 0 0 0 rgba(0,199,115,0); }
        }
        @keyframes waiting-dot-breathe {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0,199,115,0.34); }
          70% { transform: scale(1.08); box-shadow: 0 0 0 10px rgba(0,199,115,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0,199,115,0); }
        }
      `}</style>
      <div style={styles.content}>
        <WaitingMotion
          title={role === 'A' ? '친구 진행 상황 확인 중' : '결과 동기화 준비 중'}
          subtitle={role === 'A' ? '실시간으로 방 상태를 확인하고 있어요' : '서버와 결과 상태를 맞추고 있어요'}
        />

        <h2 style={styles.title}>
          {role === 'A' ? `친구가 답변 중이에요${dots}` : `결과를 정리하고 있어요${dots}`}
        </h2>
        <p style={styles.desc}>
          {role === 'A'
            ? '답변이 끝나면 자동으로 결과 화면으로 이동해요.'
            : '잠시만 기다리면 결과를 바로 보여드릴게요.'}
        </p>

        {role === 'B' && (
          <button type="button" style={styles.pingBtn} onClick={handlePingA}>
            <span>알림</span>
            친구에게 "나 다 했어!" 알려주기
          </button>
        )}

        <div style={styles.waitInfo}>
          <span style={styles.waitDot} />
          연결됨 · 실시간 확인 중
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh',
    background:
      'linear-gradient(180deg, rgba(237,245,255,0.65) 0%, rgba(244,244,244,1) 26%, rgba(244,244,244,1) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: { width: '100%', maxWidth: 340, textAlign: 'center' },
  title: { fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 10, letterSpacing: -0.3 },
  desc: { fontSize: 14, color: '#6B7684', lineHeight: 1.7, marginBottom: 28 },
  pingBtn: {
    width: '100%',
    padding: '16px 20px',
    borderRadius: 16,
    border: 'none',
    backgroundColor: '#FEE500',
    fontSize: 15,
    fontWeight: 700,
    color: '#3C1E1E',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    boxShadow: '0 10px 24px rgba(60,30,30,0.08)',
  },
  waitInfo: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: 13,
    color: '#7B8794',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '10px 14px',
    borderRadius: 999,
    boxShadow: '0 8px 18px rgba(15,23,42,0.05)',
  },
  waitDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#00C773',
    display: 'inline-block',
    animation: 'waiting-dot-breathe 1.5s ease-out infinite',
  },
};
